import type { PlanTier } from "@/types";

// Amounts in paise (INR). 1 INR = 100 paise.
// ₹2,499/mo ≈ $29 | ₹24,999/mo ≈ $299
export interface PlanConfig {
  tier: PlanTier;
  name: string;
  description: string;
  monthlyPricePaise: number;
  yearlyPricePaise: number;
  monthlyPriceDisplay: string;
  yearlyPriceDisplay: string;
  monthlyTokenQuota: number;
  monthlyCallQuota: number;
  maxWorkspaceMembers: number;
  maxWorkspaces: number;
  features: string[];
  rzpPlanMonthly: string | null;
  rzpPlanYearly: string | null;
}

export const PLANS: Record<PlanTier, PlanConfig> = {
  FREE: {
    tier: "FREE",
    name: "Free",
    description: "Perfect for individuals getting started",
    monthlyPricePaise: 0,
    yearlyPricePaise: 0,
    monthlyPriceDisplay: "₹0",
    yearlyPriceDisplay: "₹0",
    monthlyTokenQuota: 100_000,
    monthlyCallQuota: 50,
    maxWorkspaceMembers: 1,
    maxWorkspaces: 1,
    features: [
      "50 AI requests/month",
      "100K tokens/month",
      "1 workspace",
      "Community support",
      "Basic analytics",
    ],
    rzpPlanMonthly: null,
    rzpPlanYearly: null,
  },
  PRO: {
    tier: "PRO",
    name: "Pro",
    description: "For growing teams and power users",
    monthlyPricePaise: 249900,
    yearlyPricePaise: 2499000,
    monthlyPriceDisplay: "₹2,499",
    yearlyPriceDisplay: "₹24,990",
    monthlyTokenQuota: 2_000_000,
    monthlyCallQuota: 2000,
    maxWorkspaceMembers: 10,
    maxWorkspaces: 5,
    features: [
      "2,000 AI requests/month",
      "2M tokens/month",
      "5 workspaces",
      "10 team members",
      "Priority support",
      "Advanced analytics",
      "API access",
      "Redis rate limiting",
    ],
    rzpPlanMonthly: process.env.RAZORPAY_PLAN_PRO_MONTHLY ?? null,
    rzpPlanYearly: process.env.RAZORPAY_PLAN_PRO_YEARLY ?? null,
  },
  ENTERPRISE: {
    tier: "ENTERPRISE",
    name: "Enterprise",
    description: "Unlimited scale for large organizations",
    monthlyPricePaise: 2499900,
    yearlyPricePaise: 24999000,
    monthlyPriceDisplay: "₹24,999",
    yearlyPriceDisplay: "₹2,49,990",
    monthlyTokenQuota: 50_000_000,
    monthlyCallQuota: 50000,
    maxWorkspaceMembers: -1,
    maxWorkspaces: -1,
    features: [
      "50,000 AI requests/month",
      "50M tokens/month",
      "Unlimited workspaces",
      "Unlimited members",
      "Dedicated support",
      "Custom SLA",
      "SSO / SAML",
      "Audit logs",
      "Custom integrations",
      "On-premise option",
    ],
    rzpPlanMonthly: process.env.RAZORPAY_PLAN_ENTERPRISE_MONTHLY ?? null,
    rzpPlanYearly: process.env.RAZORPAY_PLAN_ENTERPRISE_YEARLY ?? null,
  },
};

export function getPlanConfig(tier: PlanTier): PlanConfig {
  return PLANS[tier];
}

export function getQuotaForTier(tier: PlanTier): { tokens: number; calls: number } {
  const plan = PLANS[tier];
  return { tokens: plan.monthlyTokenQuota, calls: plan.monthlyCallQuota };
}
