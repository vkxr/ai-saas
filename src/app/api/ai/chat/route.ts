import { NextRequest } from "next/server";
import { z } from "zod";
import OpenAI from "openai";
import { prisma } from "@/lib/db/prisma";
import { checkAIRateLimit } from "@/lib/redis/rate-limit";
import { checkAndConsumeQuota, recordUsage } from "@/lib/ai/quota";
import { apiError } from "@/lib/utils";
import type { PlanTier } from "@/types";

// OpenRouter is OpenAI-API-compatible — just swap the baseURL
const openrouter = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY!,
  defaultHeaders: {
    "HTTP-Referer": process.env.OPENROUTER_SITE_URL ?? "http://localhost:3000",
    "X-Title": process.env.OPENROUTER_SITE_NAME ?? "NexusAI",
  },
});

const schema = z.object({
  workspaceId: z.string().cuid(),
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(16000),
      })
    )
    .min(1)
    .max(50),
  model: z
    .enum([
      "anthropic/claude-3-haiku",
      "anthropic/claude-3.5-sonnet",
      "openai/gpt-4o-mini",
      "google/gemini-flash-1.5",
    ])
    .default("anthropic/claude-3-haiku"),
  systemPrompt: z.string().max(2000).optional(),
  stream: z.boolean().default(false),
});

// Models that require a paid plan
const PRO_MODELS = new Set([
  "anthropic/claude-3.5-sonnet",
  "openai/gpt-4o-mini",
  "google/gemini-flash-1.5",
]);

export async function POST(req: NextRequest) {
  const userId = req.headers.get("x-user-id");
  if (!userId) return apiError("Unauthorized", 401);

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

  const { workspaceId, messages, model, systemPrompt, stream } = parsed.data;

  // Verify workspace membership
  const member = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
    include: {
      workspace: { include: { subscription: true } },
    },
  });

  if (!member) return apiError("Workspace access denied", 403);

  const subscription = member.workspace.subscription;
  const tier = (subscription?.tier ?? "FREE") as PlanTier;

  // Subscription must be active
  if (
    subscription &&
    subscription.status !== "ACTIVE" &&
    subscription.status !== "TRIALING"
  ) {
    return apiError("Your subscription is inactive. Please update your billing.", 402);
  }

  // Gate advanced models behind paid plan
  if (PRO_MODELS.has(model) && tier === "FREE") {
    return apiError(
      `${model} requires a Pro or Enterprise plan. Upgrade to access this model.`,
      403
    );
  }

  // Per-workspace rate limit based on plan tier
  const rateLimitResult = await checkAIRateLimit(workspaceId, tier);
  if (!rateLimitResult.success) {
    return new Response(
      JSON.stringify({ error: "Rate limit exceeded. Upgrade your plan for higher limits." }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "X-RateLimit-Limit": rateLimitResult.limit.toString(),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": rateLimitResult.reset.toString(),
        },
      }
    );
  }

  // Monthly token quota check
  const quotaCheck = await checkAndConsumeQuota(workspaceId, tier);
  if (!quotaCheck.allowed) {
    return apiError(
      `Monthly token quota exhausted (${quotaCheck.quota.toLocaleString()} tokens). Upgrade your plan for more.`,
      429
    );
  }

  const openRouterMessages: OpenAI.ChatCompletionMessageParam[] = messages.map(
    (m) => ({ role: m.role, content: m.content })
  );

  if (stream) {
    const encoder = new TextEncoder();
    let inputTokens = 0;
    let outputTokens = 0;

    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          const streamResponse = await openrouter.chat.completions.create({
            model,
            messages: systemPrompt
              ? [{ role: "system", content: systemPrompt }, ...openRouterMessages]
              : openRouterMessages,
            max_tokens: 4096,
            stream: true,
            stream_options: { include_usage: true },
          });

          for await (const chunk of streamResponse) {
            const delta = chunk.choices[0]?.delta?.content;
            if (delta) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ text: delta })}\n\n`)
              );
            }
            if (chunk.usage) {
              inputTokens = chunk.usage.prompt_tokens;
              outputTokens = chunk.usage.completion_tokens;
            }
          }

          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();

          // Record usage after stream completes
          await recordUsage(workspaceId, {
            model,
            inputTokens,
            outputTokens,
            endpoint: "chat",
          });
        } catch (err) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ error: "AI generation failed" })}\n\n`
            )
          );
          controller.close();
          console.error("OpenRouter stream error:", err);
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
      },
    });
  }

  // Non-streaming
  const completion = await openrouter.chat.completions.create({
    model,
    messages: systemPrompt
      ? [{ role: "system", content: systemPrompt }, ...openRouterMessages]
      : openRouterMessages,
    max_tokens: 4096,
  });

  const inputTokens = completion.usage?.prompt_tokens ?? 0;
  const outputTokens = completion.usage?.completion_tokens ?? 0;
  const text = completion.choices[0]?.message?.content ?? "";

  await recordUsage(workspaceId, {
    model,
    inputTokens,
    outputTokens,
    endpoint: "chat",
  });

  return Response.json(
    {
      data: {
        content: text,
        usage: { inputTokens, outputTokens, total: inputTokens + outputTokens },
        model,
      },
    },
    {
      headers: { "X-RateLimit-Remaining": rateLimitResult.remaining.toString() },
    }
  );
}
