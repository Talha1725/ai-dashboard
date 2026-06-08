import { NextRequest, NextResponse } from "next/server";
import { requireAuthResponse } from "@/lib/auth/guard";
import { refreshMetricSnapshot } from "@/lib/services/metrics";

export async function POST(request: NextRequest) {
  const { response } = await requireAuthResponse(request);

  if (response) {
    return response;
  }

  const snapshot = await refreshMetricSnapshot();

  return NextResponse.json(snapshot);
}
