import { NextResponse } from "next/server";
import { getLatestMetricSnapshot } from "@/lib/services/metrics";

export async function GET() {
  const snapshot = await getLatestMetricSnapshot();

  return NextResponse.json(snapshot);
}
