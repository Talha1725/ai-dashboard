import { MetricCard } from "@/components/dashboard/metric-card";
import type { DeliveriesCardProps } from "@/types/metrics";

export function DeliveriesCard({ deliveries }: DeliveriesCardProps) {
  return (
    <MetricCard
      title="Jobs Close To Delivery"
      source={deliveries.source}
      status={deliveries.status}
    >
      <div className="min-w-0 space-y-3">
        {deliveries.jobs.map((job) => (
          <div
            key={job.id}
            className="dashboard-soft-panel grid min-w-0 grid-cols-[minmax(0,1fr)_auto] gap-3 rounded-md border p-3"
          >
            <div className="min-w-0">
              <p className="truncate font-semibold text-[color:var(--foreground)]">{job.customer}</p>
              <p className="truncate text-sm text-[color:var(--text-subtle)]">
                {job.id} · {job.stage}
              </p>
            </div>
            <p className="text-right text-sm font-semibold text-[color:var(--warning)]">{job.due}</p>
          </div>
        ))}
      </div>
    </MetricCard>
  );
}
