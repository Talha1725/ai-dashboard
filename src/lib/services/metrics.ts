import { Prisma, RefreshSource, RefreshStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { metricSnapshot } from "@/lib/metrics";
import { fetchConnectTeamMetrics } from "@/lib/connectors/connect-team";
import { fetchInternalAppMetricsResult } from "@/lib/connectors/internal-app";
import { fetchMyobMetrics } from "@/lib/connectors/myob";
import type { InternalAppFetchResult } from "@/types/internal-app";
import type { ParsedInvoice } from "@/types/excel";
import type { DataSourceHealth, MetricSnapshot, MetricStatus } from "@/types/metrics";

function hasConnectTeamCredentials() {
  return Boolean(process.env.CONNECT_TEAM_API_BASE_URL && process.env.CONNECT_TEAM_API_KEY);
}

function hasInternalAppCredentials() {
  return Boolean(process.env.INTERNAL_APP_API_BASE_URL && process.env.INTERNAL_APP_API_KEY);
}

function getUploadStatus({
  isUploaded,
  label,
  refreshedAt,
}: {
  isUploaded: boolean;
  label: string;
  refreshedAt: string;
}): DataSourceHealth {
  return {
    key:
      label === "Cashflow upload"
        ? "cashflow_upload"
        : label === "P&L upload"
          ? "profit_upload"
          : "invoices_upload",
    label,
    status: isUploaded ? "connected" : "missing_credentials",
    lastUpdated: isUploaded ? refreshedAt : undefined,
    message: isUploaded ? undefined : "Waiting for upload",
  };
}

function getDefaultIntegrations(refreshedAt: string): DataSourceHealth[] {
  return [
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
      key: "cashflow_upload",
      label: "Cashflow upload",
      status: "connected",
      lastUpdated: refreshedAt,
    },
    {
      key: "profit_upload",
      label: "P&L upload",
      status: "missing_credentials",
      message: "Waiting for upload",
    },
    {
      key: "invoices_upload",
      label: "Invoice upload",
      status: "missing_credentials",
      message: "Waiting for upload",
    },
  ];
}

function normalizeMetricSnapshot(snapshot: MetricSnapshot): MetricSnapshot {
  const integrations = snapshot.integrations ?? [];
  const findIntegration = (key: string) => integrations.find((integration) => integration.key === key);
  const legacyExcelUpload = findIntegration("excel_upload");
  const cashflowUpload = findIntegration("cashflow_upload") ?? legacyExcelUpload;
  const profitUpload = findIntegration("profit_upload");
  const invoicesUpload = findIntegration("invoices_upload");

  return {
    ...snapshot,
    integrations: [
      {
        status: hasConnectTeamCredentials() ? "connected" : "missing_credentials",
        message: hasConnectTeamCredentials() ? undefined : "Credentials pending",
        ...findIntegration("connect_team"),
        key: "connect_team",
        label: "Connect Team",
      },
      {
        status: hasInternalAppCredentials() ? "connected" : "missing_credentials",
        message: hasInternalAppCredentials() ? undefined : "API details pending",
        ...findIntegration("internal_app"),
        key: "internal_app",
        label: "Internal app",
      },
      {
        status: "connected",
        lastUpdated: snapshot.refreshedAt,
        ...cashflowUpload,
        key: "cashflow_upload",
        label: "Cashflow upload",
      },
      getUploadStatus({
        isUploaded: snapshot.profit.source === "Excel upload" || profitUpload?.status === "connected",
        label: "P&L upload",
        refreshedAt: profitUpload?.lastUpdated ?? snapshot.refreshedAt,
      }),
      getUploadStatus({
        isUploaded: snapshot.payments.source === "Excel upload" || invoicesUpload?.status === "connected",
        label: "Invoice upload",
        refreshedAt: invoicesUpload?.lastUpdated ?? snapshot.refreshedAt,
      }),
    ],
  };
}

function markUploadConnected(
  snapshot: MetricSnapshot,
  key: "cashflow_upload" | "profit_upload" | "invoices_upload",
  refreshedAt: string
): DataSourceHealth[] {
  return snapshot.integrations.map((integration) =>
    integration.key === key
      ? {
          ...integration,
          status: "connected",
          lastUpdated: refreshedAt,
          message: undefined,
        }
      : integration
  );
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
    integrations: markUploadConnected(current, "cashflow_upload", refreshedAt),
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
    integrations: markUploadConnected(current, "profit_upload", refreshedAt),
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

function parseInvoiceDueDate(dueDateStr: string) {
  const trimmedDate = dueDateStr.trim();
  const dateParts = trimmedDate.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);

  if (dateParts) {
    const [, day, month, year] = dateParts;

    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  if (!Number.isNaN(Number(trimmedDate)) && Number(trimmedDate) > 30000) {
    return new Date((Number(trimmedDate) - (25567 + 2)) * 86400 * 1000);
  }

  return new Date(trimmedDate);
}

function formatDueDate(dueDateStr: string): { due: string; priority: "overdue" | "due tomorrow" } {
  const parsedDate = parseInvoiceDueDate(dueDateStr);

  if (Number.isNaN(parsedDate.getTime())) {
    return { due: dueDateStr, priority: "overdue" };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const dateOnly = new Date(parsedDate);
  dateOnly.setHours(0, 0, 0, 0);

  const diffMs = dateOnly.getTime() - today.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  const formattedDate = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(parsedDate);

  if (diffDays < 0) {
    const absDays = Math.abs(diffDays);
    return {
      due: `Overdue by ${absDays} day${absDays === 1 ? "" : "s"}`,
      priority: "overdue",
    };
  } else if (diffDays === 0) {
    return {
      due: "Due today",
      priority: "due tomorrow",
    };
  } else if (diffDays === 1) {
    return {
      due: "Due tomorrow",
      priority: "due tomorrow",
    };
  } else {
    return {
      due: `Due in ${diffDays} days · ${formattedDate}`,
      priority: "due tomorrow",
    };
  }
}

export async function replaceInvoices(invoicesData: ParsedInvoice[]) {
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
    integrations: markUploadConnected(current, "invoices_upload", refreshedAt),
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
