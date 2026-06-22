import { Prisma, RefreshSource, RefreshStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { metricSnapshot } from "@/lib/metrics";
import { fetchConnectTeamMetrics } from "@/lib/connectors/connect-team";
import { fetchInternalAppMetricsResult } from "@/lib/connectors/internal-app";
import { fetchMyobMetrics } from "@/lib/connectors/myob";
import type { InternalAppFetchResult } from "@/types/internal-app";
import type { DataSourceHealth, MetricSnapshot } from "@/types/metrics";

function hasMyobCredentials() {
  return Boolean(
    process.env.MYOB_CLIENT_ID && process.env.MYOB_CLIENT_SECRET && process.env.MYOB_API_BASE_URL
  );
}

function hasConnectTeamCredentials() {
  return Boolean(process.env.CONNECT_TEAM_API_BASE_URL && process.env.CONNECT_TEAM_API_KEY);
}

function hasInternalAppCredentials() {
  return Boolean(process.env.INTERNAL_APP_API_BASE_URL && process.env.INTERNAL_APP_API_KEY);
}

function getDefaultIntegrations(refreshedAt: string): DataSourceHealth[] {
  return [
    {
      key: "myob",
      label: "MYOB",
      status: hasMyobCredentials() ? "connected" : "missing_credentials",
      message: hasMyobCredentials() ? undefined : "Credentials pending",
    },
    {
      key: "connect_team",
      label: "Connect Team",
      status: hasConnectTeamCredentials() ? "connected" : "missing_credentials",
      message: hasConnectTeamCredentials() ? undefined : "Credentials pending",
    },
    {
      key: "internal_app",
      label: "Internal app",
      status: hasInternalAppCredentials() ? "connected" : "missing_credentials",
      message: hasInternalAppCredentials() ? undefined : "API details pending",
    },
    {
      key: "excel_upload",
      label: "Excel upload",
      status: "connected",
      lastUpdated: refreshedAt,
    },
  ];
}

function normalizeMetricSnapshot(snapshot: MetricSnapshot): MetricSnapshot {
  return {
    ...snapshot,
    integrations:
      Array.isArray(snapshot.integrations) && snapshot.integrations.length > 0
        ? snapshot.integrations
        : getDefaultIntegrations(snapshot.refreshedAt),
  };
}

function markInternalAppConnected(snapshot: MetricSnapshot, refreshedAt: string): MetricSnapshot {
  return {
    ...snapshot,
    integrations: snapshot.integrations.map((integration) =>
      integration.key === "internal_app"
        ? {
            ...integration,
            status: "connected",
            lastUpdated: refreshedAt,
            message: undefined,
          }
        : integration
    ),
  };
}

function markInternalAppUnavailable(
  snapshot: MetricSnapshot,
  status: "missing_credentials" | "failed",
  message: string
): MetricSnapshot {
  return {
    ...snapshot,
    integrations: snapshot.integrations.map((integration) =>
      integration.key === "internal_app"
        ? {
            ...integration,
            status,
            message,
          }
        : integration
    ),
  };
}

async function logInternalAppRefresh(result: InternalAppFetchResult) {
  if (!result.ok && result.status === "missing_credentials") {
    return;
  }

  try {
    await prisma.sourceRefreshLog.create({
      data: {
        source: RefreshSource.INTERNAL_APP,
        status: result.ok ? RefreshStatus.SUCCESS : RefreshStatus.FAILED,
        message: result.ok
          ? `Fetched ${result.jobCount} jobs; ${result.deliveryJobCount} due within 7 days.`
          : result.message,
        endedAt: new Date(),
        metadata: result.ok
          ? {
              jobCount: result.jobCount,
              deliveryJobCount: result.deliveryJobCount,
            }
          : ({
              reason: result.status,
            } satisfies Prisma.InputJsonObject),
      },
    });
  } catch {
    // Logging should never block dashboard rendering or refresh.
  }
}

async function withLiveInternalAppMetrics(
  snapshot: MetricSnapshot,
  options: { logRefresh?: boolean } = {}
): Promise<MetricSnapshot> {
  const result = await fetchInternalAppMetricsResult();

  if (options.logRefresh) {
    await logInternalAppRefresh(result);
  }

  if (!result.ok) {
    return markInternalAppUnavailable(snapshot, result.status, result.message);
  }

  return markInternalAppConnected(
    {
      ...snapshot,
      ...result.metrics,
    },
    result.fetchedAt
  );
}

export async function getLatestMetricSnapshot(): Promise<MetricSnapshot> {
  try {
    const latest = await prisma.metricSnapshot.findFirst({
      orderBy: { refreshedAt: "desc" },
    });

    if (latest) {
      return withLiveInternalAppMetrics(normalizeMetricSnapshot(latest.payload as MetricSnapshot));
    }
  } catch {
    return withLiveInternalAppMetrics(normalizeMetricSnapshot(metricSnapshot));
  }

  return withLiveInternalAppMetrics(normalizeMetricSnapshot(metricSnapshot));
}

export async function saveMetricSnapshot(snapshot: MetricSnapshot) {
  try {
    await prisma.metricSnapshot.create({
      data: {
        payload: snapshot,
        refreshedAt: new Date(snapshot.refreshedAt),
      },
    });
  } catch {
    // The app can still serve live/mock data if the database is not configured yet.
  }
}

export async function refreshMetricSnapshot(): Promise<MetricSnapshot> {
  const current = await getLatestMetricSnapshot();
  const refreshedAt = new Date().toISOString();
  const [myobMetrics, connectTeamMetrics, internalAppResult] = await Promise.all([
    fetchMyobMetrics(),
    fetchConnectTeamMetrics(),
    fetchInternalAppMetricsResult(),
  ]);
  await logInternalAppRefresh(internalAppResult);

  const nextSnapshot: MetricSnapshot = {
    ...current,
    ...myobMetrics,
    ...connectTeamMetrics,
    ...(internalAppResult.ok ? internalAppResult.metrics : {}),
    refreshedAt,
    integrations: internalAppResult.ok
      ? markInternalAppConnected(
          {
            ...current,
            integrations: getDefaultIntegrations(refreshedAt),
          },
          internalAppResult.fetchedAt
        ).integrations
      : markInternalAppUnavailable(
          {
            ...current,
            integrations: getDefaultIntegrations(refreshedAt),
          },
          internalAppResult.status,
          internalAppResult.message
        ).integrations,
  };

  await saveMetricSnapshot(nextSnapshot);

  return nextSnapshot;
}

export async function replaceCashflowWeeks(cashflowWeeks: MetricSnapshot["cashflow"]["weeks"]) {
  const current = await getLatestMetricSnapshot();
  const refreshedAt = new Date().toISOString();
  const nextSnapshot: MetricSnapshot = {
    ...current,
    refreshedAt,
    integrations: current.integrations.map((integration) =>
      integration.key === "excel_upload"
        ? {
            ...integration,
            status: "connected",
            lastUpdated: refreshedAt,
            message: undefined,
          }
        : integration
    ),
    cashflow: {
      ...current.cashflow,
      status: "good",
      weeks: cashflowWeeks,
    },
  };

  await saveMetricSnapshot(nextSnapshot);

  return nextSnapshot;
}
