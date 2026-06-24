import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "./client";
import type { PlanTier } from "@/types";

const RATE_LIMITS: Record<PlanTier, { requests: number; window: string }> = {
  FREE: { requests: 10, window: "1 m" },
  PRO: { requests: 60, window: "1 m" },
  ENTERPRISE: { requests: 300, window: "1 m" },
};

const rateLimiters: Partial<Record<PlanTier, Ratelimit>> = {};

function getRateLimiter(tier: PlanTier): Ratelimit {
  if (!rateLimiters[tier]) {
    const config = RATE_LIMITS[tier];
    rateLimiters[tier] = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(config.requests, config.window as Parameters<typeof Ratelimit.slidingWindow>[1]),
      prefix: `rl:ai:${tier.toLowerCase()}`,
      analytics: true,
    });
  }
  return rateLimiters[tier]!;
}

export const authRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "1 m"),
  prefix: "rl:auth",
  analytics: true,
});

export const globalRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, "1 m"),
  prefix: "rl:global",
  analytics: true,
});

export async function checkAIRateLimit(
  workspaceId: string,
  tier: PlanTier
): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
  try {
    const limiter = getRateLimiter(tier);
    const result = await limiter.limit(workspaceId);
    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
    };
  } catch {
    const limit = RATE_LIMITS[tier].requests;
    return { success: true, limit, remaining: limit, reset: Date.now() + 60_000 };
  }
}

export async function checkAuthRateLimit(
  identifier: string
): Promise<{ success: boolean; remaining: number }> {
  try {
    const result = await authRateLimiter.limit(identifier);
    return { success: result.success, remaining: result.remaining };
  } catch {
    // Fail open: if Redis is unavailable, allow the request through
    return { success: true, remaining: 5 };
  }
}

export async function checkGlobalRateLimit(
  identifier: string
): Promise<{ success: boolean; remaining: number }> {
  try {
    const result = await globalRateLimiter.limit(identifier);
    return { success: result.success, remaining: result.remaining };
  } catch {
    return { success: true, remaining: 100 };
  }
}
