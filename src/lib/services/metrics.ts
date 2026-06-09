import { prisma } from "@/lib/prisma";
import { metricSnapshot } from "@/lib/metrics";
import { fetchConnectTeamMetrics } from "@/lib/connectors/connect-team";
import { fetchInternalAppMetrics } from "@/lib/connectors/internal-app";
import { fetchMyobMetrics } from "@/lib/connectors/myob";
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

export async function getLatestMetricSnapshot(): Promise<MetricSnapshot> {
  try {
    const latest = await prisma.metricSnapshot.findFirst({
      orderBy: { refreshedAt: "desc" },
    });

    if (latest) {
      return normalizeMetricSnapshot(latest.payload as MetricSnapshot);
    }
  } catch {
    return normalizeMetricSnapshot(metricSnapshot);
  }

  return normalizeMetricSnapshot(metricSnapshot);
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
  const [myobMetrics, connectTeamMetrics, internalAppMetrics] = await Promise.all([
    fetchMyobMetrics(),
    fetchConnectTeamMetrics(),
    fetchInternalAppMetrics(),
  ]);

  const nextSnapshot: MetricSnapshot = {
    ...current,
    ...myobMetrics,
    ...connectTeamMetrics,
    ...internalAppMetrics,
    refreshedAt,
    integrations: getDefaultIntegrations(refreshedAt),
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
