import { NextRequest, NextResponse } from "next/server";
import { rotateRefreshToken } from "@/lib/auth/jwt";
import { apiError } from "@/lib/utils";

export async function POST(req: NextRequest) {
  const refreshToken =
    req.cookies.get("refresh_token")?.value ??
    (await req.json().catch(() => ({}))).refreshToken;

  if (!refreshToken) return apiError("No refresh token", 401);

  const ip = req.headers.get("x-forwarded-for") ?? undefined;
  const userAgent = req.headers.get("user-agent") ?? undefined;

  const tokens = await rotateRefreshToken(refreshToken, { userAgent, ipAddress: ip });

  if (!tokens) {
    const response = NextResponse.json(
      { error: "Invalid or expired refresh token" },
      { status: 401 }
    );
    response.cookies.set("access_token", "", { maxAge: 0, path: "/" });
    response.cookies.set("refresh_token", "", { maxAge: 0, path: "/" });
    return response;
  }

  const isProduction = process.env.NODE_ENV === "production";

  const response = NextResponse.json({ data: { accessToken: tokens.accessToken } });

  response.cookies.set("access_token", tokens.accessToken, {
    httpOnly: true,
    path: "/",
    maxAge: 15 * 60,
    sameSite: "strict",
    secure: isProduction,
  });

  response.cookies.set("refresh_token", tokens.refreshToken, {
    httpOnly: true,
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
    sameSite: "strict",
    secure: isProduction,
  });

  return response;
}
