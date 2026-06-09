import { MetricCard } from "@/components/dashboard/metric-card";
import { formatCurrency } from "@/lib/formatters";
import type { ProfitCardProps } from "@/types/metrics";

export function ProfitCard({ profit }: ProfitCardProps) {
  return (
    <MetricCard title="Monthly Profit" source={profit.source} status={profit.status}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-sm text-[color:var(--text-subtle)]">Net profit</p>
          <p className="mt-1 text-3xl font-bold text-[color:var(--foreground)]">{formatCurrency(profit.net)}</p>
          <p className="text-sm font-medium text-[color:var(--success)]">{profit.netMargin}% of revenue</p>
        </div>
        <div>
          <p className="text-sm text-[color:var(--text-subtle)]">Gross profit</p>
          <p className="mt-1 text-3xl font-bold text-[color:var(--foreground)]">
            {formatCurrency(profit.gross)}
          </p>
          <p className="text-sm font-medium text-[color:var(--success)]">{profit.grossMargin}% of revenue</p>
        </div>
      </div>
    </MetricCard>
  );
}
