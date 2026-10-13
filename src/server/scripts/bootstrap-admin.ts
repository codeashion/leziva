/**
 * Secure One-Time Administrator Bootstrap Script
 * Usage:
 *   ADMIN_BOOTSTRAP_EMAIL="admin@leziva.com" ADMIN_BOOTSTRAP_PASSWORD="SecurePassword123!" npm run auth:bootstrap-admin
 */

import { prisma } from "../db/prisma";
import { hashPassword } from "../auth/password";
import { normalizeEmail } from "../auth/tokens";
import { RoleType, UserStatus } from "@prisma/client";

async function main() {
  const email = process.env.ADMIN_BOOTSTRAP_EMAIL;
  const password = process.env.ADMIN_BOOTSTRAP_PASSWORD;
  const name = process.env.ADMIN_BOOTSTRAP_NAME || "LEZIVA Administrator";

  if (!email || !password) {
    console.error("❌ Error: Both ADMIN_BOOTSTRAP_EMAIL and ADMIN_BOOTSTRAP_PASSWORD environment variables are required.");
    console.error("Example: ADMIN_BOOTSTRAP_EMAIL='admin@leziva.com' ADMIN_BOOTSTRAP_PASSWORD='SecretPassword123!' npm run auth:bootstrap-admin");
    process.exit(1);
  }

  if (password.length < 12) {
    console.error("❌ Error: Administrative bootstrap password must be at least 12 characters.");
    process.exit(1);
  }

  console.log(`🔒 Initializing secure administrator account for: ${email}...`);

  const normalized = normalizeEmail(email);
  const passwordHash = await hashPassword(password);

  const adminRole = await prisma.role.upsert({
    where: { name: RoleType.SUPER_ADMIN },
    update: {},
    create: {
      name: RoleType.SUPER_ADMIN,
      description: "Super Administrator with full platform governance privileges",
      permissions: ["*"],
    },
  });

  const user = await prisma.user.upsert({
    where: { normalizedEmail: normalized },
    update: {
      passwordHash,
      name,
      status: UserStatus.ACTIVE,
      updatedAt: new Date(),
    },
    create: {
      email,
      normalizedEmail: normalized,
      passwordHash,
      name,
      status: UserStatus.ACTIVE,
    },
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: user.id,
        roleId: adminRole.id,
      },
    },
    update: {},
    create: {
      userId: user.id,
      roleId: adminRole.id,
      assignedBy: "SYSTEM_BOOTSTRAP",
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      action: "ADMIN_BOOTSTRAP_EXECUTED",
      resourceType: "USER",
      resourceId: user.id,
      metadata: { role: RoleType.SUPER_ADMIN },
    },
  });

  console.log(`✅ Administrator '${normalized}' successfully provisioned with role: SUPER_ADMIN.`);
}

main()
  .catch((e) => {
    console.error("❌ Bootstrap failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
