import { StatusPill } from "@/components/dashboard/status-pill";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { MetricCardProps } from "@/types/metrics";

export function MetricCard({ title, source, status, children }: MetricCardProps) {
  return (
    <Card className="dashboard-card-surface w-full min-w-0 max-w-full overflow-hidden backdrop-blur transition-shadow">
      <CardHeader className="min-w-0 flex-row items-start justify-between gap-4 space-y-0 pb-4">
        <div className="min-w-0">
          <CardTitle>{title}</CardTitle>
          <CardDescription className="mt-1">{source}</CardDescription>
        </div>
        <StatusPill status={status} />
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
