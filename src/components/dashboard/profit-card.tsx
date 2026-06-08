import { MetricCard } from "@/components/dashboard/metric-card";
import { formatCurrency } from "@/lib/formatters";
import type { ProfitCardProps } from "@/types/metrics";

export function ProfitCard({ profit }: ProfitCardProps) {
  return (
    <MetricCard title="Monthly Profit" source={profit.source} status={profit.status}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-sm text-slate-500">Net profit</p>
          <p className="mt-1 text-3xl font-bold text-slate-950">{formatCurrency(profit.net)}</p>
          <p className="text-sm font-medium text-emerald-700">{profit.netMargin}% of revenue</p>
        </div>
        <div>
          <p className="text-sm text-slate-500">Gross profit</p>
          <p className="mt-1 text-3xl font-bold text-slate-950">
            {formatCurrency(profit.gross)}
          </p>
          <p className="text-sm font-medium text-emerald-700">{profit.grossMargin}% of revenue</p>
        </div>
      </div>
    </MetricCard>
  );
}
