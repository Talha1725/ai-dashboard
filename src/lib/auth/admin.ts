import "server-only";

import { prisma } from "@/lib/prisma";
import type { AuthUser } from "@/types/auth";

export function toAuthUser(user: { id: string; email: string }): AuthUser {
  return {
    id: user.id,
    email: user.email,
  };
}

export function findAdminByEmail(email: string) {
  return prisma.adminUser.findUnique({
    where: {
      email: email.trim().toLowerCase(),
    },
  });
}
