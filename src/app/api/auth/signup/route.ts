import { NextRequest, NextResponse } from "next/server";
import { createAdminUser, findAdminByEmail, toAuthUser } from "@/lib/auth/admin";
import { hashPassword } from "@/lib/auth/password";
import { createAuthSession, setSessionCookie } from "@/lib/auth/session";
import type { AuthResponse, SignupPayload } from "@/types/auth";

function parseSignupPayload(value: unknown): SignupPayload | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const payload = value as Partial<SignupPayload>;

  if (
    typeof payload.fullName !== "string" ||
    typeof payload.email !== "string" ||
    typeof payload.password !== "string" ||
    typeof payload.confirmPassword !== "string"
  ) {
    return null;
  }

  return {
    fullName: payload.fullName.trim(),
    email: payload.email.trim().toLowerCase(),
    password: payload.password,
    confirmPassword: payload.confirmPassword,
  };
}

export async function POST(request: NextRequest) {
  const payload = parseSignupPayload(await request.json().catch(() => null));

  if (!payload) {
    return NextResponse.json({ error: "Name, email, and password are required." }, { status: 400 });
  }

  if (payload.fullName.length < 2) {
    return NextResponse.json({ error: "Full name must be at least 2 characters." }, { status: 400 });
  }

  if (payload.password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }

  if (payload.password !== payload.confirmPassword) {
    return NextResponse.json({ error: "Passwords do not match." }, { status: 400 });
  }

  const existingAdmin = await findAdminByEmail(payload.email);

  if (existingAdmin) {
    return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
  }

  const admin = await createAdminUser({
    email: payload.email,
    name: payload.fullName,
    passwordHash: await hashPassword(payload.password),
  });
  const session = await createAuthSession(admin.id);
  const response = NextResponse.json<AuthResponse>({
    user: toAuthUser(admin),
  });

  setSessionCookie(response, session.token, session.expiresAt);

  return response;
}
