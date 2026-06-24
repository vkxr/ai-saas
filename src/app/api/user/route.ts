import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { apiResponse, apiError } from "@/lib/utils";

const updateSchema = z.object({
  name: z.string().min(2).max(64).optional(),
  avatarUrl: z.string().url().nullable().optional(),
});

export async function PATCH(req: NextRequest) {
  const userId = req.headers.get("x-user-id");
  if (!userId) return apiError("Unauthorized", 401);

  const parsed = updateSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return apiError(parsed.error.errors[0]?.message ?? "Validation failed");

  const user = await prisma.user.update({
    where: { id: userId },
    data: parsed.data,
    select: { id: true, email: true, name: true, avatarUrl: true, role: true, emailVerified: true },
  });

  return apiResponse(user);
}
