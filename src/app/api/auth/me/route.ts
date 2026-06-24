import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { apiResponse, apiError } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const userId = req.headers.get("x-user-id");
  if (!userId) return apiError("Unauthorized", 401);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      avatarUrl: true,
      role: true,
      emailVerified: true,
      createdAt: true,
    },
  });

  if (!user) return apiError("User not found", 404);
  return apiResponse(user);
}
