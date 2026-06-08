import { MetricCard } from "@/components/dashboard/metric-card";
import type { DeliveriesCardProps } from "@/types/metrics";

export function DeliveriesCard({ deliveries }: DeliveriesCardProps) {
  return (
    <MetricCard
      title="Jobs Close To Delivery"
      source={deliveries.source}
      status={deliveries.status}
    >
      <div className="space-y-3">
        {deliveries.jobs.map((job) => (
          <div
            key={job.id}
            className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 rounded-md border border-slate-200 p-3"
          >
            <div className="min-w-0">
              <p className="truncate font-semibold text-slate-950">{job.customer}</p>
              <p className="truncate text-sm text-slate-500">
                {job.id} · {job.stage}
              </p>
            </div>
            <p className="text-right text-sm font-semibold text-amber-700">{job.due}</p>
          </div>
        ))}
      </div>
    </MetricCard>
  );
}
