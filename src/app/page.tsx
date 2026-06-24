import Link from "next/link";
import { ArrowRight, Zap, Shield, Users, BarChart3, Cpu, Globe, KeyRound, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const features = [
  {
    icon: Cpu,
    title: "AI-Gated by Plan",
    description: "Middleware enforces your subscription tier before any AI call reaches the model. Zero exceptions.",
  },
  {
    icon: Shield,
    title: "JWT Refresh Rotation",
    description: "Short-lived access tokens with server-side refresh rotation. Compromised tokens auto-revoke entire sessions.",
  },
  {
    icon: Users,
    title: "Team Workspaces",
    description: "Multi-tenant architecture with owner, admin, and member roles. Invite by email, manage permissions instantly.",
  },
  {
    icon: Zap,
    title: "Redis Rate Limiting",
    description: "Per-workspace sliding window rate limits scale with your plan tier. FREE: 10/min. PRO: 60/min. Enterprise: 300/min.",
  },
  {
    icon: BarChart3,
    title: "Usage Quota Tracking",
    description: "Every token counted in PostgreSQL. Monthly summaries, real-time quota checks, and cost attribution per workspace.",
  },
  {
    icon: Globe,
    title: "Razorpay Billing",
    description: "Subscription checkout, plan tiers, and webhook handling. Plans auto-activate on payment with HMAC-verified webhooks.",
  },
];

const plans = [
  {
    name: "Free",
    price: "₹0",
    description: "For individuals exploring AI",
    badge: null,
    features: ["50 AI requests/month", "100K tokens", "1 workspace", "Community support"],
    cta: "Start free",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "₹2,499",
    per: "/month",
    description: "For growing teams",
    badge: "Most Popular",
    features: [
      "2,000 AI requests/month",
      "2M tokens",
      "5 workspaces",
      "10 team members",
      "Priority support",
      "Advanced analytics",
      "API access",
    ],
    cta: "Upgrade to Pro",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "₹24,999",
    per: "/month",
    description: "For large organizations",
    badge: null,
    features: [
      "50,000 AI requests/month",
      "50M tokens",
      "Unlimited workspaces",
      "Unlimited members",
      "Dedicated support",
      "Custom SLA",
      "SSO / SAML",
      "Audit logs",
    ],
    cta: "Contact sales",
    highlighted: false,
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#080811] text-white overflow-x-hidden">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-violet-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-violet-800/8 rounded-full blur-[100px]" />
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-semibold tracking-tight">NexusAI</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm text-zinc-400">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          <a href="#demo" className="hover:text-white transition-colors">Demo</a>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/login">Sign in</Link>
          </Button>
          <Button size="sm" className="bg-violet-600 hover:bg-violet-700" asChild>
            <Link href="/register">Get started</Link>
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 flex flex-col items-center text-center px-6 pt-24 pb-32 max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/5 px-4 py-1.5 text-xs text-violet-300 mb-8 backdrop-blur-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
          Production-ready · Open source · Self-hostable
        </div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-tight mb-6">
          AI-Native SaaS
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-violet-300 to-violet-500">
            built for scale
          </span>
        </h1>

        <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mb-10 leading-relaxed">
          Multi-tenant workspaces. Razorpay plan tiers. Redis rate limiting. JWT refresh rotation.
          AI endpoints gated at middleware. Everything you need, nothing you don&apos;t.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <Button size="xl" className="bg-violet-600 hover:bg-violet-700 shadow-lg shadow-violet-500/25" asChild>
            <Link href="/login">
              Try the demo <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
          <Button size="xl" variant="outline" className="border-white/10 text-white hover:bg-white/5" asChild>
            <a href="https://github.com/vkxr/ai-saas" target="_blank" rel="noopener noreferrer">
              View on GitHub
            </a>
          </Button>
        </div>

        {/* Tech badges */}
        <div className="flex flex-wrap gap-2 justify-center mt-12">
          {["Next.js 15", "TypeScript", "PostgreSQL", "Prisma", "Redis", "Razorpay", "OpenRouter", "Docker"].map((tech) => (
            <span
              key={tech}
              className="px-3 py-1 rounded-full text-xs border border-white/8 bg-white/3 text-zinc-400"
            >
              {tech}
            </span>
          ))}
        </div>
      </section>

      {/* Demo Credentials */}
      <section id="demo" className="relative z-10 px-6 pb-20 max-w-3xl mx-auto">
        <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/5 p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
              <KeyRound className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Try it instantly — no sign-up needed</h2>
              <p className="text-sm text-zinc-400">Use these credentials to explore the full platform</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 mb-6">
            {[
              { role: "Admin account", email: "admin@nexusai.dev", password: "Password123!", badge: "ADMIN" },
              { role: "Demo account", email: "demo@nexusai.dev", password: "Password123!", badge: "USER" },
            ].map((cred) => (
              <div key={cred.email} className="rounded-xl border border-white/8 bg-white/3 p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-zinc-500">{cred.role}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full border border-white/10 bg-white/5 text-zinc-400 font-mono">
                    {cred.badge}
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2 rounded-lg bg-black/30 px-3 py-2">
                    <span className="text-xs text-zinc-400 font-mono truncate">{cred.email}</span>
                    <Copy className="w-3 h-3 text-zinc-600 flex-shrink-0" />
                  </div>
                  <div className="flex items-center justify-between gap-2 rounded-lg bg-black/30 px-3 py-2">
                    <span className="text-xs text-zinc-400 font-mono">{cred.password}</span>
                    <Copy className="w-3 h-3 text-zinc-600 flex-shrink-0" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" asChild>
            <Link href="/login">
              Sign in to the demo <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative z-10 px-6 pb-32 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Production from day one
          </h2>
          <p className="text-zinc-400 max-w-xl mx-auto">
            Every architectural decision made for real-world production deployment, not toy demos.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f) => (
            <div
              key={f.title}
              className="group relative rounded-2xl border border-white/8 bg-white/2 p-6 hover:border-violet-500/30 hover:bg-violet-500/5 transition-all duration-300"
            >
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mb-4 group-hover:bg-violet-500/20 transition-colors">
                <f.icon className="w-5 h-5 text-violet-400" />
              </div>
              <h3 className="font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="relative z-10 px-6 pb-32 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Simple, transparent pricing</h2>
          <p className="text-zinc-400">Start free. Scale when you need it.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl border p-8 flex flex-col ${
                plan.highlighted
                  ? "border-violet-500/50 bg-violet-500/5 shadow-lg shadow-violet-500/10"
                  : "border-white/8 bg-white/2"
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-violet-600 text-white border-0 text-xs px-3">
                    {plan.badge}
                  </Badge>
                </div>
              )}
              <div className="mb-6">
                <p className="text-sm text-zinc-400 mb-1">{plan.name}</p>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  {plan.per && <span className="text-zinc-400 text-sm">{plan.per}</span>}
                </div>
                <p className="text-sm text-zinc-400">{plan.description}</p>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-zinc-300">
                    <span className="w-4 h-4 rounded-full bg-violet-500/20 text-violet-400 flex items-center justify-center flex-shrink-0 mt-0.5 text-xs">✓</span>
                    {f}
                  </li>
                ))}
              </ul>

              <Button
                className={plan.highlighted ? "bg-violet-600 hover:bg-violet-700" : ""}
                variant={plan.highlighted ? "default" : "outline"}
                asChild
              >
                <Link href="/register">{plan.cta}</Link>
              </Button>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 px-6 pb-32 max-w-3xl mx-auto text-center">
        <div className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-12">
          <h2 className="text-3xl font-bold mb-4">Ready to ship your AI product?</h2>
          <p className="text-zinc-400 mb-8">
            Clone, configure, deploy. Your production AI SaaS is minutes away.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="xl" className="bg-violet-600 hover:bg-violet-700" asChild>
              <Link href="/register">
                Create free account <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
            <Button size="xl" variant="outline" className="border-white/10 text-white hover:bg-white/5" asChild>
              <a href="https://github.com/vkxr/ai-saas" target="_blank" rel="noopener noreferrer">
                View source
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-zinc-500">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-violet-600 flex items-center justify-center">
              <Zap className="w-3 h-3 text-white" />
            </div>
            <span>NexusAI © 2025</span>
          </div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-zinc-300 transition-colors">Privacy</a>
            <a href="#" className="hover:text-zinc-300 transition-colors">Terms</a>
            <a href="https://github.com/vkxr/ai-saas" className="hover:text-zinc-300 transition-colors">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
