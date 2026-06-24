// Stripe has been replaced with Razorpay.
// Use /api/razorpay/create-subscription instead.
import { apiError } from "@/lib/utils";

export async function POST() {
  return apiError("Stripe is not configured. Use /api/razorpay/create-subscription.", 410);
}
