import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatSnapshotDate } from "@/lib/formatters";
import type { DataSourceStatus, IntegrationStatusProps } from "@/types/metrics";

const statusLabels: Record<DataSourceStatus, string> = {
  connected: "Connected",
  missing_credentials: "Missing credentials",
  failed: "Failed",
};

const statusStyles: Record<DataSourceStatus, string> = {
  connected: "bg-emerald-50 text-emerald-700",
  missing_credentials: "bg-amber-50 text-amber-700",
  failed: "bg-red-50 text-red-700",
};

export function IntegrationStatus({ integrations }: IntegrationStatusProps) {
  return (
    <Card className="border-slate-200/80 bg-white/90 shadow-sm shadow-slate-200/70 backdrop-blur">
      <CardHeader>
        <CardTitle>Integration Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {integrations.map((integration) => (
          <div
            key={integration.key}
            className="flex items-center justify-between gap-4 rounded-md border border-slate-200 bg-slate-50/70 p-3"
          >
            <div className="min-w-0">
              <p className="font-medium text-slate-950">{integration.label}</p>
              <p className="truncate text-xs text-slate-500">
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
