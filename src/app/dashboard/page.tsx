import { DashboardPage } from "@/components/dashboard/dashboard-page";
import { getLatestMetricSnapshot } from "@/lib/services/metrics";

export const dynamic = "force-dynamic";

export default async function DashboardRoute() {
  const snapshot = await getLatestMetricSnapshot();

  return <DashboardPage snapshot={snapshot} />;
}
