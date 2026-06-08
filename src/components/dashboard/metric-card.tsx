import { StatusPill } from "@/components/dashboard/status-pill";
import type { MetricCardProps } from "@/types/metrics";

export function MetricCard({ title, source, status, children }: MetricCardProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-slate-950">{title}</h2>
          <p className="mt-1 text-xs font-medium uppercase tracking-[0.08em] text-slate-500">
            {source}
          </p>
        </div>
        <StatusPill status={status} />
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}
