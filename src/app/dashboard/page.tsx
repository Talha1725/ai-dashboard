import { redirect } from "next/navigation";
import { DashboardPage } from "@/components/dashboard/dashboard-page";
import { verifySessionFromCookies } from "@/lib/auth/session";
import { getLatestMetricSnapshot } from "@/lib/services/metrics";

export const dynamic = "force-dynamic";

export default async function DashboardRoute() {
  const auth = await verifySessionFromCookies();

  if (!auth.authenticated) {
    redirect("/login");
  }

  const snapshot = await getLatestMetricSnapshot();

  return <DashboardPage snapshot={snapshot} />;
}
