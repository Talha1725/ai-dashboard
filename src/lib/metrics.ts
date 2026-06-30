import type { MetricSnapshot } from "@/types/metrics";

export type { MetricSnapshot, MetricStatus } from "@/types/metrics";

export const metricSnapshot: MetricSnapshot = {
  refreshedAt: new Date().toISOString(),
  integrations: [
    {
      key: "internal_app",
      label: "Internal app",
      status: "missing_credentials",
      message: "API details pending",
    },
    {
      key: "cashflow_upload",
      label: "Cashflow upload",
      status: "connected",
      lastUpdated: "2026-06-08T08:25:00.000Z",
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
  ],
  cashflow: {
    status: "warning",
    source: "Excel upload",
    weeks: [],
  },
  profit: {
    status: "warning",
    source: "Excel upload",
    net: 0,
    netMargin: 0,
    gross: 0,
    grossMargin: 0,
  },
  overtime: {
    status: "good",
    source: "Internal app",
    hours: 0,
    teamPercent: 0,
    costImpact: 0,
  },
  deliveries: {
    status: "good",
    source: "Internal app",
    jobs: [],
  },
  payments: {
    status: "good",
    source: "Excel upload",
    alerts: [],
  },
};
