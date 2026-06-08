import { NextRequest, NextResponse } from "next/server";
import { findAdminByEmail, toAuthUser } from "@/lib/auth/admin";
import { verifyPassword } from "@/lib/auth/password";
import { createAuthSession, setSessionCookie } from "@/lib/auth/session";
import type { AuthResponse, LoginPayload } from "@/types/auth";

function parseLoginPayload(value: unknown): LoginPayload | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const payload = value as Partial<LoginPayload>;

  if (typeof payload.email !== "string" || typeof payload.password !== "string") {
    return null;
  }

  return {
    email: payload.email.trim().toLowerCase(),
    password: payload.password,
  };
}

export async function POST(request: NextRequest) {
  const payload = parseLoginPayload(await request.json().catch(() => null));

  if (!payload) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  const admin = await findAdminByEmail(payload.email);

  if (!admin || !(await verifyPassword(payload.password, admin.passwordHash))) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  const session = await createAuthSession(admin.id);
  const response = NextResponse.json<AuthResponse>({
    user: toAuthUser(admin),
  });

  setSessionCookie(response, session.token, session.expiresAt);

  return response;
}
