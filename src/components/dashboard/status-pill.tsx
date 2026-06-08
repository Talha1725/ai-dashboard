import { Badge } from "@/components/ui/badge";
import type { MetricStatus } from "@/types/metrics";

export function StatusPill({ status }: { status: MetricStatus }) {
  return <Badge variant={status}>{status}</Badge>;
}
