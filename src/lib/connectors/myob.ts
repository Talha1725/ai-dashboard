import type { MetricSnapshot } from "@/types/metrics";

export async function fetchMyobMetrics(): Promise<
  Pick<MetricSnapshot, "profit" | "payments"> | null
> {
  const hasCredentials =
    process.env.MYOB_CLIENT_ID &&
    process.env.MYOB_CLIENT_SECRET &&
    process.env.MYOB_API_BASE_URL;

  if (!hasCredentials) {
    return null;
  }

  // TODO: Call MYOB once OAuth/API credentials and endpoints are confirmed.
  return null;
}
