import { NextRequest, NextResponse } from "next/server";
import { clearSessionCookie, revokeSessionFromRequest } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  await revokeSessionFromRequest(request);

  const response = NextResponse.json({ ok: true });
  clearSessionCookie(response);

  return response;
}
