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
            background: `conic-gradient(#d97706 ${percentage * 3.6}deg, #f1f5f9 0deg)`,
          }}
        >
          <div className="grid size-24 place-items-center rounded-full bg-white text-center">
            <div>
              <div className="text-3xl font-bold text-slate-950">{overtime.hours}</div>
              <div className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                hours
              </div>
            </div>
          </div>
        </div>
        <div>
          <p className="text-sm text-slate-600">{percentage}% of team in overtime</p>
          <p className="mt-2 text-2xl font-bold text-slate-950">
            +{formatCurrency(overtime.costImpact)}
          </p>
          <p className="text-sm text-slate-500">cost impact this week</p>
        </div>
      </div>
    </MetricCard>
  );
}
