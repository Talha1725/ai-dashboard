import { MetricCard } from "@/components/dashboard/metric-card";
import { formatCurrency } from "@/lib/formatters";
import type { PaymentsCardProps } from "@/types/metrics";

export function PaymentsCard({ payments }: PaymentsCardProps) {
  return (
    <MetricCard title="Payment Alerts" source={payments.source} status={payments.status}>
      <div className="space-y-3">
        {payments.alerts.map((alert) => (
          <div
            key={`${alert.customer}-${alert.amount}-${alert.due}`}
            className="rounded-md border border-rose-200 bg-rose-50 p-3"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="min-w-0 font-semibold text-slate-950">{alert.customer}</p>
              <p className="shrink-0 text-sm font-bold text-rose-800">
                {formatCurrency(alert.amount)}
              </p>
            </div>
            <p className="mt-1 text-sm font-medium capitalize text-rose-700">
              {alert.priority} · {alert.due}
            </p>
          </div>
        ))}
      </div>
    </MetricCard>
  );
}
