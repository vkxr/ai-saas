import { PrismaClient, PlanTier, MemberRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  const passwordHash = await bcrypt.hash("Password123!", 12);

  const adminUser = await prisma.user.upsert({
    where: { email: "admin@nexusai.dev" },
    update: {},
    create: {
      email: "admin@nexusai.dev",
      name: "Admin User",
      passwordHash,
      role: "ADMIN",
      emailVerified: true,
    },
  });

  const demoUser = await prisma.user.upsert({
    where: { email: "demo@nexusai.dev" },
    update: {},
    create: {
      email: "demo@nexusai.dev",
      name: "Demo User",
      passwordHash,
      role: "USER",
      emailVerified: true,
    },
  });

  const workspace = await prisma.workspace.upsert({
    where: { slug: "demo-workspace" },
    update: {},
    create: {
      name: "Demo Workspace",
      slug: "demo-workspace",
      description: "A demo workspace to explore NexusAI features",
      ownerId: adminUser.id,
    },
  });

  await prisma.workspaceMember.upsert({
    where: { workspaceId_userId: { workspaceId: workspace.id, userId: adminUser.id } },
    update: {},
    create: { workspaceId: workspace.id, userId: adminUser.id, role: MemberRole.OWNER },
  });

  await prisma.workspaceMember.upsert({
    where: { workspaceId_userId: { workspaceId: workspace.id, userId: demoUser.id } },
    update: {},
    create: { workspaceId: workspace.id, userId: demoUser.id, role: MemberRole.MEMBER },
  });

  await prisma.subscription.upsert({
    where: { workspaceId: workspace.id },
    update: {},
    create: {
      workspaceId: workspace.id,
      tier: PlanTier.PRO,
      status: "ACTIVE",
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  console.log("✅ Seed complete");
  console.log("   Admin: admin@nexusai.dev / Password123!");
  console.log("   Demo:  demo@nexusai.dev  / Password123!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
