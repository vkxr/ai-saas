import Razorpay from "razorpay";
import crypto from "crypto";

export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function createRazorpayCustomer(
  email: string,
  name: string
): Promise<string> {
  const customer = await razorpay.customers.create({
    email,
    name,
    fail_existing: "0",
  });
  return customer.id;
}

export async function createRazorpaySubscription(
  planId: string,
  customerId: string,
  totalCount = 120,
  notes?: Record<string, string>
): Promise<{ id: string; short_url: string }> {
  const subscription = await razorpay.subscriptions.create({
    plan_id: planId,
    customer_id: customerId,
    total_count: totalCount,
    quantity: 1,
    customer_notify: 1,
    notes,
  });
  return {
    id: subscription.id,
    short_url: (subscription as unknown as Record<string, string>).short_url ?? "",
  };
}

export async function cancelRazorpaySubscription(
  subscriptionId: string,
  cancelAtCycleEnd = true
): Promise<void> {
  await razorpay.subscriptions.cancel(subscriptionId, cancelAtCycleEnd);
}

export function verifyWebhookSignature(
  body: string,
  signature: string
): boolean {
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET!)
    .update(body)
    .digest("hex");
  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature),
    Buffer.from(signature)
  );
}

export function verifyPaymentSignature(params: {
  razorpay_payment_id: string;
  razorpay_subscription_id: string;
  razorpay_signature: string;
}): boolean {
  const payload = `${params.razorpay_payment_id}|${params.razorpay_subscription_id}`;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
    .update(payload)
    .digest("hex");
  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature),
    Buffer.from(params.razorpay_signature)
  );
}
