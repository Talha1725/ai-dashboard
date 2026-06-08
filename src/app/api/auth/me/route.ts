import { NextRequest, NextResponse } from "next/server";
import { requireAuth, unauthorizedResponse } from "@/lib/auth/guard";
import type { AuthResponse } from "@/types/auth";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);

  if (!auth.authenticated) {
    return unauthorizedResponse();
  }

  return NextResponse.json<AuthResponse>({
    user: auth.user,
  });
}
