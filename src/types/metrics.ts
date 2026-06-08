export type Status = "good" | "warning" | "alert";

export type MetricSnapshot = {
  refreshedAt: string;
  cashflow: {
    status: Status;
    source: "Excel upload";
    weeks: Array<{
      label: string;
      amount: number;
    }>;
  };
  profit: {
    status: Status;
    source: "MYOB";
    net: number;
    netMargin: number;
    gross: number;
    grossMargin: number;
  };
  overtime: {
    status: Status;
    source: "Connect Team";
    hours: number;
    teamPercent: number;
    costImpact: number;
  };
  deliveries: {
    status: Status;
    source: "Internal app";
    jobs: Array<{
      id: string;
      customer: string;
      due: string;
      stage: string;
    }>;
  };
  payments: {
    status: Status;
    source: "MYOB";
    alerts: Array<{
      customer: string;
      amount: number;
      due: string;
      priority: "overdue" | "due tomorrow";
    }>;
  };
};
