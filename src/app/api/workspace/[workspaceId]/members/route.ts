import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { apiResponse, apiError } from "@/lib/utils";

type Params = { params: Promise<{ workspaceId: string }> };

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(["ADMIN", "MEMBER"]).default("MEMBER"),
});

const updateRoleSchema = z.object({
  memberId: z.string(),
  role: z.enum(["ADMIN", "MEMBER"]),
});

export async function GET(req: NextRequest, { params }: Params) {
  const userId = req.headers.get("x-user-id");
  if (!userId) return apiError("Unauthorized", 401);

  const { workspaceId } = await params;

  const requester = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
  });
  if (!requester) return apiError("Not found", 404);

  const members = await prisma.workspaceMember.findMany({
    where: { workspaceId },
    include: {
      user: {
        select: { id: true, name: true, email: true, avatarUrl: true, createdAt: true },
      },
    },
    orderBy: { joinedAt: "asc" },
  });

  return apiResponse(members);
}

export async function POST(req: NextRequest, { params }: Params) {
  const userId = req.headers.get("x-user-id");
  if (!userId) return apiError("Unauthorized", 401);

  const { workspaceId } = await params;

  const requester = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
  });
  if (!requester || (requester.role !== "OWNER" && requester.role !== "ADMIN")) {
    return apiError("Insufficient permissions", 403);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("Invalid JSON body");
  }

  const parsed = inviteSchema.safeParse(body);
  if (!parsed.success) return apiError(parsed.error.errors[0]?.message ?? "Validation failed");

  const { email, role } = parsed.data;

  const targetUser = await prisma.user.findUnique({ where: { email } });
  if (!targetUser) return apiError("User not found. They must register first.", 404);

  const existing = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId: targetUser.id } },
  });
  if (existing) return apiError("User is already a member", 409);

  const member = await prisma.workspaceMember.create({
    data: { workspaceId, userId: targetUser.id, role },
    include: {
      user: { select: { id: true, name: true, email: true, avatarUrl: true } },
    },
  });

  return apiResponse(member, 201);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const userId = req.headers.get("x-user-id");
  if (!userId) return apiError("Unauthorized", 401);

  const { workspaceId } = await params;

  const requester = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
  });
  if (!requester || requester.role !== "OWNER") {
    return apiError("Only owners can change member roles", 403);
  }

  const parsed = updateRoleSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return apiError("Validation failed");

  const { memberId, role } = parsed.data;

  const updated = await prisma.workspaceMember.update({
    where: { id: memberId },
    data: { role },
  });

  return apiResponse(updated);
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const userId = req.headers.get("x-user-id");
  if (!userId) return apiError("Unauthorized", 401);

  const { workspaceId } = await params;
  const { searchParams } = new URL(req.url);
  const targetUserId = searchParams.get("userId");

  if (!targetUserId) return apiError("userId query param required");

  const requester = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
  });

  const isRemovingSelf = targetUserId === userId;
  const canRemoveOthers =
    requester?.role === "OWNER" || requester?.role === "ADMIN";

  if (!isRemovingSelf && !canRemoveOthers) {
    return apiError("Insufficient permissions", 403);
  }

  const targetMember = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId: targetUserId } },
  });
  if (!targetMember) return apiError("Member not found", 404);
  if (targetMember.role === "OWNER") return apiError("Cannot remove workspace owner", 400);

  await prisma.workspaceMember.delete({ where: { id: targetMember.id } });
  return apiResponse({ removed: true });
}
