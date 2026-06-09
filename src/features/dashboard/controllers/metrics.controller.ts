import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { requireAuthResponse } from "@/lib/auth/guard";
import { getLatestMetricSnapshot, refreshMetricSnapshot } from "@/lib/services/metrics";

export async function getMetricsController(request: NextRequest) {
  const { response } = await requireAuthResponse(request);

  if (response) {
    return response;
  }

  const snapshot = await getLatestMetricSnapshot();

  return NextResponse.json(snapshot);
}

export async function refreshMetricsController(request: NextRequest) {
  const { response } = await requireAuthResponse(request);

  if (response) {
    return response;
  }

  const snapshot = await refreshMetricSnapshot();

  return NextResponse.json(snapshot);
}
