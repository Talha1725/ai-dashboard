import type { ReactNode } from "react";

export type MetricStatus = "good" | "warning" | "alert";
export type DataSourceStatus = "connected" | "missing_credentials" | "failed";
export type DataSourceKey = "myob" | "connect_team" | "internal_app" | "excel_upload";

export type DataSourceHealth = {
  key: DataSourceKey;
  label: string;
  status: DataSourceStatus;
  lastUpdated?: string;
  message?: string;
};

export type CashflowWeek = {
  label: string;
  amount: number;
};

export type DeliveryJob = {
  id: string;
  customer: string;
  due: string;
  stage: string;
};

export type PaymentAlert = {
  customer: string;
  amount: number;
  due: string;
  priority: "overdue" | "due tomorrow";
};

export type MetricSnapshot = {
  refreshedAt: string;
  integrations: DataSourceHealth[];
  cashflow: {
    status: MetricStatus;
    source: "Excel upload";
    weeks: CashflowWeek[];
  };
  profit: {
    status: MetricStatus;
    source: "MYOB";
    net: number;
    netMargin: number;
    gross: number;
    grossMargin: number;
  };
  overtime: {
    status: MetricStatus;
    source: "Connect Team";
    hours: number;
    teamPercent: number;
    costImpact: number;
  };
  deliveries: {
    status: MetricStatus;
    source: "Internal app";
    jobs: DeliveryJob[];
  };
  payments: {
    status: MetricStatus;
    source: "MYOB";
    alerts: PaymentAlert[];
  };
};

export type MetricCardProps = {
  title: string;
  source: string;
  status: MetricStatus;
  children: ReactNode;
};

export type DashboardPageProps = {
  snapshot: MetricSnapshot;
};

export type CashflowCardProps = {
  cashflow: MetricSnapshot["cashflow"];
};

export type ProfitCardProps = {
  profit: MetricSnapshot["profit"];
};

export type OvertimeCardProps = {
  overtime: MetricSnapshot["overtime"];
};

export type DeliveriesCardProps = {
  deliveries: MetricSnapshot["deliveries"];
};

export type PaymentsCardProps = {
  payments: MetricSnapshot["payments"];
};

export type IntegrationStatusProps = {
  integrations: DataSourceHealth[];
};
