import "server-only";

import { createHmac, randomBytes } from "crypto";
import type { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toAuthUser } from "@/lib/auth/admin";
import type { AuthResult } from "@/types/auth";

export const AUTH_COOKIE_NAME = "ai_dashboard_session";

function getSessionDays() {
  const configuredDays = Number(process.env.AUTH_SESSION_DAYS ?? "7");

  if (!Number.isFinite(configuredDays) || configuredDays <= 0) {
    return 7;
  }

  return configuredDays;
}

function getSessionSecret() {
  const secret = process.env.AUTH_SESSION_SECRET;

  if (!secret) {
    throw new Error("AUTH_SESSION_SECRET is required.");
  }

  return secret;
}

function hashSessionToken(token: string) {
  return createHmac("sha256", getSessionSecret()).update(token).digest("hex");
}

function getCookieOptions(expiresAt: Date) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    expires: expiresAt,
  };
}

export async function createAuthSession(adminUserId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + getSessionDays() * 24 * 60 * 60 * 1000);

  await prisma.authSession.create({
    data: {
      adminUserId,
      tokenHash: hashSessionToken(token),
      expiresAt,
    },
  });

  return {
    token,
    expiresAt,
  };
}

export function setSessionCookie(response: NextResponse, token: string, expiresAt: Date) {
  response.cookies.set(AUTH_COOKIE_NAME, token, getCookieOptions(expiresAt));
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(AUTH_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(0),
  });
}

export async function verifySessionFromRequest(request: NextRequest): Promise<AuthResult> {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    return { authenticated: false };
  }

  const tokenHash = hashSessionToken(token);
  const session = await prisma.authSession.findUnique({
    where: { tokenHash },
    include: { adminUser: true },
  });

  if (!session) {
    return { authenticated: false };
  }

  if (session.expiresAt <= new Date()) {
    await prisma.authSession.delete({
      where: { id: session.id },
    });

    return { authenticated: false };
  }

  return {
    authenticated: true,
    sessionId: session.id,
    user: toAuthUser(session.adminUser),
  };
}

export async function revokeSessionFromRequest(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    return;
  }

  await prisma.authSession.deleteMany({
    where: {
      tokenHash: hashSessionToken(token),
    },
  });
}
