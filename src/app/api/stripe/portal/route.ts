// Stripe has been replaced with Razorpay.
// Use /api/razorpay/cancel to manage subscriptions.
import { apiError } from "@/lib/utils";

export async function POST() {
  return apiError("Stripe portal not available. Use /api/razorpay/cancel.", 410);
}
