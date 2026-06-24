import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { createRazorpayCustomer, createRazorpaySubscription } from "@/lib/razorpay/client";
import { PLANS } from "@/lib/razorpay/plans";
import { apiResponse, apiError } from "@/lib/utils";
import type { PlanTier } from "@/types";

const schema = z.object({
  workspaceId: z.string().cuid(),
  tier: z.enum(["PRO", "ENTERPRISE"]),
  interval: z.enum(["monthly", "yearly"]).default("monthly"),
});

export async function POST(req: NextRequest) {
  const userId = req.headers.get("x-user-id");
  const userEmail = req.headers.get("x-user-email");
  if (!userId || !userEmail) return apiError("Unauthorized", 401);

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return apiError("Validation failed");

  const { workspaceId, tier, interval } = parsed.data;

  const member = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
  });
  if (!member || (member.role !== "OWNER" && member.role !== "ADMIN")) {
    return apiError("Insufficient permissions", 403);
  }

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    include: { subscription: true, owner: { select: { name: true } } },
  });
  if (!workspace) return apiError("Workspace not found", 404);

  const plan = PLANS[tier as PlanTier];
  const planId = interval === "yearly" ? plan.rzpPlanYearly : plan.rzpPlanMonthly;
  if (!planId) return apiError("Plan not configured. Add Razorpay plan IDs to .env.", 500);

  // Create or reuse Razorpay customer
  let rzpCustomerId = workspace.subscription?.rzpCustomerId;
  if (!rzpCustomerId) {
    rzpCustomerId = await createRazorpayCustomer(userEmail, workspace.owner.name);

    await prisma.subscription.upsert({
      where: { workspaceId },
      create: { workspaceId, rzpCustomerId, tier: "FREE", status: "ACTIVE" },
      update: { rzpCustomerId },
    });
  }

  // Create subscription (status: created — not yet charged)
  const subscription = await createRazorpaySubscription(
    planId,
    rzpCustomerId,
    interval === "yearly" ? 12 : 120,
    { workspaceId, tier, interval }
  );

  // Persist subscription ID immediately
  await prisma.subscription.update({
    where: { workspaceId },
    data: {
      rzpSubscriptionId: subscription.id,
      rzpPlanId: planId,
      status: "INCOMPLETE",
    },
  });

  return apiResponse({
    subscriptionId: subscription.id,
    // razorpay_key is safe to send — it's the publishable key
    razorpayKeyId: process.env.RAZORPAY_KEY_ID,
  });
}
