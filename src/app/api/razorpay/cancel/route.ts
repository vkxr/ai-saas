import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { cancelRazorpaySubscription } from "@/lib/razorpay/client";
import { apiResponse, apiError } from "@/lib/utils";

const schema = z.object({
  workspaceId: z.string().cuid(),
  cancelImmediately: z.boolean().default(false),
});

export async function POST(req: NextRequest) {
  const userId = req.headers.get("x-user-id");
  if (!userId) return apiError("Unauthorized", 401);

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return apiError("Validation failed");

  const { workspaceId, cancelImmediately } = parsed.data;

  const member = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
  });
  if (!member || member.role !== "OWNER") {
    return apiError("Only the workspace owner can cancel the subscription", 403);
  }

  const subscription = await prisma.subscription.findUnique({
    where: { workspaceId },
  });

  if (!subscription?.rzpSubscriptionId) {
    return apiError("No active subscription found", 400);
  }

  if (subscription.tier === "FREE") {
    return apiError("Nothing to cancel — already on Free plan", 400);
  }

  await cancelRazorpaySubscription(
    subscription.rzpSubscriptionId,
    !cancelImmediately
  );

  await prisma.subscription.update({
    where: { workspaceId },
    data: {
      cancelAtPeriodEnd: !cancelImmediately,
      status: cancelImmediately ? "CANCELED" : subscription.status,
      tier: cancelImmediately ? "FREE" : subscription.tier,
    },
  });

  return apiResponse({
    canceled: true,
    immediate: cancelImmediately,
    message: cancelImmediately
      ? "Subscription canceled immediately. Downgraded to Free."
      : "Subscription will cancel at period end.",
  });
}
