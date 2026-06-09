import { NextRequest, NextResponse } from "next/server";
import { hashPassword } from "@/lib/auth/password";
import {
  consumePasswordResetToken,
  findValidPasswordResetToken,
} from "@/lib/auth/reset-token";
import type { ResetPasswordPayload } from "@/types/auth";

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

export async function POST(request: NextRequest) {
  const payload = parseResetPasswordPayload(await request.json().catch(() => null));

  if (!payload) {
    return NextResponse.json({ error: "Token and password are required." }, { status: 400 });
  }

  if (payload.password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }

  if (payload.password !== payload.confirmPassword) {
    return NextResponse.json({ error: "Passwords do not match." }, { status: 400 });
  }

  const resetToken = await findValidPasswordResetToken(payload.token);

  if (!resetToken) {
    return NextResponse.json({ error: "Reset link is invalid or expired." }, { status: 400 });
  }

  await consumePasswordResetToken({
    resetTokenId: resetToken.id,
    adminUserId: resetToken.adminUserId,
    passwordHash: await hashPassword(payload.password),
  });

  return NextResponse.json({ ok: true });
}
