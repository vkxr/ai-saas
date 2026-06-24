import { prisma } from "@/lib/db/prisma";
import { getCurrentYearMonth } from "@/lib/utils";
import { getQuotaForTier } from "@/lib/razorpay/plans";
import type { PlanTier } from "@/types";

export async function checkAndConsumeQuota(
  workspaceId: string,
  tier: PlanTier,
  estimatedTokens = 0
): Promise<{ allowed: boolean; remaining: number; quota: number }> {
  const { year, month } = getCurrentYearMonth();
  const { tokens: quota } = getQuotaForTier(tier);

  if (tier === "ENTERPRISE") {
    return { allowed: true, remaining: quota, quota };
  }

  const summary = await prisma.monthlyUsageSummary.findUnique({
    where: { workspaceId_year_month: { workspaceId, year, month } },
  });

  const used = summary?.totalTokens ?? 0;
  const remaining = quota - used;

  if (remaining <= 0) {
    return { allowed: false, remaining: 0, quota };
  }

  return { allowed: true, remaining: remaining - estimatedTokens, quota };
}

export async function recordUsage(
  workspaceId: string,
  data: {
    model: string;
    inputTokens: number;
    outputTokens: number;
    endpoint: string;
  }
): Promise<void> {
  const totalTokens = data.inputTokens + data.outputTokens;
  const cost = calculateCost(data.model, data.inputTokens, data.outputTokens);
  const { year, month } = getCurrentYearMonth();

  await prisma.$transaction([
    prisma.aIUsageRecord.create({
      data: {
        workspaceId,
        model: data.model,
        inputTokens: data.inputTokens,
        outputTokens: data.outputTokens,
        totalTokens,
        cost,
        endpoint: data.endpoint,
      },
    }),
    prisma.monthlyUsageSummary.upsert({
      where: { workspaceId_year_month: { workspaceId, year, month } },
      create: { workspaceId, year, month, totalTokens, totalCalls: 1, totalCost: cost },
      update: {
        totalTokens: { increment: totalTokens },
        totalCalls: { increment: 1 },
        totalCost: { increment: cost },
      },
    }),
  ]);
}

// OpenRouter pricing per 1K tokens (USD) — matches their published rates
const PRICING: Record<string, { input: number; output: number }> = {
  "anthropic/claude-3-haiku":      { input: 0.00025,  output: 0.00125  },
  "anthropic/claude-3.5-haiku":    { input: 0.0008,   output: 0.004    },
  "anthropic/claude-3.5-sonnet":   { input: 0.003,    output: 0.015    },
  "openai/gpt-4o-mini":            { input: 0.00015,  output: 0.0006   },
  "google/gemini-flash-1.5":       { input: 0.000075, output: 0.0003   },
};

function calculateCost(model: string, inputTokens: number, outputTokens: number): number {
  const rates = PRICING[model] ?? { input: 0.001, output: 0.003 };
  return (inputTokens / 1000) * rates.input + (outputTokens / 1000) * rates.output;
}
