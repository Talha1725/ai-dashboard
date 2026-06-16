import { MetricCard } from "@/components/dashboard/metric-card";
import { formatCurrency } from "@/lib/formatters";
import type { CashflowCardProps } from "@/types/metrics";

export function CashflowCard({ cashflow }: CashflowCardProps) {
  const maxAmount = Math.max(...cashflow.weeks.map((week) => week.amount), 1);

  return (
    <MetricCard title="Cashflow Forecast" source={cashflow.source} status={cashflow.status}>
      <div className="min-w-0 space-y-4">
        {cashflow.weeks.map((week) => (
          <div
            key={week.label}
            className="grid min-w-0 grid-cols-[minmax(108px,auto)_minmax(64px,1fr)_76px] items-center gap-2 sm:grid-cols-[minmax(128px,auto)_minmax(0,1fr)_92px] sm:gap-3"
          >
            <span className="text-sm font-medium leading-snug text-[color:var(--text-soft)]">
              {week.label}
            </span>
            <div className="dashboard-progress-track min-w-0 overflow-hidden rounded-full shadow-inner">
              <div
                className="dashboard-cashflow-bar h-3 rounded-full"
                style={{ width: `${Math.max((week.amount / maxAmount) * 100, 4)}%` }}
              />
            </div>
            <span className="truncate text-right text-sm font-semibold text-[color:var(--foreground)]">
              {formatCurrency(week.amount)}
            </span>
          </div>
        ))}
      </div>
    </MetricCard>
  );
}
