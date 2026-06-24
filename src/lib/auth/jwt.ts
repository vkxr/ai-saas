import jwt from "jsonwebtoken";
import { prisma } from "@/lib/db/prisma";
import type { JWTPayload, UserRole } from "@/types";
import crypto from "crypto";

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET!;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;
const ACCESS_EXPIRY = process.env.JWT_ACCESS_EXPIRY ?? "15m";
const REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY ?? "7d";

export function signAccessToken(payload: JWTPayload): string {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRY } as jwt.SignOptions);
}

export function signRefreshToken(payload: JWTPayload): string {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRY } as jwt.SignOptions);
}

export function verifyAccessToken(token: string): JWTPayload {
  return jwt.verify(token, ACCESS_SECRET) as JWTPayload;
}

export function verifyRefreshToken(token: string): JWTPayload {
  return jwt.verify(token, REFRESH_SECRET) as JWTPayload;
}

export async function createTokenPair(
  userId: string,
  email: string,
  role: UserRole,
  meta?: { userAgent?: string; ipAddress?: string }
): Promise<{ accessToken: string; refreshToken: string }> {
  const payload: JWTPayload = { sub: userId, email, role };

  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  const tokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await prisma.refreshToken.create({
    data: {
      token: tokenHash,
      userId,
      expiresAt,
      userAgent: meta?.userAgent,
      ipAddress: meta?.ipAddress,
    },
  });

  return { accessToken, refreshToken };
}

export async function rotateRefreshToken(
  oldRefreshToken: string,
  meta?: { userAgent?: string; ipAddress?: string }
): Promise<{ accessToken: string; refreshToken: string } | null> {
  let payload: JWTPayload;

  try {
    payload = verifyRefreshToken(oldRefreshToken);
  } catch {
    return null;
  }

  const oldTokenHash = crypto
    .createHash("sha256")
    .update(oldRefreshToken)
    .digest("hex");

  const storedToken = await prisma.refreshToken.findUnique({
    where: { token: oldTokenHash },
  });

  if (!storedToken || storedToken.revoked || storedToken.expiresAt < new Date()) {
    if (storedToken && !storedToken.revoked) {
      await prisma.refreshToken.updateMany({
        where: { userId: storedToken.userId, revoked: false },
        data: { revoked: true },
      });
    }
    return null;
  }

  await prisma.refreshToken.update({
    where: { id: storedToken.id },
    data: { revoked: true },
  });

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) return null;

  return createTokenPair(user.id, user.email, user.role as UserRole, meta);
}

export async function revokeRefreshToken(token: string): Promise<void> {
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  await prisma.refreshToken.updateMany({
    where: { token: tokenHash },
    data: { revoked: true },
  });
}

export async function revokeAllUserTokens(userId: string): Promise<void> {
  await prisma.refreshToken.updateMany({
    where: { userId, revoked: false },
    data: { revoked: true },
  });
}
