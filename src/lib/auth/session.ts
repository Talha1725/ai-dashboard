import "server-only";

import { Prisma } from "@prisma/client";
import { createHmac, randomBytes } from "crypto";
import { cookies } from "next/headers";
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

function isPrismaConnectionError(error: unknown) {
  if (error instanceof Prisma.PrismaClientInitializationError) {
    return true;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return error.code === "P1001" || error.code === "P2024";
  }

  return false;
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

export async function createAuthSession(adminUserId: string, rememberMe = false) {
  const token = randomBytes(32).toString("base64url");
  const sessionDays = rememberMe ? 30 : getSessionDays();
  const expiresAt = new Date(Date.now() + sessionDays * 24 * 60 * 60 * 1000);

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

async function verifySessionToken(token?: string): Promise<AuthResult> {
  if (!token) {
    return { authenticated: false };
  }

  try {
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
  } catch (error) {
    if (!isPrismaConnectionError(error)) {
      throw error;
    }

    console.warn("Unable to verify auth session because the database is unavailable.");

    return { authenticated: false };
  }
}

export async function verifySessionFromRequest(request: NextRequest): Promise<AuthResult> {
  return verifySessionToken(request.cookies.get(AUTH_COOKIE_NAME)?.value);
}

export async function verifySessionFromCookies(): Promise<AuthResult> {
  const cookieStore = await cookies();

  return verifySessionToken(cookieStore.get(AUTH_COOKIE_NAME)?.value);
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
