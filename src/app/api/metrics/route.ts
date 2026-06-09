import { NextRequest, NextResponse } from "next/server";
import { requireAuthResponse } from "@/lib/auth/guard";
import { getLatestMetricSnapshot } from "@/lib/services/metrics";

export async function GET(request: NextRequest) {
  const { response } = await requireAuthResponse(request);

  if (response) {
    return response;
  }

  const snapshot = await getLatestMetricSnapshot();

  return NextResponse.json(snapshot);
}
