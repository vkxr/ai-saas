import { NextRequest, NextResponse } from "next/server";
import { revokeRefreshToken } from "@/lib/auth/jwt";

export async function POST(req: NextRequest) {
  const refreshToken = req.cookies.get("refresh_token")?.value;
  if (refreshToken) await revokeRefreshToken(refreshToken);

  const response = NextResponse.json({ message: "Logged out successfully" });
  response.cookies.set("access_token", "", { maxAge: 0, path: "/" });
  response.cookies.set("refresh_token", "", { maxAge: 0, path: "/" });
  return response;
}
