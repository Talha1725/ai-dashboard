import { MetricCard } from "@/components/dashboard/metric-card";
import { formatCurrency } from "@/lib/formatters";
import type { CashflowCardProps } from "@/types/metrics";

export function CashflowCard({ cashflow }: CashflowCardProps) {
  const maxAmount = Math.max(...cashflow.weeks.map((week) => week.amount), 1);

  return (
    <MetricCard title="Cashflow Forecast" source={cashflow.source} status={cashflow.status}>
      <div className="space-y-4">
        {cashflow.weeks.map((week) => (
          <div
            key={week.label}
            className="grid grid-cols-[64px_minmax(0,1fr)_82px] items-center gap-3 sm:grid-cols-[72px_minmax(0,1fr)_92px]"
          >
            <span className="truncate text-sm font-medium text-slate-600">{week.label}</span>
            <div className="h-3 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-teal-600"
                style={{ width: `${Math.max((week.amount / maxAmount) * 100, 4)}%` }}
              />
            </div>
            <span className="truncate text-right text-sm font-semibold text-slate-950">
              {formatCurrency(week.amount)}
            </span>
          </div>
        ))}
      </div>
    </MetricCard>
  );
}
