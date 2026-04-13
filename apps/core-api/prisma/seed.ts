import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/common/security/password";

const prisma = new PrismaClient();

async function main() {
  const enterprisePlan = await prisma.subscriptionPlan.upsert({
    where: { slug: "enterprise" },
    update: {
      name: "Enterprise",
      max_users: null,
      max_branches: 999999,
      max_storage_gb: 200,
      features: {
        core: true,
        sales: true,
        procurement: true,
        inventory: true,
        crm: true,
        ecommerce: true,
        accounting: true,
        hr: true,
        governance: true,
        bi: true,
        eam: true
      },
      price_monthly: 0,
      price_yearly: 0,
      is_active: true
    },
    create: {
      name: "Enterprise",
      slug: "enterprise",
      max_users: null,
      max_branches: 999999,
      max_storage_gb: 200,
      features: {
        core: true,
        sales: true,
        procurement: true,
        inventory: true,
        crm: true,
        ecommerce: true,
        accounting: true,
        hr: true,
        governance: true,
        bi: true,
        eam: true
      },
      price_monthly: 0,
      price_yearly: 0,
      is_active: true
    }
  });

  const organization = await prisma.organization.upsert({
    where: { id: "00000000-0000-0000-0000-000000000001" },
    update: {
      plan_id: enterprisePlan.id
    },
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      name: "Sphincs Organization",
      plan_id: enterprisePlan.id
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

  const permissionSeeds = [
    {
      module: "core",
      resource: "organizations",
      action: "read",
      slug: "core:organizations:read",
      description: "View organization records"
    },
    {
      module: "erp",
      resource: "items",
      action: "read",
      slug: "erp:items:read",
      description: "View item catalog"
    },
    {
      module: "erp",
      resource: "purchase_orders",
      action: "read",
      slug: "erp:purchase_orders:read",
      description: "View purchase orders"
    },
    {
      module: "crm",
      resource: "contacts",
      action: "read",
      slug: "crm:contacts:read",
      description: "View CRM contacts"
    },
    {
      module: "crm",
      resource: "leads",
      action: "read",
      slug: "crm:leads:read",
      description: "View CRM leads"
    },
    {
      module: "crm",
      resource: "opportunities",
      action: "read",
      slug: "crm:opportunities:read",
      description: "View CRM opportunities"
    },
    {
      module: "distribution",
      resource: "inventory",
      action: "read",
      slug: "distribution:inventory:read",
      description: "View inventory and stock movements"
    },
    {
      module: "audit",
      resource: "logs",
      action: "read",
      slug: "audit:logs:read",
      description: "View audit trail entries"
    }
  ] as const;

  const permissions = await Promise.all(
    permissionSeeds.map((p) =>
      prisma.permission.upsert({
        where: { slug: p.slug },
        update: {
          module: p.module,
          resource: p.resource,
          action: p.action,
          description: p.description
        },
        create: {
          module: p.module,
          resource: p.resource,
          action: p.action,
          slug: p.slug,
          description: p.description
        }
      })
    )
  );

  for (const perm of permissions) {
    await prisma.rolePermission.upsert({
      where: {
        role_id_permission_id: {
          role_id: adminRole.id,
          permission_id: perm.id
        }
      },
      update: { granted_by: admin.id },
      create: {
        role_id: adminRole.id,
        permission_id: perm.id,
        granted_by: admin.id
      }
    });
  }

  await prisma.organizationSetting.upsert({
    where: {
      organization_id_key: {
        organization_id: organization.id,
        key: "modules.beta.scope"
      }
    },
    update: {
      value: { erp: true, crm: true, distribution: true },
      description: "Which beta modules are enabled for this tenant",
      updated_by: admin.id
    },
    create: {
      organization_id: organization.id,
      key: "modules.beta.scope",
      value: { erp: true, crm: true, distribution: true },
      description: "Which beta modules are enabled for this tenant",
      updated_by: admin.id
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
