import { NextRequest, NextResponse } from "next/server";
import { findAdminByEmail } from "@/lib/auth/admin";
import { createPasswordResetToken } from "@/lib/auth/reset-token";
import { sendPasswordResetEmail } from "@/lib/email/sendgrid";
import type { ForgotPasswordPayload } from "@/types/auth";

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

function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

export async function POST(request: NextRequest) {
  const payload = parseForgotPasswordPayload(await request.json().catch(() => null));

  if (!payload) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  const admin = await findAdminByEmail(payload.email);

  if (admin) {
    const resetToken = await createPasswordResetToken(admin.id);
    const resetUrl = `${getAppUrl()}/reset-password?token=${encodeURIComponent(resetToken.token)}`;

    await sendPasswordResetEmail({
      to: admin.email,
      resetUrl,
    });
  }

  return NextResponse.json({ ok: true });
}
