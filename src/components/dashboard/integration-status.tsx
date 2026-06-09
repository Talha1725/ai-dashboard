import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatSnapshotDate } from "@/lib/formatters";
import type { DataSourceStatus, IntegrationStatusProps } from "@/types/metrics";

const statusLabels: Record<DataSourceStatus, string> = {
  connected: "Connected",
  missing_credentials: "Missing credentials",
  failed: "Failed",
};

const statusStyles: Record<DataSourceStatus, string> = {
  connected: "bg-emerald-500/15 text-emerald-100",
  missing_credentials: "bg-amber-500/15 text-amber-100",
  failed: "bg-rose-500/15 text-rose-100",
};

export function IntegrationStatus({ integrations }: IntegrationStatusProps) {
  return (
    <Card className="border-slate-800 bg-slate-950 text-white">
      <CardHeader>
        <CardTitle>Integration Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {integrations.map((integration) => (
          <div key={integration.key} className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-slate-200">{integration.label}</p>
              <p className="truncate text-xs text-slate-400">
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
