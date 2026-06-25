import type { MetricSnapshot } from "@/types/metrics";

export type { MetricSnapshot, MetricStatus } from "@/types/metrics";

export const metricSnapshot: MetricSnapshot = {
  refreshedAt: "2026-06-08T08:25:00.000Z",
  integrations: [
    {
      key: "connect_team",
      label: "Connect Team",
      status: "missing_credentials",
      message: "Credentials pending",
    },
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
    status: "good",
    source: "Excel upload",
    weeks: [
      { label: "Week 1", amount: 45000 },
      { label: "Week 2", amount: 52000 },
      { label: "Week 3", amount: 48500 },
      { label: "Week 4", amount: 61000 },
    ],
  },
  profit: {
    status: "good",
    source: "MYOB",
    net: 45000,
    netMargin: 12.5,
    gross: 75000,
    grossMargin: 18.2,
  },
  overtime: {
    status: "warning",
    source: "Connect Team",
    hours: 24,
    teamPercent: 30,
    costImpact: 2400,
  },
  deliveries: {
    status: "good",
    source: "Internal app",
    jobs: [],
  },
  payments: {
    status: "alert",
    source: "MYOB",
    alerts: [
      {
        customer: "Anderson Plant Hire",
        amount: 12800,
        due: "Overdue by 4 days",
        priority: "overdue",
      },
      {
        customer: "Harbor Components",
        amount: 6400,
        due: "Due tomorrow",
        priority: "due tomorrow",
      },
    ],
  },
};
