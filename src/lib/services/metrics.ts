import { Prisma, RefreshSource, RefreshStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { metricSnapshot } from "@/lib/metrics";
import { fetchConnectTeamMetrics } from "@/lib/connectors/connect-team";
import { fetchInternalAppMetricsResult } from "@/lib/connectors/internal-app";
import { fetchMyobMetrics } from "@/lib/connectors/myob";
import type { InternalAppFetchResult } from "@/types/internal-app";
import type { DataSourceHealth, MetricSnapshot, MetricStatus } from "@/types/metrics";

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

export async function replaceProfit(profitData: { netProfit: number; grossProfit: number; revenue: number }) {
  const current = await getLatestMetricSnapshot();
  const refreshedAt = new Date().toISOString();
  
  const currentPercentageNet = profitData.revenue > 0 ? Number(((profitData.netProfit / profitData.revenue) * 100).toFixed(1)) : 0;
  const currentPercentageGross = profitData.revenue > 0 ? Number(((profitData.grossProfit / profitData.revenue) * 100).toFixed(1)) : 0;

  let status: MetricStatus = "good";
  if (currentPercentageNet < 5) {
    status = "alert";
  } else if (currentPercentageNet < 10) {
    status = "warning";
  }

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
    profit: {
      ...current.profit,
      status: status,
      source: "Excel upload",
      net: profitData.netProfit,
      gross: profitData.grossProfit,
      netMargin: currentPercentageNet,
      grossMargin: currentPercentageGross,
    },
  };

  await saveMetricSnapshot(nextSnapshot);

  return nextSnapshot;
}

function formatDueDate(dueDateStr: string): { due: string; priority: "overdue" | "due tomorrow" } {
  // Parse date (Excel date string or other formats)
  let parsedDate = new Date(dueDateStr);
  
  // If excel serial date (e.g. 45473)
  if (!isNaN(Number(dueDateStr)) && Number(dueDateStr) > 30000) {
    parsedDate = new Date((Number(dueDateStr) - (25567 + 2)) * 86400 * 1000);
  }

  if (isNaN(parsedDate.getTime())) {
    // Cannot parse, fallback
    return { due: dueDateStr, priority: "overdue" };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const dateOnly = new Date(parsedDate);
  dateOnly.setHours(0, 0, 0, 0);

  const diffMs = dateOnly.getTime() - today.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  // Format the date part like "June 25, 2026"
  const formattedDate = new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(parsedDate);

  if (diffDays < 0) {
    const absDays = Math.abs(diffDays);
    return {
      due: `Overdue by ${absDays} day${absDays === 1 ? '' : 's'}`,
      priority: "overdue"
    };
  } else if (diffDays === 0) {
    return {
      due: "Due today",
      priority: "due tomorrow"
    };
  } else if (diffDays === 1) {
    return {
      due: "Due tomorrow",
      priority: "due tomorrow"
    };
  } else {
    return {
      due: `Due in ${diffDays} days · ${formattedDate}`,
      priority: "due tomorrow"
    };
  }
}

export async function replaceInvoices(invoicesData: any[]) {
  const current = await getLatestMetricSnapshot();
  const refreshedAt = new Date().toISOString();
  
  const alerts = invoicesData.map((inv) => {
    const { due, priority } = formatDueDate(inv.dueDate);
    return {
      priority, 
      customer: inv.customerName,
      amount: inv.amount,
      due: due,
      invoiceNumber: inv.invoiceNumber,
    };
  });

  let status: MetricStatus = "good";
  if (alerts.some(a => a.priority === "overdue")) {
    status = "alert";
  } else if (alerts.some(a => a.due === "Due today" || a.due === "Due tomorrow")) {
    status = "warning";
  }

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
    payments: {
      ...current.payments,
      status: status,
      source: "Excel upload",
      alerts: alerts,
    },
  };

  await saveMetricSnapshot(nextSnapshot);

  return nextSnapshot;
}
