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

export const metricSnapshot: MetricSnapshot = {
  refreshedAt: "2026-06-08T08:25:00.000Z",
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
    status: "warning",
    source: "Internal app",
    jobs: [
      {
        id: "JOB-1042",
        customer: "Northline Fabrication",
        due: "Tomorrow",
        stage: "Final QA",
      },
      {
        id: "JOB-1048",
        customer: "Rowlands Mining",
        due: "In 3 days",
        stage: "Packing",
      },
      {
        id: "JOB-1051",
        customer: "Metro Steel",
        due: "In 6 days",
        stage: "Production",
      },
    ],
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

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  }).format(amount);
}
