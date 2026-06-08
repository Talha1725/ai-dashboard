import type { MetricSnapshot } from "@/lib/metrics";

export async function fetchInternalAppMetrics(): Promise<
  Pick<MetricSnapshot, "deliveries"> | null
> {
  const hasCredentials =
    process.env.INTERNAL_APP_API_BASE_URL && process.env.INTERNAL_APP_API_KEY;

  if (!hasCredentials) {
    return null;
  }

  // TODO: Call the internal job tracking app once source/API shape is confirmed.
  return null;
}
