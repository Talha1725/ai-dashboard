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
            className="dashboard-danger-panel rounded-md border p-3"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="min-w-0 font-semibold text-[color:var(--foreground)]">{alert.customer}</p>
              <p className="shrink-0 text-sm font-bold text-[color:var(--danger)]">
                {formatCurrency(alert.amount)}
              </p>
            </div>
            <p className="mt-1 text-sm font-medium capitalize text-[color:var(--danger)]">
              {alert.priority} · {alert.due}
            </p>
          </div>
        ))}
      </div>
    </MetricCard>
  );
}
