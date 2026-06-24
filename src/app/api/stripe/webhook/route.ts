// Stripe has been replaced with Razorpay.
// Razorpay webhooks are handled at /api/razorpay/webhook.
export async function POST() {
  return new Response("Not implemented. Use /api/razorpay/webhook.", { status: 410 });
}
