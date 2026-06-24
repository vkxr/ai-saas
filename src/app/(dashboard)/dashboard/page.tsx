"use client";

import { useEffect, useState } from "react";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { useAuthStore } from "@/stores/auth-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { formatNumber } from "@/lib/utils";
import {
  Cpu,
  Users,
  Zap,
  TrendingUp,
  ArrowRight,
  BarChart3,
} from "lucide-react";
import Link from "next/link";
import { PLANS } from "@/lib/razorpay/plans";
import type { PlanTier } from "@/types";

interface WorkspaceDetail {
  memberCount: number;
  subscription: {
    tier: PlanTier;
    status: string;
    currentPeriodEnd: string | null;
  } | null;
  usage: {
    monthlyTokens: number;
    monthlyCost: number;
    callCount: number;
  };
}

export default function DashboardPage() {
  const { currentWorkspace } = useWorkspaceStore();
  const { user } = useAuthStore();
  const [detail, setDetail] = useState<WorkspaceDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentWorkspace) return;
    setLoading(true);
    fetch(`/api/workspace/${currentWorkspace.id}`)
      .then((r) => r.json())
      .then((j) => { setDetail(j.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [currentWorkspace?.id]);

  const tier = (detail?.subscription?.tier ?? "FREE") as PlanTier;
  const plan = PLANS[tier];
  const tokensUsed = detail?.usage.monthlyTokens ?? 0;
  const tokenQuota = plan.monthlyTokenQuota;
  const quotaPercent = Math.min((tokensUsed / tokenQuota) * 100, 100);

  const stats = [
    {
      label: "AI Calls This Month",
      value: loading ? null : formatNumber(detail?.usage.callCount ?? 0),
      icon: Cpu,
      color: "text-violet-400",
      bg: "bg-violet-500/10",
      change: "+12%",
    },
    {
      label: "Tokens Used",
      value: loading ? null : formatNumber(tokensUsed),
      icon: Zap,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      change: `of ${formatNumber(tokenQuota)}`,
    },
    {
      label: "Team Members",
      value: loading ? null : (detail?.memberCount ?? 0).toString(),
      icon: Users,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      change: `max ${plan.maxWorkspaceMembers === -1 ? "∞" : plan.maxWorkspaceMembers}`,
    },
    {
      label: "Monthly Cost",
      value: loading ? null : `$${((detail?.usage.monthlyCost ?? 0)).toFixed(2)}`,
      icon: TrendingUp,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      change: "this month",
    },
  ];

  return (
    <div className="p-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-2xl font-bold text-white">
            Good morning, {user?.name?.split(" ")[0]} 👋
          </h1>
        </div>
        <p className="text-zinc-400 text-sm">
          {currentWorkspace?.name} · {" "}
          <Badge variant={tier.toLowerCase() as "free" | "pro" | "enterprise"} className="text-xs">
            {tier}
          </Badge>
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <Card key={stat.label} className="border-white/8 bg-white/2 hover:border-white/12 transition-colors">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-9 h-9 rounded-xl ${stat.bg} flex items-center justify-center`}>
                  <stat.icon className={`w-4 h-4 ${stat.color}`} />
                </div>
              </div>
              {loading ? (
                <Skeleton className="h-7 w-20 mb-1 bg-white/5" />
              ) : (
                <p className="text-2xl font-bold text-white mb-0.5">{stat.value}</p>
              )}
              <p className="text-xs text-zinc-500">{stat.label}</p>
              <p className="text-xs text-zinc-600 mt-1">{stat.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main content grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Token Quota */}
        <Card className="lg:col-span-2 border-white/8 bg-white/2">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base text-white">Token Quota</CardTitle>
              <Badge variant={tier.toLowerCase() as "free" | "pro" | "enterprise"}>
                {tier} Plan
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-zinc-400">Used this month</span>
                  <span className="text-white">
                    {formatNumber(tokensUsed)} / {formatNumber(tokenQuota)} tokens
                  </span>
                </div>
                <Progress
                  value={quotaPercent}
                  className="h-2 bg-white/5"
                  indicatorClassName={
                    quotaPercent > 85
                      ? "bg-red-500"
                      : quotaPercent > 60
                      ? "bg-amber-500"
                      : "bg-violet-500"
                  }
                />
                <p className="text-xs text-zinc-500 mt-1.5">{quotaPercent.toFixed(1)}% used</p>
              </div>

              {tier === "FREE" && quotaPercent > 50 && (
                <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4">
                  <p className="text-sm text-violet-300 font-medium mb-1">Running low on quota?</p>
                  <p className="text-xs text-zinc-400 mb-3">
                    Upgrade to Pro for 2M tokens/month and higher rate limits.
                  </p>
                  <Button size="sm" className="bg-violet-600 hover:bg-violet-700" asChild>
                    <Link href="/billing">Upgrade to Pro <ArrowRight className="w-3 h-3" /></Link>
                  </Button>
                </div>
              )}

              <div className="grid grid-cols-3 gap-3 pt-2">
                {[
                  { label: "Input tokens", value: formatNumber(Math.round(tokensUsed * 0.6)) },
                  { label: "Output tokens", value: formatNumber(Math.round(tokensUsed * 0.4)) },
                  { label: "Avg per call", value: detail?.usage.callCount ? formatNumber(Math.round(tokensUsed / detail.usage.callCount)) : "—" },
                ].map((m) => (
                  <div key={m.label} className="rounded-lg bg-white/3 p-3">
                    <p className="text-lg font-semibold text-white">{m.value}</p>
                    <p className="text-xs text-zinc-500">{m.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="border-white/8 bg-white/2">
          <CardHeader className="pb-4">
            <CardTitle className="text-base text-white">Quick actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { label: "Start AI chat", href: "/ai", icon: Cpu, color: "text-violet-400" },
              { label: "Invite team member", href: "/workspace", icon: Users, color: "text-emerald-400" },
              { label: "View analytics", href: "/dashboard", icon: BarChart3, color: "text-blue-400" },
              { label: "Manage billing", href: "/billing", icon: Zap, color: "text-amber-400" },
            ].map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-zinc-400 hover:text-white hover:bg-white/5 transition-all group"
              >
                <action.icon className={`w-4 h-4 ${action.color}`} />
                {action.label}
                <ArrowRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
