import type { MetricStatus } from "@/types/metrics";

const statusStyles: Record<MetricStatus, string> = {
  good: "border-emerald-200 bg-emerald-50 text-emerald-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  alert: "border-rose-200 bg-rose-50 text-rose-800",
};

export function StatusPill({ status }: { status: MetricStatus }) {
  return (
    <span
      className={`inline-flex h-7 shrink-0 items-center rounded-full border px-3 text-xs font-semibold capitalize ${statusStyles[status]}`}
    >
      {status}
    </span>
  );
}
