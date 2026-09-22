import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (error) {
    await prisma.sourceRefreshLog.create({
      data: {
        source: "KEEP_ALIVE",
        status: "FAILED",
        message: error instanceof Error ? error.message : String(error),
      },
    });
    return NextResponse.json({ error: "Ping failed" }, { status: 500 });
  }

  await prisma.sourceRefreshLog.create({
    data: { source: "KEEP_ALIVE", status: "SUCCESS" },
  });

  return NextResponse.json({ ok: true, timestamp: new Date().toISOString() });
}
