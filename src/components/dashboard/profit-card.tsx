import { MetricCard } from "@/components/dashboard/metric-card";
import { formatCurrency } from "@/lib/formatters";
import type { MetricStatus, ProfitCardProps } from "@/types/metrics";

function statusColor(status: MetricStatus): string {
  if (status === "alert") return "var(--danger)";
  if (status === "warning") return "var(--warning)";
  return "var(--success)";
}

export function ProfitCard({ profit }: ProfitCardProps) {
  const color = statusColor(profit.status);
  return (
    <MetricCard title="Monthly Profit" source={profit.source} status={profit.status}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-sm text-[color:var(--text-subtle)]">Net profit</p>
          <p className="mt-1 text-3xl font-bold text-[color:var(--foreground)]">{formatCurrency(profit.net)}</p>
          <p className="text-sm font-medium" style={{ color }}>{profit.netMargin}% of revenue</p>
        </div>
        <div>
          <p className="text-sm text-[color:var(--text-subtle)]">Gross profit</p>
          <p className="mt-1 text-3xl font-bold text-[color:var(--foreground)]">
            {formatCurrency(profit.gross)}
          </p>
          <p className="text-sm font-medium" style={{ color }}>{profit.grossMargin}% of revenue</p>
        </div>
      </div>
    </MetricCard>
  );
}
