import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { slugify, apiResponse, apiError } from "@/lib/utils";

const createSchema = z.object({
  name: z.string().min(2).max(64),
  description: z.string().max(256).optional(),
});

export async function GET(req: NextRequest) {
  const userId = req.headers.get("x-user-id");
  if (!userId) return apiError("Unauthorized", 401);

  const memberships = await prisma.workspaceMember.findMany({
    where: { userId },
    include: {
      workspace: {
        include: {
          _count: { select: { members: true } },
          subscription: {
            select: { tier: true, status: true, currentPeriodEnd: true, cancelAtPeriodEnd: true },
          },
        },
      },
    },
    orderBy: { joinedAt: "asc" },
  });

  const workspaces = memberships.map((m) => ({
    id: m.workspace.id,
    name: m.workspace.name,
    slug: m.workspace.slug,
    description: m.workspace.description,
    logoUrl: m.workspace.logoUrl,
    ownerId: m.workspace.ownerId,
    currentUserRole: m.role,
    memberCount: m.workspace._count.members,
    subscription: m.workspace.subscription,
    createdAt: m.workspace.createdAt,
  }));

  return apiResponse(workspaces);
}

export async function POST(req: NextRequest) {
  const userId = req.headers.get("x-user-id");
  if (!userId) return apiError("Unauthorized", 401);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("Invalid JSON body");
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return apiError(parsed.error.errors[0]?.message ?? "Validation failed");

  const { name, description } = parsed.data;

  const existingCount = await prisma.workspaceMember.count({
    where: { userId, role: "OWNER" },
  });

  if (existingCount >= 5) {
    return apiError("Maximum workspace limit reached. Upgrade to Enterprise for unlimited workspaces.", 403);
  }

  let slug = slugify(name);
  const slugExists = await prisma.workspace.findUnique({ where: { slug } });
  if (slugExists) slug = `${slug}-${Date.now().toString(36)}`;

  const workspace = await prisma.workspace.create({
    data: {
      name,
      slug,
      description,
      ownerId: userId,
      members: {
        create: { userId, role: "OWNER" },
      },
      subscription: {
        create: {
          tier: "FREE",
          status: "ACTIVE",
          // rzpCustomerId set on first Razorpay checkout
        },
      },
    },
  });

  return apiResponse(workspace, 201);
}
