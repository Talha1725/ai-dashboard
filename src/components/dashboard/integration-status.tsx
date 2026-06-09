import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatSnapshotDate } from "@/lib/formatters";
import type { DataSourceStatus, IntegrationStatusProps } from "@/types/metrics";

const statusLabels: Record<DataSourceStatus, string> = {
  connected: "Connected",
  missing_credentials: "Missing credentials",
  failed: "Failed",
};

const statusStyles: Record<DataSourceStatus, string> = {
  connected: "bg-success-soft text-success",
  missing_credentials: "bg-warning-soft text-warning",
  failed: "bg-danger-soft text-danger",
};

export function IntegrationStatus({ integrations }: IntegrationStatusProps) {
  return (
    <Card className="border-border/80 bg-surface/90 shadow-sm shadow-shadow-soft/50 backdrop-blur">
      <CardHeader>
        <CardTitle>Integration Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {integrations.map((integration) => (
          <div
            key={integration.key}
            className="flex items-center justify-between gap-4 rounded-md border border-border bg-surface-soft/70 p-3"
          >
            <div className="min-w-0">
              <p className="font-medium text-foreground">{integration.label}</p>
              <p className="truncate text-xs text-text-subtle">
                {integration.lastUpdated
                  ? `Last updated ${formatSnapshotDate(integration.lastUpdated)}`
                  : integration.message ?? "Waiting for setup"}
              </p>
            </div>
            <span
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[integration.status]}`}
            >
              {statusLabels[integration.status]}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
