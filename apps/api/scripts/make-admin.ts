/* eslint-disable no-console */
/**
 * Promote a user to ADMIN (or any role) by email. Use this to create the very
 * first admin, since the /admin panel itself requires you to already be an admin
 * (chicken-and-egg). After the first admin exists, use /admin/users in the UI.
 *
 * Local dev:
 *   pnpm --filter @app/api make:admin you@example.com
 *
 * Against production (Supabase), pass the pooled DATABASE_URL inline:
 *   DATABASE_URL="postgresql://...supabase..." \
 *     pnpm --filter @app/api make:admin you@example.com
 *
 * Optional second arg sets a different role (STUDENT | INSTRUCTOR | ADMIN):
 *   pnpm --filter @app/api make:admin teacher@example.com INSTRUCTOR
 */
import { PrismaClient, type Role } from "@prisma/client";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvFile() {
  for (const candidate of [".env", "apps/api/.env"]) {
    try {
      const text = readFileSync(resolve(process.cwd(), candidate), "utf8");
      for (const line of text.split("\n")) {
        const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*"?(.*?)"?\s*$/);
        if (m && process.env[m[1]] === undefined) {
          process.env[m[1]] = m[2];
        }
      }
      return;
    } catch {
      /* try next candidate */
    }
  }
}

const VALID_ROLES: readonly Role[] = ["STUDENT", "INSTRUCTOR", "ADMIN"];

async function main() {
  loadEnvFile();

  const email = process.argv[2]?.trim();
  const roleArg = (process.argv[3]?.trim().toUpperCase() as Role) ?? "ADMIN";

  if (!email) {
    console.error("Usage: make:admin <email> [STUDENT|INSTRUCTOR|ADMIN]");
    process.exit(1);
  }
  if (!VALID_ROLES.includes(roleArg)) {
    console.error(`Invalid role "${roleArg}". Use one of: ${VALID_ROLES.join(", ")}`);
    process.exit(1);
  }
  if (!process.env.DATABASE_URL) {
    console.error(
      "DATABASE_URL is not set. Add it to apps/api/.env or pass it inline before the command.",
    );
    process.exit(1);
  }

  const prisma = new PrismaClient();
  try {
    const user = await prisma.profile.findUnique({
      where: { email },
      select: { id: true, email: true, displayName: true, role: true },
    });
    if (!user) {
      console.error(
        `No user found with email "${email}". Sign up on the site first, then run this again.`,
      );
      process.exit(1);
    }
    if (user.role === roleArg) {
      console.log(`${email} is already ${roleArg}. Nothing to do.`);
      return;
    }
    const updated = await prisma.profile.update({
      where: { email },
      data: { role: roleArg },
      select: { email: true, displayName: true, role: true },
    });
    console.log(
      `Updated ${updated.email} (${updated.displayName ?? "no name"}): ${user.role} -> ${updated.role}`,
    );
    console.log("Log out and log back in for the new role to take effect.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
