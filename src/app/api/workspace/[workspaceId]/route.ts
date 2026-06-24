import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { apiResponse, apiError, getCurrentYearMonth } from "@/lib/utils";

const updateSchema = z.object({
  name: z.string().min(2).max(64).optional(),
  description: z.string().max(256).nullable().optional(),
});

type Params = { params: Promise<{ workspaceId: string }> };

async function getWorkspaceMember(workspaceId: string, userId: string) {
  return prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
  });
}

export async function GET(req: NextRequest, { params }: Params) {
  const userId = req.headers.get("x-user-id");
  if (!userId) return apiError("Unauthorized", 401);

  const { workspaceId } = await params;
  const member = await getWorkspaceMember(workspaceId, userId);
  if (!member) return apiError("Not found", 404);

  const { year, month } = getCurrentYearMonth();

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    include: {
      _count: { select: { members: true } },
      subscription: true,
      usageRecords: {
        where: {
          createdAt: {
            gte: new Date(year, month - 1, 1),
            lt: new Date(year, month, 1),
          },
        },
        select: { totalTokens: true, cost: true },
      },
    },
  });

  if (!workspace) return apiError("Not found", 404);

  const monthlyTokens = workspace.usageRecords.reduce((s, r) => s + r.totalTokens, 0);
  const monthlyCost = workspace.usageRecords.reduce((s, r) => s + r.cost, 0);

  return apiResponse({
    ...workspace,
    usageRecords: undefined,
    currentUserRole: member.role,
    usage: { monthlyTokens, monthlyCost, callCount: workspace.usageRecords.length },
  });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const userId = req.headers.get("x-user-id");
  if (!userId) return apiError("Unauthorized", 401);

  const { workspaceId } = await params;
  const member = await getWorkspaceMember(workspaceId, userId);
  if (!member || (member.role !== "OWNER" && member.role !== "ADMIN")) {
    return apiError("Insufficient permissions", 403);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("Invalid JSON body");
  }

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return apiError(parsed.error.errors[0]?.message ?? "Validation failed");

  const updated = await prisma.workspace.update({
    where: { id: workspaceId },
    data: parsed.data,
  });

  return apiResponse(updated);
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const userId = req.headers.get("x-user-id");
  if (!userId) return apiError("Unauthorized", 401);

  const { workspaceId } = await params;
  const member = await getWorkspaceMember(workspaceId, userId);
  if (!member || member.role !== "OWNER") {
    return apiError("Only the owner can delete a workspace", 403);
  }

  await prisma.workspace.delete({ where: { id: workspaceId } });
  return apiResponse({ deleted: true });
}
