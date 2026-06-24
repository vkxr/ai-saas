import { Redis } from "@upstash/redis";

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export const REDIS_KEYS = {
  rateLimit: (userId: string, endpoint: string) =>
    `rate_limit:${endpoint}:${userId}`,
  session: (userId: string) => `session:${userId}`,
  usageCache: (workspaceId: string, yearMonth: string) =>
    `usage:${workspaceId}:${yearMonth}`,
  workspaceCache: (workspaceId: string) => `workspace:${workspaceId}`,
  subscriptionCache: (workspaceId: string) => `subscription:${workspaceId}`,
} as const;
