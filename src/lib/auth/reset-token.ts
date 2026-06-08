import "server-only";

import { createHmac, randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";

const PASSWORD_RESET_TOKEN_MINUTES = 30;

function getResetTokenSecret() {
  const secret = process.env.AUTH_SESSION_SECRET;

  if (!secret) {
    throw new Error("AUTH_SESSION_SECRET is required.");
  }

  return secret;
}

function hashResetToken(token: string) {
  return createHmac("sha256", getResetTokenSecret()).update(token).digest("hex");
}

export async function createPasswordResetToken(adminUserId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_TOKEN_MINUTES * 60 * 1000);

  await prisma.passwordResetToken.create({
    data: {
      adminUserId,
      tokenHash: hashResetToken(token),
      expiresAt,
    },
  });

  return {
    token,
    expiresAt,
  };
}

export async function findValidPasswordResetToken(token: string) {
  const resetToken = await prisma.passwordResetToken.findUnique({
    where: {
      tokenHash: hashResetToken(token),
    },
  });

  if (!resetToken || resetToken.usedAt || resetToken.expiresAt <= new Date()) {
    return null;
  }

  return resetToken;
}

export async function consumePasswordResetToken({
  resetTokenId,
  adminUserId,
  passwordHash,
}: {
  resetTokenId: string;
  adminUserId: string;
  passwordHash: string;
}) {
  await prisma.$transaction([
    prisma.adminUser.update({
      where: { id: adminUserId },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: resetTokenId },
      data: { usedAt: new Date() },
    }),
    prisma.authSession.deleteMany({
      where: { adminUserId },
    }),
  ]);
}
