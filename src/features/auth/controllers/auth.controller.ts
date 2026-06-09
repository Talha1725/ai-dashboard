import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { requireAuth, unauthorizedResponse } from "@/lib/auth/guard";
import { clearSessionCookie, revokeSessionFromRequest, setSessionCookie } from "@/lib/auth/session";
import {
  loginAdmin,
  resetAdminPassword,
  sendAdminPasswordReset,
  signupAdmin,
} from "@/features/auth/services/auth.service";
import type {
  AuthResponse,
  ForgotPasswordPayload,
  LoginPayload,
  ResetPasswordPayload,
  SignupPayload,
} from "@/types/auth";

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

function parseForgotPasswordPayload(value: unknown): ForgotPasswordPayload | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const payload = value as Partial<ForgotPasswordPayload>;

  if (typeof payload.email !== "string") {
    return null;
  }

  return {
    email: payload.email.trim().toLowerCase(),
  };
}

function parseResetPasswordPayload(value: unknown): ResetPasswordPayload | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const payload = value as Partial<ResetPasswordPayload>;

  if (
    typeof payload.token !== "string" ||
    typeof payload.password !== "string" ||
    typeof payload.confirmPassword !== "string"
  ) {
    return null;
  }

  return {
    token: payload.token,
    password: payload.password,
    confirmPassword: payload.confirmPassword,
  };
}

export async function loginController(request: NextRequest) {
  const payload = parseLoginPayload(await request.json().catch(() => null));

  if (!payload) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  const result = await loginAdmin(payload);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const response = NextResponse.json<AuthResponse>({
    user: result.data.user,
  });

  setSessionCookie(response, result.data.session.token, result.data.session.expiresAt);

  return response;
}

export async function signupController(request: NextRequest) {
  const payload = parseSignupPayload(await request.json().catch(() => null));

  if (!payload) {
    return NextResponse.json({ error: "Name, email, and password are required." }, { status: 400 });
  }

  const result = await signupAdmin(payload);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const response = NextResponse.json<AuthResponse>({
    user: result.data.user,
  });

  setSessionCookie(response, result.data.session.token, result.data.session.expiresAt);

  return response;
}

export async function logoutController(request: NextRequest) {
  await revokeSessionFromRequest(request);

  const response = NextResponse.json({ ok: true });
  clearSessionCookie(response);

  return response;
}

export async function meController(request: NextRequest) {
  const auth = await requireAuth(request);

  if (!auth.authenticated) {
    return unauthorizedResponse();
  }

  return NextResponse.json<AuthResponse>({
    user: auth.user,
  });
}

export async function forgotPasswordController(request: NextRequest) {
  const payload = parseForgotPasswordPayload(await request.json().catch(() => null));

  if (!payload) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  await sendAdminPasswordReset(payload);

  return NextResponse.json({ ok: true });
}

export async function resetPasswordController(request: NextRequest) {
  const payload = parseResetPasswordPayload(await request.json().catch(() => null));

  if (!payload) {
    return NextResponse.json({ error: "Token and password are required." }, { status: 400 });
  }

  const result = await resetAdminPassword(payload);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json(result.data);
}
