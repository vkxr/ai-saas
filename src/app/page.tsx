import Link from "next/link";
import { ArrowRight, Zap, Shield, Users, BarChart3, Cpu, Globe, KeyRound, Copy } from "lucide-react";

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
    features: ["50 AI requests / month", "100K tokens", "1 workspace", "Community support"],
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
      "2,000 AI requests / month",
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
      "50,000 AI requests / month",
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

const TECHS = ["Next.js 15", "TypeScript", "PostgreSQL", "Prisma", "Redis", "Razorpay", "OpenRouter", "Docker"];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#f7f6f3] text-[#111] overflow-x-hidden">

      {/* ══════════════════════════════════════════
          HERO — full-viewport nature image
      ══════════════════════════════════════════ */}
      <section className="relative min-h-screen flex flex-col">

        {/* Nature background photo */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1920&q=85"
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none select-none"
        />
        {/* Overlay — deep shadow across the entire frame so white text is unmistakably the focus */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.42) 35%, rgba(0,0,0,0.48) 60%, rgba(0,0,0,0.72) 100%)",
          }}
        />

        {/* ── NAV ── */}
        <nav className="relative z-20 flex items-center justify-between px-6 md:px-10 py-5 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.18)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.28)" }}
            >
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-[15px] font-semibold text-white tracking-tight">NexusAI</span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm text-white/70 font-medium">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <a href="#demo" className="hover:text-white transition-colors">Demo</a>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-white/75 hover:text-white transition-colors hidden sm:block font-medium">
              Sign in
            </Link>
            <Link
              href="/register"
              className="text-[13px] font-semibold bg-white text-[#111] px-4 py-1.5 rounded-full hover:bg-white/90 transition-colors"
            >
              Get started
            </Link>
          </div>
        </nav>

        {/* ── HERO CONTENT ── */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-between px-6 pt-8 pb-10">

          {/* Heading block — vertically centered */}
          <div className="flex-1 flex flex-col items-center justify-center text-center max-w-4xl mx-auto">

            {/* Announcement badge */}
            <div
              className="inline-flex items-center gap-2 rounded-full px-3 py-1 mb-8 text-xs text-white/80"
              style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.15)" }}
            >
              <span className="bg-green-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">NEW</span>
              AI-Native Multi-Tenant SaaS — production-ready
              <ArrowRight className="w-3 h-3 opacity-60" />
            </div>

            <h1
              className="font-bold text-white leading-[1.0] tracking-tight mb-5"
              style={{ fontSize: "clamp(40px, 7vw, 76px)" }}
            >
              Build AI Products.
              <br />
              Ship with Confidence.
            </h1>

            <p className="text-base md:text-lg text-white/60 max-w-xl mb-10 leading-relaxed">
              Multi-tenant workspaces, Razorpay billing, Redis rate limiting, and JWT rotation —
              all wired up and production-ready.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 items-center">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 bg-white text-[#111] font-semibold px-7 py-2.5 rounded-full hover:bg-white/90 transition-colors text-sm shadow-lg"
              >
                Try the demo <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="https://github.com/vkxr/ai-saas"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 font-semibold px-7 py-2.5 rounded-full transition-colors text-sm text-white"
                style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.22)" }}
              >
                View on GitHub
              </a>
            </div>
          </div>

          {/* ── FLOATING DEMO CARD — bottom of hero ── */}
          <div id="demo" className="w-full max-w-lg mt-8">
            <div
              className="rounded-2xl p-5 shadow-2xl"
              style={{ background: "rgba(255,255,255,0.88)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.6)" }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-green-50 border border-green-100 flex items-center justify-center flex-shrink-0">
                    <KeyRound className="w-3.5 h-3.5 text-green-700" />
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-[#111]">Try it instantly — no sign-up needed</p>
                    <p className="text-[11px] text-gray-500">Use these credentials to explore the full platform</p>
                  </div>
                </div>
                <span className="text-[10px] bg-green-50 text-green-700 border border-green-100 px-2 py-0.5 rounded-full font-semibold flex-shrink-0 ml-2">
                  Live
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                {[
                  { role: "Admin account", email: "admin@nexusai.dev", badge: "ADMIN" },
                  { role: "Demo account", email: "demo@nexusai.dev", badge: "USER" },
                ].map((cred) => (
                  <div key={cred.email} className="rounded-xl bg-gray-50 border border-gray-100 p-3">
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="text-[10px] text-gray-400 font-medium">{cred.role}</span>
                      <span className="text-[9px] px-1.5 py-0.5 bg-white border border-gray-200 text-gray-500 rounded font-mono">
                        {cred.badge}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-white rounded-lg px-2.5 py-1.5 border border-gray-100 mb-1.5">
                      <span className="text-[11px] text-gray-600 font-mono truncate flex-1">{cred.email}</span>
                      <Copy className="w-2.5 h-2.5 text-gray-300 flex-shrink-0" />
                    </div>
                    <div className="flex items-center gap-1.5 bg-white rounded-lg px-2.5 py-1.5 border border-gray-100">
                      <span className="text-[11px] text-gray-600 font-mono flex-1">Password123!</span>
                      <Copy className="w-2.5 h-2.5 text-gray-300 flex-shrink-0" />
                    </div>
                  </div>
                ))}
              </div>

              <Link
                href="/login"
                className="flex items-center justify-center gap-2 w-full bg-[#111] text-white text-[13px] font-semibold py-2.5 rounded-xl hover:bg-gray-900 transition-colors"
              >
                Sign in to explore <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          TECH BADGES
      ══════════════════════════════════════════ */}
      <div className="bg-white border-b border-gray-100 py-5 px-6">
        <div className="max-w-5xl mx-auto flex flex-wrap gap-2 justify-center">
          {TECHS.map((tech) => (
            <span
              key={tech}
              className="px-3.5 py-1 rounded-full text-xs border border-gray-200 bg-gray-50 text-gray-500 font-medium"
            >
              {tech}
            </span>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════
          FEATURES
      ══════════════════════════════════════════ */}
      <section id="features" className="bg-white px-6 py-24">
        <div className="max-w-6xl mx-auto">
          <div className="mb-14 max-w-xl">
            <p className="text-xs font-bold text-green-700 tracking-widest uppercase mb-3">Features</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3 text-[#111]">
              Production from day one
            </h2>
            <p className="text-gray-500 leading-relaxed">
              Every architectural decision made for real-world deployment, not toy demos.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f) => (
              <div
                key={f.title}
                className="group p-6 rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-sm bg-white transition-all duration-200 cursor-default"
              >
                <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center mb-4">
                  <f.icon className="w-5 h-5 text-green-700" />
                </div>
                <h3 className="font-semibold text-[#111] mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          PRICING
      ══════════════════════════════════════════ */}
      <section id="pricing" className="bg-[#f7f6f3] px-6 py-24">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-bold text-green-700 tracking-widest uppercase mb-3">Pricing</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3 text-[#111]">
              Simple, transparent pricing
            </h2>
            <p className="text-gray-500">Start free. Scale when you need it.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl border p-7 flex flex-col bg-white transition-shadow ${
                  plan.highlighted
                    ? "border-green-200 shadow-lg shadow-green-500/8"
                    : "border-gray-100 hover:shadow-sm"
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-green-700 text-white text-xs font-semibold px-3 py-1 rounded-full">
                      {plan.badge}
                    </span>
                  </div>
                )}
                <div className="mb-6">
                  <p className="text-sm text-gray-400 font-medium mb-1">{plan.name}</p>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-4xl font-bold text-[#111]">{plan.price}</span>
                    {plan.per && <span className="text-gray-400 text-sm">{plan.per}</span>}
                  </div>
                  <p className="text-sm text-gray-400">{plan.description}</p>
                </div>

                <ul className="space-y-2.5 mb-8 flex-1">
                  {plan.features.map((feat) => (
                    <li key={feat} className="flex items-start gap-2 text-sm text-gray-600">
                      <span className="w-4 h-4 rounded-full bg-green-50 text-green-700 flex items-center justify-center flex-shrink-0 mt-0.5 text-[10px] font-bold">
                        ✓
                      </span>
                      {feat}
                    </li>
                  ))}
                </ul>

                <Link
                  href="/register"
                  className={`block text-center text-sm font-semibold py-2.5 rounded-xl transition-colors ${
                    plan.highlighted
                      ? "bg-green-700 text-white hover:bg-green-800"
                      : "border border-gray-200 text-[#111] hover:bg-gray-50"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          CTA
      ══════════════════════════════════════════ */}
      <section className="bg-[#111] text-white px-6 py-24 text-center">
        <div className="max-w-xl mx-auto">
          <p className="text-xs font-bold text-green-500 tracking-widest uppercase mb-5">Ready to ship?</p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Your AI product,<br />production-ready today.
          </h2>
          <p className="text-gray-400 mb-10 leading-relaxed">
            Clone, configure, deploy. Full SaaS infrastructure in minutes, not months.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 bg-white text-[#111] font-semibold px-8 py-3 rounded-full hover:bg-gray-100 transition-colors text-sm"
            >
              Create free account <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="https://github.com/vkxr/ai-saas"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 border border-white/15 text-white font-semibold px-8 py-3 rounded-full hover:bg-white/8 transition-colors text-sm"
            >
              View source
            </a>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════ */}
      <footer className="bg-[#111] border-t border-white/6 py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-green-700 flex items-center justify-center">
              <Zap className="w-3 h-3 text-white" />
            </div>
            <span className="text-gray-400 font-medium">NexusAI</span>
            <span className="text-gray-700">© 2025</span>
          </div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-gray-300 transition-colors">Privacy</a>
            <a href="#" className="hover:text-gray-300 transition-colors">Terms</a>
            <a
              href="https://github.com/vkxr/ai-saas"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-300 transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
