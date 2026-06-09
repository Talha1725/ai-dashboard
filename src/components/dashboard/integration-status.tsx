import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatSnapshotDate } from "@/lib/formatters";
import type { DataSourceStatus, IntegrationStatusProps } from "@/types/metrics";

const statusLabels: Record<DataSourceStatus, string> = {
  connected: "Connected",
  missing_credentials: "Missing credentials",
  failed: "Failed",
};

const statusStyles: Record<DataSourceStatus, string> = {
  connected: "bg-[color:var(--success-soft)] text-[color:var(--success)]",
  missing_credentials: "bg-[color:var(--warning-soft)] text-[color:var(--warning)]",
  failed: "bg-[color:var(--danger-soft)] text-[color:var(--danger)]",
};

export function IntegrationStatus({ integrations }: IntegrationStatusProps) {
  return (
    <Card className="dashboard-card-surface overflow-hidden backdrop-blur">
      <CardHeader>
        <CardTitle>Integration Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {integrations.map((integration) => (
          <div
            key={integration.key}
            className="dashboard-soft-panel flex min-w-0 items-center justify-between gap-3 rounded-md border p-3"
          >
            <div className="min-w-0">
              <p className="font-medium text-[color:var(--foreground)]">{integration.label}</p>
              <p className="truncate text-xs text-[color:var(--text-subtle)]">
                {integration.lastUpdated
                  ? `Last updated ${formatSnapshotDate(integration.lastUpdated)}`
                  : integration.message ?? "Waiting for setup"}
              </p>
            </div>
            <span
              className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold sm:px-3 ${statusStyles[integration.status]}`}
            >
              {statusLabels[integration.status]}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
