import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const name = process.env.ADMIN_NAME?.trim() || "Admin";
const password = process.env.ADMIN_PASSWORD;

if (!email || !password) {
  console.error("ADMIN_EMAIL and ADMIN_PASSWORD are required.");
  process.exit(1);
}

const passwordHash = await bcrypt.hash(password, 12);

await prisma.adminUser.upsert({
  where: { email },
  update: { name, passwordHash },
  create: { email, name, passwordHash },
});

await prisma.$disconnect();

console.log(`Admin user ready: ${email}`);
