"use client";

import { useState, useCallback } from "react";
import Script from "next/script";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { useAuthStore } from "@/stores/auth-store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { PLANS } from "@/lib/razorpay/plans";
import { Check, Zap, AlertTriangle } from "lucide-react";
import type { PlanTier } from "@/types";

// Razorpay types
declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}
interface RazorpayOptions {
  key: string;
  subscription_id: string;
  name: string;
  description: string;
  image?: string;
  handler: (response: RazorpayPaymentResponse) => void;
  prefill?: { name?: string; email?: string };
  theme?: { color?: string };
  modal?: { ondismiss?: () => void };
}
interface RazorpayPaymentResponse {
  razorpay_payment_id: string;
  razorpay_subscription_id: string;
  razorpay_signature: string;
}
interface RazorpayInstance {
  open(): void;
  on(event: string, handler: () => void): void;
}

const TIERS: PlanTier[] = ["FREE", "PRO", "ENTERPRISE"];

export default function BillingPage() {
  const { currentWorkspace } = useWorkspaceStore();
  const { user } = useAuthStore();
  const [interval, setInterval] = useState<"monthly" | "yearly">("monthly");
  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  const [canceling, setCanceling] = useState(false);
  const [rzpReady, setRzpReady] = useState(false);

  const currentTier = (currentWorkspace?.subscription?.tier ?? "FREE") as PlanTier;
  const subStatus = currentWorkspace?.subscription?.status ?? "ACTIVE";
  const cancelAtPeriodEnd = currentWorkspace?.subscription?.cancelAtPeriodEnd ?? false;

  const openRazorpayCheckout = useCallback(
    (subscriptionId: string, razorpayKeyId: string) => {
      if (!window.Razorpay) {
        toast({ variant: "destructive", title: "Razorpay not loaded", description: "Please refresh and try again." });
        return;
      }

      const options: RazorpayOptions = {
        key: razorpayKeyId,
        subscription_id: subscriptionId,
        name: "NexusAI",
        description: `Upgrade to ${loadingTier} — ${interval}`,
        handler: (_response) => {
          toast({ title: "Payment successful!", description: "Your plan is being activated. Refresh in a moment." });
          setLoadingTier(null);
          setTimeout(() => window.location.reload(), 2000);
        },
        prefill: { name: user?.name, email: user?.email ?? undefined },
        theme: { color: "#15803d" },
        modal: {
          ondismiss: () => {
            toast({ title: "Payment canceled", description: "Your plan was not changed." });
            setLoadingTier(null);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    },
    [loadingTier, interval, user]
  );

  const handleUpgrade = async (tier: PlanTier) => {
    if (!currentWorkspace || tier === "FREE" || !rzpReady) return;
    setLoadingTier(tier);

    try {
      const res = await fetch("/api/razorpay/create-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId: currentWorkspace.id, tier, interval }),
      });
      const json = await res.json();

      if (!res.ok) {
        toast({ variant: "destructive", title: "Error", description: json.error });
        setLoadingTier(null);
        return;
      }

      openRazorpayCheckout(json.data.subscriptionId, json.data.razorpayKeyId);
    } catch {
      toast({ variant: "destructive", title: "Network error", description: "Please try again." });
      setLoadingTier(null);
    }
  };

  const handleCancel = async () => {
    if (!currentWorkspace) return;
    if (!confirm("Cancel your subscription? You'll stay on the current plan until the period ends.")) return;

    setCanceling(true);
    try {
      const res = await fetch("/api/razorpay/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId: currentWorkspace.id, cancelImmediately: false }),
      });
      const json = await res.json();

      if (!res.ok) {
        toast({ variant: "destructive", title: "Error", description: json.error });
        return;
      }

      toast({ title: "Subscription canceled", description: json.data.message });
      setTimeout(() => window.location.reload(), 1500);
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Please try again." });
    } finally {
      setCanceling(false);
    }
  };

  const periodEnd = currentWorkspace?.subscription?.currentPeriodEnd;

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        onLoad={() => setRzpReady(true)}
        strategy="lazyOnload"
      />

      <div className="p-8 max-w-5xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#111] mb-1">Billing & Plans</h1>
          <p className="text-gray-400 text-sm">Manage your subscription · Powered by Razorpay</p>
        </div>

        {/* Current Plan Status */}
        <Card className="border-gray-100 bg-white mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant={currentTier.toLowerCase() as "free" | "pro" | "enterprise"}>
                    {currentTier}
                  </Badge>
                  <Badge variant={subStatus === "ACTIVE" || subStatus === "TRIALING" ? "success" : "warning"}>
                    {subStatus}
                  </Badge>
                  {cancelAtPeriodEnd && (
                    <Badge variant="warning" className="gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      Cancels at period end
                    </Badge>
                  )}
                </div>
                <p className="text-[#111] font-medium">{PLANS[currentTier].name} Plan</p>
                <p className="text-sm text-gray-400">
                  {currentTier === "FREE"
                    ? "Free forever with limited usage"
                    : periodEnd
                    ? `Renews ${new Date(periodEnd).toLocaleDateString("en-IN", { month: "long", day: "numeric", year: "numeric" })}`
                    : ""}
                </p>
              </div>
              {currentTier !== "FREE" && !cancelAtPeriodEnd && (
                <Button
                  variant="outline"
                  size="sm"
                  className="border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600"
                  onClick={handleCancel}
                  loading={canceling}
                >
                  Cancel subscription
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Interval Toggle */}
        <div className="flex items-center justify-center mb-8">
          <div className="inline-flex rounded-xl border border-gray-200 bg-gray-50 p-1">
            {(["monthly", "yearly"] as const).map((i) => (
              <button
                key={i}
                onClick={() => setInterval(i)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  interval === i
                    ? "bg-green-700 text-white shadow-sm"
                    : "text-gray-500 hover:text-[#111]"
                }`}
              >
                {i === "monthly" ? "Monthly" : "Yearly"}{" "}
                {i === "yearly" && (
                  <span className="text-xs text-green-400 ml-1">−17%</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {TIERS.map((tier) => {
            const plan = PLANS[tier];
            const isCurrent = tier === currentTier;
            const isHighlighted = tier === "PRO";
            const price = interval === "yearly" ? plan.yearlyPriceDisplay : plan.monthlyPriceDisplay;
            const perLabel = plan.monthlyPricePaise === 0 ? "" : interval === "yearly" ? "/yr" : "/mo";

            return (
              <div
                key={tier}
                className={`relative rounded-2xl border p-6 flex flex-col bg-white ${
                  isHighlighted
                    ? "border-green-200 shadow-lg shadow-green-500/8"
                    : "border-gray-100 hover:shadow-sm"
                } transition-shadow`}
              >
                {isHighlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-green-700 text-white border-0 text-xs px-3">
                      Most popular
                    </Badge>
                  </div>
                )}

                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <p className="font-semibold text-[#111]">{plan.name}</p>
                    {isCurrent && (
                      <Badge variant={tier.toLowerCase() as "free" | "pro" | "enterprise"}>
                        Current
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-3xl font-bold text-[#111]">{price}</span>
                    {perLabel && <span className="text-gray-400 text-sm">{perLabel}</span>}
                  </div>
                  <p className="text-sm text-gray-400">{plan.description}</p>
                </div>

                <ul className="space-y-2.5 mb-6 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                      <Check className="w-3.5 h-3.5 text-green-600 flex-shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>

                {!isCurrent ? (
                  <Button
                    className={isHighlighted ? "bg-green-700 hover:bg-green-800 text-white" : "border border-gray-200 text-[#111] bg-white hover:bg-gray-50"}
                    variant={isHighlighted ? "default" : "outline"}
                    loading={loadingTier === tier}
                    disabled={tier === "FREE" || !!loadingTier || !rzpReady}
                    onClick={() => handleUpgrade(tier)}
                  >
                    {tier === "FREE" ? (
                      "Downgrade to Free"
                    ) : (
                      <>
                        <Zap className="w-4 h-4" />
                        Upgrade to {plan.name}
                      </>
                    )}
                  </Button>
                ) : (
                  <Button variant="secondary" disabled className="cursor-default">
                    Current plan
                  </Button>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-8 rounded-xl border border-gray-100 bg-gray-50 p-4">
          <p className="text-xs text-gray-400 text-center">
            Payments processed securely by{" "}
            <span className="text-gray-600 font-medium">Razorpay</span>. Subscriptions
            auto-renew monthly or yearly. Cancel anytime before renewal.
            INR pricing — GST may apply.
          </p>
        </div>
      </div>
    </>
  );
}
