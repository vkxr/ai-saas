import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { createTokenPair } from "@/lib/auth/jwt";
import { checkAuthRateLimit } from "@/lib/redis/rate-limit";
import { apiError } from "@/lib/utils";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const { success } = await checkAuthRateLimit(ip);
  if (!success) return apiError("Too many login attempts. Try again later.", 429);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("Invalid JSON body");
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) return apiError("Invalid credentials");

  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });

  // Constant-time comparison to prevent timing attacks
  const isValid = user
    ? await bcrypt.compare(password, user.passwordHash)
    : await bcrypt.compare(password, "$2a$12$dummy.hash.to.prevent.timing.attacks");

  if (!user || !isValid) {
    return apiError("Invalid email or password", 401);
  }

  const userAgent = req.headers.get("user-agent") ?? undefined;
  const { accessToken, refreshToken } = await createTokenPair(
    user.id,
    user.email,
    user.role as "ADMIN" | "USER",
    { userAgent, ipAddress: ip }
  );

  const defaultWorkspace = await prisma.workspaceMember.findFirst({
    where: { userId: user.id },
    include: { workspace: true },
    orderBy: { joinedAt: "asc" },
  });

  const isProduction = process.env.NODE_ENV === "production";

  const response = NextResponse.json({
    data: {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        role: user.role,
      },
      workspace: defaultWorkspace?.workspace ?? null,
      accessToken,
    },
  });

  response.cookies.set("access_token", accessToken, {
    httpOnly: true,
    path: "/",
    maxAge: 15 * 60,
    sameSite: "strict",
    secure: isProduction,
  });

  response.cookies.set("refresh_token", refreshToken, {
    httpOnly: true,
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
    sameSite: "strict",
    secure: isProduction,
  });

  return response;
}
