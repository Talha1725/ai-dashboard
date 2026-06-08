import type { MetricSnapshot } from "@/types/metrics";

export async function fetchConnectTeamMetrics(): Promise<
  Pick<MetricSnapshot, "overtime"> | null
> {
  const hasCredentials =
    process.env.CONNECT_TEAM_API_BASE_URL && process.env.CONNECT_TEAM_API_KEY;

  if (!hasCredentials) {
    return null;
  }

  // TODO: Call Connect Team once API docs and auth format are confirmed.
  return null;
}
