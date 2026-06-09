import "server-only";

import { findAdminByEmail, createAdminUser, toAuthUser } from "@/lib/auth/admin";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import {
  createPasswordResetToken,
  consumePasswordResetToken,
  findValidPasswordResetToken,
} from "@/lib/auth/reset-token";
import { createAuthSession } from "@/lib/auth/session";
import { sendPasswordResetEmail } from "@/lib/email/sendgrid";
import type {
  AuthResponse,
  ForgotPasswordPayload,
  LoginPayload,
  ResetPasswordPayload,
  SignupPayload,
} from "@/types/auth";

type AuthServiceResult<T> =
  | {
      ok: true;
      data: T;
    }
  | {
      ok: false;
      error: string;
      status: number;
    };

function validateStrongPassword(password: string): string | null {
  if (password.length < 8) {
    return "Password must be at least 8 characters.";
  }
  if (!/[A-Z]/.test(password)) {
    return "Password must contain at least one uppercase letter.";
  }
  if (!/\d/.test(password)) {
    return "Password must contain at least one number.";
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return "Password must contain at least one special character.";
  }
  return null;
}

function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

export async function loginAdmin(
  payload: LoginPayload
): Promise<AuthServiceResult<AuthResponse & { session: { token: string; expiresAt: Date } }>> {
  const admin = await findAdminByEmail(payload.email);

  if (!admin) {
    return {
      ok: false,
      error: "No account found with this email address.",
      status: 401,
    };
  }

  const passwordValid = await verifyPassword(payload.password, admin.passwordHash);

  if (!passwordValid) {
    return {
      ok: false,
      error: "Wrong password.",
      status: 401,
    };
  }

  const session = await createAuthSession(admin.id, payload.rememberMe);

  return {
    ok: true,
    data: {
      user: toAuthUser(admin),
      session,
    },
  };
}

export async function signupAdmin(
  payload: SignupPayload
): Promise<AuthServiceResult<AuthResponse & { session: { token: string; expiresAt: Date } }>> {
  if (payload.fullName.length < 2) {
    return {
      ok: false,
      error: "Full name must be at least 2 characters.",
      status: 400,
    };
  }

  const passwordError = validateStrongPassword(payload.password);
  if (passwordError) {
    return {
      ok: false,
      error: passwordError,
      status: 400,
    };
  }

  if (payload.password !== payload.confirmPassword) {
    return {
      ok: false,
      error: "Passwords do not match.",
      status: 400,
    };
  }

  const existingAdmin = await findAdminByEmail(payload.email);

  if (existingAdmin) {
    return {
      ok: false,
      error: "An account with this email already exists.",
      status: 409,
    };
  }

  const admin = await createAdminUser({
    email: payload.email,
    name: payload.fullName,
    passwordHash: await hashPassword(payload.password),
  });
  const session = await createAuthSession(admin.id);

  return {
    ok: true,
    data: {
      user: toAuthUser(admin),
      session,
    },
  };
}

export async function sendAdminPasswordReset(payload: ForgotPasswordPayload) {
  const admin = await findAdminByEmail(payload.email);

  if (admin) {
    const resetToken = await createPasswordResetToken(admin.id);
    const resetUrl = `${getAppUrl()}/reset-password?token=${encodeURIComponent(resetToken.token)}`;

    await sendPasswordResetEmail({
      to: admin.email,
      resetUrl,
    });
  }

  return { ok: true };
}

export async function resetAdminPassword(
  payload: ResetPasswordPayload
): Promise<AuthServiceResult<{ ok: true }>> {
  const passwordError = validateStrongPassword(payload.password);
  if (passwordError) {
    return {
      ok: false,
      error: passwordError,
      status: 400,
    };
  }

  if (payload.password !== payload.confirmPassword) {
    return {
      ok: false,
      error: "Passwords do not match.",
      status: 400,
    };
  }

  const resetToken = await findValidPasswordResetToken(payload.token);

  if (!resetToken) {
    return {
      ok: false,
      error: "Reset link is invalid or expired.",
      status: 400,
    };
  }

  await consumePasswordResetToken({
    resetTokenId: resetToken.id,
    adminUserId: resetToken.adminUserId,
    passwordHash: await hashPassword(payload.password),
  });

  return {
    ok: true,
    data: { ok: true },
  };
}
