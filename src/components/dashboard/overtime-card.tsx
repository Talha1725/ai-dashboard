import { MetricCard } from "@/components/dashboard/metric-card";
import { formatCurrency } from "@/lib/formatters";
import type { OvertimeCardProps } from "@/types/metrics";

export function OvertimeCard({ overtime }: OvertimeCardProps) {
  const percentage = Math.min(Math.max(overtime.teamPercent, 0), 100);

  return (
    <MetricCard title="Weekly Overtime" source={overtime.source} status={overtime.status}>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <div
          className="grid size-32 shrink-0 place-items-center rounded-full"
          style={{
            background: `conic-gradient(var(--warning-border) ${percentage * 3.6}deg, var(--progress-track) 0deg)`,
          }}
        >
          <div className="grid size-24 place-items-center rounded-full bg-[color:var(--surface)] text-center shadow-inner">
            <div>
              <div className="text-3xl font-bold text-[color:var(--foreground)]">{overtime.hours}</div>
              <div className="text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--text-subtle)]">
                hours
              </div>
            </div>
          </div>
        </div>
        <div>
          <p className="text-sm text-[color:var(--text-soft)]">{percentage}% of team in overtime</p>
          <p className="mt-2 text-2xl font-bold text-[color:var(--foreground)]">
            +{formatCurrency(overtime.costImpact)}
          </p>
          <p className="text-sm text-[color:var(--text-subtle)]">cost impact this week</p>
        </div>
      </div>
    </MetricCard>
  );
}
