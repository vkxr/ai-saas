import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { createTokenPair } from "@/lib/auth/jwt";
import { checkAuthRateLimit } from "@/lib/redis/rate-limit";
import { slugify, apiError } from "@/lib/utils";

const schema = z.object({
  name: z.string().min(2).max(64),
  email: z.string().email(),
  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/, "Must contain uppercase")
    .regex(/[0-9]/, "Must contain number"),
  workspaceName: z.string().min(2).max(64).optional(),
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const { success } = await checkAuthRateLimit(ip);
  if (!success) return apiError("Too many requests. Try again later.", 429);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("Invalid JSON body");
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.errors[0]?.message ?? "Validation failed");
  }

  const { name, email, password, workspaceName } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return apiError("Email already in use", 409);

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: { name, email, passwordHash, emailVerified: false },
  });

  const wsName = workspaceName ?? `${name}'s Workspace`;
  let slug = slugify(wsName);

  const slugExists = await prisma.workspace.findUnique({ where: { slug } });
  if (slugExists) slug = `${slug}-${user.id.slice(-4)}`;

  const workspace = await prisma.workspace.create({
    data: {
      name: wsName,
      slug,
      ownerId: user.id,
      members: {
        create: { userId: user.id, role: "OWNER" },
      },
      subscription: {
        create: {
          tier: "FREE",
          status: "ACTIVE",
        },
      },
    },
  });

  const userAgent = req.headers.get("user-agent") ?? undefined;
  const { accessToken, refreshToken } = await createTokenPair(
    user.id,
    user.email,
    user.role as "ADMIN" | "USER",
    { userAgent, ipAddress: ip }
  );

  const isProduction = process.env.NODE_ENV === "production";

  const response = NextResponse.json({
    data: {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      workspace: { id: workspace.id, name: workspace.name, slug: workspace.slug },
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
