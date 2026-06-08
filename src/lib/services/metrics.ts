import { prisma } from "@/lib/prisma";
import { metricSnapshot } from "@/lib/metrics";
import { fetchConnectTeamMetrics } from "@/lib/connectors/connect-team";
import { fetchInternalAppMetrics } from "@/lib/connectors/internal-app";
import { fetchMyobMetrics } from "@/lib/connectors/myob";
import type { MetricSnapshot } from "@/types/metrics";

export async function getLatestMetricSnapshot(): Promise<MetricSnapshot> {
  try {
    const latest = await prisma.metricSnapshot.findFirst({
      orderBy: { refreshedAt: "desc" },
    });

    if (latest) {
      return latest.payload as MetricSnapshot;
    }
  } catch {
    return metricSnapshot;
  }

  return metricSnapshot;
}

export async function saveMetricSnapshot(snapshot: MetricSnapshot) {
  try {
    await prisma.metricSnapshot.create({
      data: {
        payload: snapshot,
        refreshedAt: new Date(snapshot.refreshedAt),
      },
    });
  } catch {
    // The app can still serve live/mock data if the database is not configured yet.
  }
}

export async function refreshMetricSnapshot(): Promise<MetricSnapshot> {
  const current = await getLatestMetricSnapshot();
  const [myobMetrics, connectTeamMetrics, internalAppMetrics] = await Promise.all([
    fetchMyobMetrics(),
    fetchConnectTeamMetrics(),
    fetchInternalAppMetrics(),
  ]);

  const nextSnapshot: MetricSnapshot = {
    ...current,
    ...myobMetrics,
    ...connectTeamMetrics,
    ...internalAppMetrics,
    refreshedAt: new Date().toISOString(),
  };

  await saveMetricSnapshot(nextSnapshot);

  return nextSnapshot;
}

export async function replaceCashflowWeeks(cashflowWeeks: MetricSnapshot["cashflow"]["weeks"]) {
  const current = await getLatestMetricSnapshot();
  const nextSnapshot: MetricSnapshot = {
    ...current,
    refreshedAt: new Date().toISOString(),
    cashflow: {
      ...current.cashflow,
      status: "good",
      weeks: cashflowWeeks,
    },
  };

  await saveMetricSnapshot(nextSnapshot);

  return nextSnapshot;
}
