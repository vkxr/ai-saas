import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { verifyWebhookSignature } from "@/lib/razorpay/client";

import type { PlanTier, SubscriptionStatus } from "@/types";

const PLAN_ID_TO_TIER: Record<string, PlanTier> = {
  [process.env.RAZORPAY_PLAN_PRO_MONTHLY ?? "___"]: "PRO",
  [process.env.RAZORPAY_PLAN_PRO_YEARLY ?? "___"]: "PRO",
  [process.env.RAZORPAY_PLAN_ENTERPRISE_MONTHLY ?? "___"]: "ENTERPRISE",
  [process.env.RAZORPAY_PLAN_ENTERPRISE_YEARLY ?? "___"]: "ENTERPRISE",
};

function rzpStatusToInternal(event: string): SubscriptionStatus {
  const map: Record<string, SubscriptionStatus> = {
    "subscription.activated": "ACTIVE",
    "subscription.charged": "ACTIVE",
    "subscription.completed": "CANCELED",
    "subscription.cancelled": "CANCELED",
    "subscription.pending": "PAST_DUE",
    "subscription.halted": "PAST_DUE",
    "subscription.paused": "PAUSED",
    "subscription.resumed": "ACTIVE",
    "payment.failed": "PAST_DUE",
  };
  return map[event] ?? "INCOMPLETE";
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("x-razorpay-signature") ?? "";

  if (!verifyWebhookSignature(body, signature)) {
    return new Response("Invalid signature", { status: 400 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(body) as Record<string, unknown>;
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const event = payload.event as string;
  const subscription = (
    (payload.payload as Record<string, unknown>)?.subscription as
      | Record<string, unknown>
      | undefined
  );
  const entity = subscription?.entity as Record<string, unknown> | undefined;

  if (!entity) {
    return new Response(JSON.stringify({ received: true }), { status: 200 });
  }

  const rzpSubscriptionId = entity.id as string;
  const rzpPlanId = entity.plan_id as string;
  const notes = entity.notes as Record<string, string> | undefined;
  const workspaceId = notes?.workspaceId;

  if (!workspaceId && !rzpSubscriptionId) {
    return new Response(JSON.stringify({ received: true }), { status: 200 });
  }

  const status = rzpStatusToInternal(event);
  const tier: PlanTier =
    event === "subscription.cancelled" || event === "subscription.completed"
      ? "FREE"
      : (PLAN_ID_TO_TIER[rzpPlanId] ?? "FREE");

  // Derive period boundaries from subscription entity
  const currentStart = entity.current_start
    ? new Date((entity.current_start as number) * 1000)
    : undefined;
  const currentEnd = entity.current_end
    ? new Date((entity.current_end as number) * 1000)
    : undefined;

  try {
    if (workspaceId) {
      await prisma.subscription.upsert({
        where: { workspaceId },
        create: {
          workspaceId,
          rzpSubscriptionId,
          rzpPlanId,
          tier,
          status,
          currentPeriodStart: currentStart,
          currentPeriodEnd: currentEnd,
        },
        update: {
          rzpSubscriptionId,
          rzpPlanId,
          tier,
          status,
          currentPeriodStart: currentStart,
          currentPeriodEnd: currentEnd,
        },
      });
    } else {
      // Look up by subscription ID if workspaceId not in notes
      await prisma.subscription.updateMany({
        where: { rzpSubscriptionId },
        data: { tier, status, currentPeriodStart: currentStart, currentPeriodEnd: currentEnd },
      });
    }
  } catch (err) {
    console.error("Webhook DB error:", err);
    return new Response("DB error", { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 });
}
