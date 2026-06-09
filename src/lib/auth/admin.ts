import "server-only";

import { prisma } from "@/lib/prisma";
import type { AuthUser } from "@/types/auth";

export function toAuthUser(user: { id: string; email: string }): AuthUser {
  return {
    id: user.id,
    email: user.email,
    name: "name" in user && typeof user.name === "string" ? user.name : "Admin",
  };
}

export function findAdminByEmail(email: string) {
  return prisma.adminUser.findUnique({
    where: {
      email: email.trim().toLowerCase(),
    },
  });
}

export function createAdminUser({
  email,
  name,
  passwordHash,
}: {
  email: string;
  name: string;
  passwordHash: string;
}) {
  return prisma.adminUser.create({
    data: {
      email: email.trim().toLowerCase(),
      name: name.trim(),
      passwordHash,
    },
  });
}
