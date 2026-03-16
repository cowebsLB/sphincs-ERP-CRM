import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/common/security/password";

const prisma = new PrismaClient();

async function main() {
  const organization = await prisma.organization.upsert({
    where: { id: "00000000-0000-0000-0000-000000000001" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      name: "Sphincs Organization"
    }
  });

  const branch = await prisma.branch.upsert({
    where: { id: "00000000-0000-0000-0000-000000000101" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000101",
      organization_id: organization.id,
      name: "Main Branch"
    }
  });

  const roleNames = ["Admin", "ERP Manager", "CRM Manager", "Staff"] as const;
  const roles = await Promise.all(
    roleNames.map((name) =>
      prisma.role.upsert({
        where: { name },
        update: {},
        create: { name }
      })
    )
  );

  const admin = await prisma.user.upsert({
    where: { email: "admin@sphincs.local" },
    update: {
      password_hash: await hashPassword("ChangeMe123!"),
      status: "ACTIVE"
    },
    create: {
      organization_id: organization.id,
      branch_id: branch.id,
      email: "admin@sphincs.local",
      password_hash: await hashPassword("ChangeMe123!"),
      status: "ACTIVE"
    }
  });

  const adminRole = roles.find((role) => role.name === "Admin");
  if (!adminRole) {
    throw new Error("Admin role was not seeded");
  }

  await prisma.userRole.upsert({
    where: {
      user_id_role_id: {
        user_id: admin.id,
        role_id: adminRole.id
      }
    },
    update: {},
    create: {
      user_id: admin.id,
      role_id: adminRole.id
    }
  });

  console.log("Seed complete");
  console.log(`Organization: ${organization.name}`);
  console.log(`Branch: ${branch.name}`);
  console.log(`Admin user: ${admin.email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
