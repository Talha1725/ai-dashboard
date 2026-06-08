import { NextResponse } from "next/server";
import { metricSnapshot } from "@/lib/metrics";

export async function GET() {
  return NextResponse.json(metricSnapshot);
}
