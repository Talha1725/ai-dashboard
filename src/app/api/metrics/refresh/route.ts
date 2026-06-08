import { NextRequest, NextResponse } from "next/server";
import { refreshMetricSnapshot } from "@/lib/services/metrics";

export async function POST(request: NextRequest) {
  const configuredSecret = process.env.METRICS_REFRESH_SECRET;
  const providedSecret = request.headers.get("x-refresh-secret");

  if (configuredSecret && configuredSecret !== providedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const snapshot = await refreshMetricSnapshot();

  return NextResponse.json(snapshot);
}
