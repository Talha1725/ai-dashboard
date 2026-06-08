import "server-only";

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { verifySessionFromRequest } from "@/lib/auth/session";
import type { AuthResult } from "@/types/auth";

export function unauthorizedResponse() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function requireAuth(request: NextRequest): Promise<AuthResult> {
  return verifySessionFromRequest(request);
}

export async function requireAuthResponse(request: NextRequest) {
  const auth = await requireAuth(request);

  if (!auth.authenticated) {
    return {
      auth,
      response: unauthorizedResponse(),
    };
  }

  return {
    auth,
    response: null,
  };
}
