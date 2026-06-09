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
    <Card className="border-slate-200/80 bg-white/90 shadow-sm shadow-slate-200/70 backdrop-blur transition-shadow hover:shadow-md hover:shadow-slate-200/80">
      <CardHeader className="flex-row items-start justify-between gap-4 space-y-0 pb-4">
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
