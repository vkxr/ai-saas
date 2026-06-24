# NexusAI — Production-Grade AI SaaS Platform

> A full-stack, multi-tenant AI SaaS application built with Next.js 15, featuring subscription billing, team workspaces, token-based quotas, and real-time AI streaming. Production-ready from day one.

---

## Table of Contents

1. [What Is NexusAI?](#what-is-nexusai)
2. [Live Demo & Credentials](#live-demo--credentials)
3. [Tech Stack](#tech-stack)
4. [High-Level Architecture](#high-level-architecture)
5. [Project Structure](#project-structure)
6. [Database Schema](#database-schema)
7. [Authentication & JWT Flow](#authentication--jwt-flow)
8. [AI Chat Flow](#ai-chat-flow)
9. [Subscription & Billing Flow](#subscription--billing-flow)
10. [Rate Limiting](#rate-limiting)
11. [Role-Based Access Control](#role-based-access-control)
12. [API Reference](#api-reference)
13. [Environment Variables](#environment-variables)
14. [Local Development Setup](#local-development-setup)
15. [Plan Tiers & Quotas](#plan-tiers--quotas)
16. [Security Architecture](#security-architecture)
17. [Deployment](#deployment)

---

## What Is NexusAI?

NexusAI is a **production-ready SaaS boilerplate** that combines:

- **Multi-tenant workspaces** — each team gets isolated data, members, and billing
- **AI chat interface** — powered by OpenRouter (Claude, GPT-4o, Gemini) with real-time streaming
- **Subscription billing** — Razorpay recurring subscriptions with HMAC-verified webhooks
- **Token-based quotas** — per-workspace monthly token limits enforced at the API layer
- **Role-based access control** — OWNER / ADMIN / MEMBER with fine-grained permissions
- **JWT refresh rotation** — short-lived access tokens with server-side revocation

It is designed to be the starting point for any B2B AI product: clone it, configure your keys, and ship.

---

## Live Demo & Credentials

```
URL:      http://localhost:3000
Email:    demo@nexusai.com
Password: demo123456
```

> The landing page at `/` showcases all features, pricing tiers, and a live demo section.

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Framework** | Next.js 15.3 (App Router) | Full-stack React, SSR, API routes |
| **Language** | TypeScript 5.7 | End-to-end type safety |
| **Database** | PostgreSQL via Neon | Primary data store |
| **ORM** | Prisma 6.0 | Schema management, migrations, queries |
| **Auth** | Custom JWT (jsonwebtoken) | Access + refresh token pair |
| **Cache / Rate Limit** | Upstash Redis | Sliding-window rate limiting |
| **AI Models** | OpenRouter API | Claude 3, GPT-4o-mini, Gemini Flash |
| **Payments** | Razorpay | Recurring subscriptions, webhooks |
| **UI** | Tailwind CSS + Radix UI | Utility-first styling, accessible components |
| **Animations** | Framer Motion | Page transitions, micro-interactions |
| **Forms** | React Hook Form + Zod | Validation, error handling |
| **State** | Zustand 5 | Client-side auth + workspace state |
| **Icons** | Lucide React | Consistent icon set |
| **Theme** | next-themes | Dark / light mode |

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CLIENT (Browser)                           │
│                                                                     │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐ │
│   │  Landing /   │  │  Auth Pages  │  │     Dashboard Pages      │ │
│   │  Public      │  │  /login      │  │  /dashboard  /ai         │ │
│   │  Pages       │  │  /register   │  │  /workspace  /billing    │ │
│   └──────────────┘  └──────────────┘  └──────────────────────────┘ │
│                              │                        │             │
│            ┌─────────────────┼────────────────────────┘             │
│            │          Zustand Store                                 │
│            │    (auth-store + workspace-store)                      │
│            │    Persisted to localStorage                           │
└────────────┼────────────────────────────────────────────────────────┘
             │ HTTP / SSE
┌────────────▼────────────────────────────────────────────────────────┐
│                     NEXT.JS EDGE MIDDLEWARE                         │
│               (src/middleware.ts)                                   │
│                                                                     │
│  1. Reads JWT from httpOnly cookie or Authorization header          │
│  2. Verifies HS256 signature via Web Crypto API (Edge-compatible)   │
│  3. Injects x-user-id, x-user-email, x-user-role headers           │
│  4. Redirects unauthenticated requests → /login                     │
└────────────┬────────────────────────────────────────────────────────┘
             │
┌────────────▼────────────────────────────────────────────────────────┐
│                        API ROUTES (Next.js)                         │
│                                                                     │
│  /api/auth/*          /api/ai/chat          /api/workspace/*        │
│  /api/razorpay/*      /api/user             /api/health             │
│                                                                     │
└──────┬────────────────────┬────────────────────┬────────────────────┘
       │                    │                    │
┌──────▼──────┐   ┌─────────▼──────┐   ┌────────▼───────┐
│  PostgreSQL  │   │  Upstash Redis │   │  External APIs │
│   (Neon)    │   │  Rate Limiter  │   │                │
│             │   │                │   │  OpenRouter AI │
│  - Users    │   │  Sliding-window│   │  Razorpay Pay  │
│  - Workspce │   │  per workspace │   │                │
│  - Tokens   │   │  per IP (auth) │   └────────────────┘
│  - Billing  │   └────────────────┘
└─────────────┘
```

---

## Project Structure

```
ai-saas/
├── src/
│   ├── app/
│   │   ├── page.tsx                    # Public landing page
│   │   ├── layout.tsx                  # Root layout (fonts, theme provider)
│   │   │
│   │   ├── (auth)/                     # Auth route group (no sidebar)
│   │   │   ├── layout.tsx              # Centered card layout
│   │   │   ├── login/page.tsx          # Login form
│   │   │   └── register/page.tsx       # Registration form
│   │   │
│   │   ├── (dashboard)/                # Protected route group
│   │   │   ├── layout.tsx              # Sidebar + top bar layout
│   │   │   ├── dashboard/page.tsx      # Usage stats, quota bars
│   │   │   ├── ai/page.tsx             # AI chat interface + model picker
│   │   │   ├── workspace/page.tsx      # Members list, invite form
│   │   │   ├── billing/page.tsx        # Plan cards, upgrade flow
│   │   │   └── settings/page.tsx       # User preferences
│   │   │
│   │   └── api/
│   │       ├── auth/
│   │       │   ├── register/route.ts   # POST: create user + workspace
│   │       │   ├── login/route.ts      # POST: issue token pair
│   │       │   ├── logout/route.ts     # POST: revoke refresh token
│   │       │   ├── refresh/route.ts    # POST: rotate token pair
│   │       │   └── me/route.ts         # GET: current user info
│   │       ├── ai/
│   │       │   └── chat/route.ts       # POST: AI completion + quota check
│   │       ├── workspace/
│   │       │   ├── route.ts            # GET list | POST create
│   │       │   └── [workspaceId]/
│   │       │       ├── route.ts        # GET | PATCH | DELETE
│   │       │       └── members/route.ts # GET | POST | PATCH | DELETE
│   │       ├── razorpay/
│   │       │   ├── create-subscription/route.ts
│   │       │   ├── webhook/route.ts    # HMAC-verified event handler
│   │       │   └── cancel/route.ts
│   │       ├── stripe/                 # Placeholder (future)
│   │       ├── user/route.ts           # GET | PATCH profile
│   │       └── health/route.ts         # GET: liveness probe
│   │
│   ├── components/
│   │   ├── dashboard/
│   │   │   └── sidebar.tsx             # Nav, workspace switcher, plan badge
│   │   ├── ui/                         # Shadcn-style Radix components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── progress.tsx
│   │   │   └── ... (avatar, dropdown, skeleton, toast…)
│   │   └── shared/
│   │       └── theme-provider.tsx      # Dark mode context
│   │
│   ├── lib/
│   │   ├── auth/jwt.ts                 # Token creation, rotation, revocation
│   │   ├── ai/quota.ts                 # Monthly usage aggregation + cost calc
│   │   ├── db/prisma.ts                # Prisma singleton
│   │   ├── razorpay/
│   │   │   ├── client.ts               # SDK wrapper
│   │   │   └── plans.ts                # FREE / PRO / ENTERPRISE config
│   │   ├── redis/
│   │   │   ├── client.ts               # Upstash REST client
│   │   │   └── rate-limit.ts           # Sliding window helpers
│   │   ├── stripe/                     # Placeholder (future)
│   │   └── utils.ts                    # slugify, formatDate, cn()
│   │
│   ├── stores/
│   │   ├── auth-store.ts               # Zustand: user + tokens
│   │   └── workspace-store.ts          # Zustand: active workspace
│   │
│   ├── types/index.ts                  # Shared TypeScript interfaces
│   └── middleware.ts                   # Edge JWT verification
│
├── prisma/
│   ├── schema.prisma                   # All DB models + enums
│   └── seed.ts                         # Demo data seeder
│
├── public/                             # Static assets
├── docker/                             # Docker config (optional)
├── .env.example                        # Environment variable template
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.ts
```

---

## Database Schema

### Entity-Relationship Diagram

```
┌──────────────────────┐         ┌──────────────────────────┐
│         USER         │         │        WORKSPACE         │
│──────────────────────│         │──────────────────────────│
│ id           (PK)    │◄────────│ ownerId         (FK)     │
│ email        UNIQUE  │  owns   │ id              (PK)     │
│ name                 │  1 : N  │ name                     │
│ passwordHash         │         │ slug            UNIQUE   │
│ avatarUrl            │         │ description              │
│ role ADMIN|USER      │         │ logoUrl                  │
│ emailVerified        │         └──────────────────────────┘
│ createdAt            │                      │ 1
└──────────────────────┘                      │
         │ 1                    ┌─────────────┼──────────────────────┐
         │                      │             │                      │
         │ N              N : 1 │        1 : 1│                      │ N : 1
┌────────▼─────────────┐  ┌─────▼────────┐ ┌─▼────────────────────┐ ┌──▼────────────────┐
│   REFRESH_TOKEN      │  │  WORKSPACE   │ │    SUBSCRIPTION      │ │   AI_USAGE_RECORD │
│──────────────────────│  │   MEMBER     │ │──────────────────────│ │───────────────────│
│ id          (PK)     │  │─────────────-│ │ id           (PK)    │ │ id         (PK)   │
│ token       UNIQUE   │  │ id   (PK)    │ │ workspaceId  (FK,UQ) │ │ workspaceId (FK)  │
│ userId      (FK)     │  │ workspaceId  │ │ rzpCustomerId        │ │ model             │
│ expiresAt            │  │ userId  (FK) │ │ rzpSubscriptionId    │ │ inputTokens       │
│ revoked BOOL         │  │ role         │ │ rzpPlanId            │ │ outputTokens      │
│ userAgent            │  │  OWNER       │ │ tier FREE|PRO|ENT    │ │ totalTokens       │
│ ipAddress            │  │  ADMIN       │ │ status ACTIVE|…      │ │ cost (USD)        │
└──────────────────────┘  │  MEMBER      │ │ currentPeriodStart   │ │ endpoint          │
                          │ createdAt    │ │ currentPeriodEnd     │ │ createdAt         │
                          └──────────────┘ │ cancelAtPeriodEnd    │ └───────────────────┘
                                           │ trialEnd             │
                                           └──────────────────────┘

┌──────────────────────────┐    ┌──────────────────────────┐
│    WORKSPACE_INVITE      │    │  MONTHLY_USAGE_SUMMARY   │
│──────────────────────────│    │──────────────────────────│
│ id            (PK)       │    │ id            (PK)       │
│ workspaceId   (FK)       │    │ workspaceId   (FK)       │
│ email                    │    │ year                     │
│ role (default MEMBER)    │    │ month                    │
│ token         UNIQUE     │    │ totalTokens              │
│ status PENDING|ACCEPTED  │    │ totalCalls               │
│        |EXPIRED          │    │ totalCost (USD)          │
│ expiresAt                │    │ UNIQUE (workspace, yr, mo│
└──────────────────────────┘    └──────────────────────────┘

┌──────────────────────────┐
│         API_KEY          │
│──────────────────────────│
│ id            (PK)       │
│ name                     │
│ keyHash       UNIQUE     │
│ keyPrefix                │
│ workspaceId   (FK)       │
│ userId        (FK)       │
│ lastUsedAt               │
│ expiresAt                │
│ revoked BOOL             │
└──────────────────────────┘
```

### Enums

```
UserRole          → ADMIN | USER
MemberRole        → OWNER | ADMIN | MEMBER
PlanTier          → FREE | PRO | ENTERPRISE
SubscriptionStatus→ ACTIVE | CANCELED | PAST_DUE | TRIALING | INCOMPLETE | PAUSED
InviteStatus      → PENDING | ACCEPTED | EXPIRED
```

---

## Authentication & JWT Flow

### Registration Flow

```
Client                           API Server                        Database
  │                                  │                                │
  │── POST /api/auth/register ───────►│                                │
  │   { name, email, password,       │                                │
  │     workspaceName }              │                                │
  │                                  │── bcrypt.hash(password, 12) ──►│
  │                                  │                                │
  │                                  │── CREATE User ────────────────►│
  │                                  │── CREATE Workspace ───────────►│
  │                                  │── CREATE WorkspaceMember ─────►│
  │                                  │   (role: OWNER)                │
  │                                  │── CREATE Subscription ─────────►│
  │                                  │   (tier: FREE, status: ACTIVE) │
  │                                  │                                │
  │                                  │── signJWT(accessToken, 15m)    │
  │                                  │── signJWT(refreshToken, 7d)    │
  │                                  │── hash(refreshToken) → DB ────►│
  │                                  │                                │
  │◄─ 201 { user, workspace } ───────│                                │
  │   Set-Cookie: access_token (httpOnly, Secure)                     │
  │   Set-Cookie: refresh_token (httpOnly, Secure)                    │
```

### Login & Token Rotation Flow

```
┌───────────────────────────────────────────────────────────────────┐
│                        LOGIN FLOW                                 │
│                                                                   │
│  POST /api/auth/login                                             │
│  { email, password }                                              │
│                                                                   │
│  1. Find user by email                                            │
│  2. bcrypt.compare(password, hash)  ← constant-time              │
│  3. Generate new access token  (HS256, 15 min)                    │
│  4. Generate new refresh token (HS256, 7 days)                    │
│  5. Store hash(refreshToken) in RefreshToken table                │
│  6. Set httpOnly Secure cookies                                   │
│  7. Return { user, workspace }                                    │
└───────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────┐
│                    TOKEN ROTATION FLOW                            │
│                                                                   │
│  POST /api/auth/refresh                                           │
│                                                                   │
│  1. Read refresh_token cookie                                     │
│  2. Verify JWT signature + expiry                                 │
│  3. Look up hash(token) in DB                                     │
│  4. Check: revoked == false AND expiresAt > now                   │
│  5. REVOKE old refresh token in DB  (revoked = true)             │
│  6. Issue NEW access token (15 min)                               │
│  7. Issue NEW refresh token (7 days)                              │
│  8. Store new token hash in DB                                    │
│  9. Set new httpOnly cookies                                      │
│                                                                   │
│  ⚠ If token is revoked → 401 (possible token theft detected)      │
└───────────────────────────────────────────────────────────────────┘
```

### Middleware Protection Flow

```
Every Request
     │
     ▼
┌────────────────────────────────────────────────────────┐
│                  src/middleware.ts                      │
│              (Runs at Edge, no Node.js)                │
└────────────────────────────────────────────────────────┘
     │
     ▼
Is path public? (/, /login, /register, /api/auth/*)
     │
     ├── YES ──► Pass through
     │
     └── NO
          │
          ▼
     Read JWT from:
     1. Cookie: access_token
     2. Header: Authorization: Bearer <token>
          │
          ▼
     Verify HS256 via Web Crypto API (Edge-compatible)
          │
          ├── INVALID / EXPIRED ──► Redirect to /login (or 401 for API)
          │
          └── VALID
               │
               ▼
          Inject headers into request:
          x-user-id:    <userId>
          x-user-email: <email>
          x-user-role:  <role>
               │
               ▼
          Pass to API Route or Page
```

---

## AI Chat Flow

```
Client                    API Route                  External Services
  │                   /api/ai/chat                          │
  │                         │                              │
  │── POST { workspaceId,   │                              │
  │    messages[], model,   │                              │
  │    systemPrompt? } ────►│                              │
  │                         │                              │
  │                   ┌─────▼──────────────────────────┐   │
  │                   │  1. Zod Schema Validation       │   │
  │                   │     - messages: 1–50 items      │   │
  │                   │     - model: allowed list       │   │
  │                   └─────┬──────────────────────────┘   │
  │                         │                              │
  │                   ┌─────▼──────────────────────────┐   │
  │                   │  2. Workspace Membership Check  │   │
  │                   │     Verify user ∈ workspace     │   │
  │                   └─────┬──────────────────────────┘   │
  │                         │                              │
  │                   ┌─────▼──────────────────────────┐   │
  │                   │  3. Subscription Status Check   │   │
  │                   │     Must be ACTIVE or TRIALING  │   │
  │                   │     PAST_DUE / CANCELED → 402   │   │
  │                   └─────┬──────────────────────────┘   │
  │                         │                              │
  │                   ┌─────▼──────────────────────────┐   │
  │                   │  4. Model Tier Gate             │   │
  │                   │     FREE  → claude-3-haiku only │   │
  │                   │     PRO+  → all models          │   │
  │                   └─────┬──────────────────────────┘   │
  │                         │                              │
  │                   ┌─────▼──────────────────────────┐   │
  │                   │  5. Rate Limit (Upstash Redis)  │   │
  │                   │     Key: rl:ai:{tier}:{wkspId} │   │
  │                   │     FREE:       10 req/min      │   │
  │                   │     PRO:        60 req/min      │   │
  │                   │     ENTERPRISE: 300 req/min     │   │
  │                   └─────┬──────────────────────────┘   │
  │                         │                              │
  │                   ┌─────▼──────────────────────────┐   │
  │                   │  6. Monthly Token Quota Check   │   │
  │                   │     Aggregates MonthlyUsage     │   │
  │                   │     FREE:       100K tokens/mo  │   │
  │                   │     PRO:        2M tokens/mo    │   │
  │                   │     ENTERPRISE: 50M tokens/mo   │   │
  │                   └─────┬──────────────────────────┘   │
  │                         │                              │
  │                         │── OpenRouter API call ───────►│
  │                         │   (OpenAI-compatible SDK)    │
  │                         │   Streaming enabled          │
  │                         │                              │
  │◄─ SSE Stream ───────────│◄── Server-Sent Events ───────│
  │   data: { chunk }       │                              │
  │   data: [DONE]          │                              │
  │                         │                              │
  │                   ┌─────▼──────────────────────────┐   │
  │                   │  7. Usage Recording             │   │
  │                   │     CREATE AIUsageRecord        │   │
  │                   │     UPSERT MonthlyUsageSummary  │   │
  │                   │     Cost calc per model rates   │   │
  │                   └────────────────────────────────┘   │
```

### Available AI Models

| Model | ID | Tier Required | Use Case |
|---|---|---|---|
| Claude 3 Haiku | `anthropic/claude-3-haiku` | FREE | Fast, lightweight tasks |
| Claude 3.5 Sonnet | `anthropic/claude-3.5-sonnet` | PRO | Complex reasoning |
| GPT-4o Mini | `openai/gpt-4o-mini` | PRO | Balanced performance |
| Gemini Flash 1.5 | `google/gemini-flash-1.5` | PRO | Long context tasks |

---

## Subscription & Billing Flow

### Upgrade Flow (Client → Razorpay → Webhook)

```
┌──────────────────────────────────────────────────────────────────────┐
│  STEP 1 — Client clicks "Upgrade to PRO"                             │
│                                                                      │
│  POST /api/razorpay/create-subscription                              │
│  { workspaceId, planId, billingCycle: "monthly"|"yearly" }          │
└────────────────────────────────────┬─────────────────────────────────┘
                                     │
                                     ▼
┌──────────────────────────────────────────────────────────────────────┐
│  STEP 2 — Server creates Razorpay entities                           │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────┐        │
│  │  IF no rzpCustomerId:                                    │        │
│  │    razorpay.customers.create({ name, email })            │        │
│  │    Save rzpCustomerId → Subscription table               │        │
│  └──────────────────────────────────────────────────────────┘        │
│                                                                      │
│  razorpay.subscriptions.create({                                     │
│    plan_id: RAZORPAY_PLAN_PRO_MONTHLY,                               │
│    customer_id: rzpCustomerId,                                       │
│    total_count: 12,   // renew 12 times                              │
│  })                                                                  │
│                                                                      │
│  Returns: { subscriptionId, key_id }                                 │
└────────────────────────────────────┬─────────────────────────────────┘
                                     │
                                     ▼
┌──────────────────────────────────────────────────────────────────────┐
│  STEP 3 — Client opens Razorpay Checkout Modal                       │
│                                                                      │
│  new Razorpay({                                                       │
│    key: NEXT_PUBLIC_RAZORPAY_KEY_ID,                                  │
│    subscription_id: subscriptionId,                                   │
│    name: "NexusAI", amount, currency: "INR",                         │
│    handler: function(response) { /* payment success */ }             │
│  }).open()                                                            │
└────────────────────────────────────┬─────────────────────────────────┘
                                     │
                                     ▼
┌──────────────────────────────────────────────────────────────────────┐
│  STEP 4 — Razorpay fires webhook to /api/razorpay/webhook            │
│                                                                      │
│  Server verifies HMAC-SHA256 signature:                              │
│  crypto.timingSafeEqual(                                             │
│    computed_hmac,                                                    │
│    header["x-razorpay-signature"]                                    │
│  )                                                                   │
└────────────────────────────────────┬─────────────────────────────────┘
                                     │
                                     ▼
┌──────────────────────────────────────────────────────────────────────┐
│  STEP 5 — Event → DB Status Mapping                                  │
│                                                                      │
│  subscription.activated → tier = PRO,    status = ACTIVE             │
│  subscription.charged   → status = ACTIVE (renewal confirmed)        │
│  subscription.cancelled → tier = FREE,   status = CANCELED           │
│  payment.failed         → status = PAST_DUE                          │
│  subscription.paused    → status = PAUSED                            │
│                                                                      │
│  Also updates: currentPeriodStart, currentPeriodEnd                  │
└──────────────────────────────────────────────────────────────────────┘
```

### Plan Comparison

| Feature | FREE | PRO | ENTERPRISE |
|---|---|---|---|
| **Price** | ₹0 / month | ₹2,499 / month | ₹24,999 / month |
| **AI Requests** | 50 / month | 2,000 / month | 50,000 / month |
| **Token Quota** | 100K / month | 2M / month | 50M / month |
| **Workspaces** | 1 | 5 | Unlimited |
| **Team Members** | 1 | 10 | Unlimited |
| **Models** | Haiku only | All models | All models |
| **Rate Limit** | 10 req/min | 60 req/min | 300 req/min |
| **Support** | Community | Email | Dedicated SLA |

### Cancellation Flow

```
POST /api/razorpay/cancel
{ workspaceId, cancelImmediately: boolean }

If cancelImmediately = false:
  → Subscription continues until period end
  → Razorpay event "subscription.cancelled" fires at period end
  → Webhook downgrades tier to FREE

If cancelImmediately = true:
  → Cancel now via Razorpay API
  → DB: status = CANCELED, tier = FREE immediately
```

---

## Rate Limiting

Rate limiting uses **Upstash Redis** with a **sliding window algorithm**.

```
Request arrives
      │
      ▼
┌─────────────────────────────────────────────────────────┐
│             Sliding Window Rate Limiter                 │
│                                                         │
│  Key format:  rl:ai:{tier}:{workspaceId}                │
│  Auth format: rl:auth:{ipAddress}                       │
│                                                         │
│  Sliding window means requests from the past N seconds  │
│  are counted — no "reset at :00" burst exploitation     │
└──────────┬──────────────────────┬───────────────────────┘
           │                      │
      WITHIN LIMIT            EXCEEDED
           │                      │
           ▼                      ▼
      Continue             429 Too Many Requests
      to handler           { error, retryAfter }
```

### Limits by Context

| Context | Key | Limit | Window |
|---|---|---|---|
| Auth endpoints | `rl:auth:{ip}` | 5 requests | 1 minute |
| FREE workspace AI | `rl:ai:free:{wsId}` | 10 requests | 1 minute |
| PRO workspace AI | `rl:ai:pro:{wsId}` | 60 requests | 1 minute |
| ENTERPRISE AI | `rl:ai:ent:{wsId}` | 300 requests | 1 minute |
| Global fallback | `rl:global:{ip}` | 100 requests | 1 minute |

> **Fail-open design**: If Redis is unreachable, requests are allowed through to prevent user-facing outages. A connection error is logged but never surfaces as a 5xx to the user.

---

## Role-Based Access Control

### Permission Matrix

| Action | OWNER | ADMIN | MEMBER |
|---|---|---|---|
| Use AI chat | ✅ | ✅ | ✅ |
| View usage stats | ✅ | ✅ | ✅ |
| Invite new members | ✅ | ✅ | ❌ |
| Remove members | ✅ | ✅ (non-admin) | ❌ |
| Change member roles | ✅ | ❌ | ❌ |
| Update workspace info | ✅ | ✅ | ❌ |
| Manage billing / upgrade | ✅ | ❌ | ❌ |
| Delete workspace | ✅ | ❌ | ❌ |

### Workspace Membership Flow

```
Invite by email
      │
      ▼
POST /api/workspace/{id}/members
{ email, role }
      │
      ├── User exists in DB?
      │      │
      │      ├── NO → 404 (user must register first)
      │      │
      │      └── YES
      │             │
      │             ▼
      │         Already a member? → 409 Conflict
      │             │
      │             ▼
      │         CREATE WorkspaceMember
      │         (role = requested role, default MEMBER)
      │             │
      │             ▼
      │         200 { member }
      │
      └── Caller must be OWNER or ADMIN (checked server-side)
```

---

## API Reference

### Authentication

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | ❌ | Create account + workspace |
| POST | `/api/auth/login` | ❌ | Get token pair |
| POST | `/api/auth/logout` | ✅ | Revoke refresh token |
| POST | `/api/auth/refresh` | ✅ (cookie) | Rotate token pair |
| GET | `/api/auth/me` | ✅ | Current user + workspace |

### AI

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/ai/chat` | ✅ | Stream AI completion |

**Request body:**
```jsonc
{
  "workspaceId": "ws_abc123",
  "messages": [
    { "role": "user", "content": "Hello!" }
  ],
  "model": "anthropic/claude-3-haiku",   // optional
  "systemPrompt": "You are a helpful assistant."  // optional
}
```

**Response:** `text/event-stream` (Server-Sent Events)
```
data: {"chunk": "Hello"}
data: {"chunk": " there"}
data: [DONE]
```

### Workspace

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/workspace` | ✅ | List user's workspaces |
| POST | `/api/workspace` | ✅ | Create new workspace |
| GET | `/api/workspace/{id}` | ✅ | Workspace + stats |
| PATCH | `/api/workspace/{id}` | ✅ OWNER/ADMIN | Update name/description |
| DELETE | `/api/workspace/{id}` | ✅ OWNER | Delete workspace |
| GET | `/api/workspace/{id}/members` | ✅ | List members |
| POST | `/api/workspace/{id}/members` | ✅ OWNER/ADMIN | Invite member |
| PATCH | `/api/workspace/{id}/members` | ✅ OWNER | Change member role |
| DELETE | `/api/workspace/{id}/members?userId=` | ✅ OWNER/ADMIN | Remove member |

### Billing (Razorpay)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/razorpay/create-subscription` | ✅ | Create Razorpay subscription |
| POST | `/api/razorpay/webhook` | HMAC | Handle Razorpay events |
| POST | `/api/razorpay/cancel` | ✅ | Cancel subscription |

### User & Health

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/user` | ✅ | Get profile |
| PATCH | `/api/user` | ✅ | Update profile |
| GET | `/api/health` | ❌ | Liveness probe |

---

## Environment Variables

Create a `.env` file from `.env.example`:

```bash
cp .env.example .env
```

### Database

```env
DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"
```

### JWT Secrets (minimum 32 characters each)

```env
JWT_ACCESS_SECRET="your-super-secret-access-key-min-32-chars"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-min-32-chars"
JWT_ACCESS_EXPIRY="15m"
JWT_REFRESH_EXPIRY="7d"
```

### Upstash Redis

```env
UPSTASH_REDIS_REST_URL="https://xxx.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-upstash-token"
```

### OpenRouter (AI)

```env
OPENROUTER_API_KEY="sk-or-v1-..."
OPENROUTER_SITE_URL="https://your-app.com"
OPENROUTER_SITE_NAME="NexusAI"
```

### Razorpay (Payments)

```env
RAZORPAY_KEY_ID="rzp_live_..."
RAZORPAY_KEY_SECRET="your-key-secret"
RAZORPAY_WEBHOOK_SECRET="your-webhook-secret"
RAZORPAY_PLAN_PRO_MONTHLY="plan_xxx"
RAZORPAY_PLAN_PRO_YEARLY="plan_yyy"
RAZORPAY_PLAN_ENTERPRISE_MONTHLY="plan_zzz"
RAZORPAY_PLAN_ENTERPRISE_YEARLY="plan_www"
NEXT_PUBLIC_RAZORPAY_KEY_ID="rzp_live_..."
```

### App Config

```env
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="NexusAI"
NODE_ENV="development"
```

---

## Local Development Setup

### Prerequisites

- Node.js 20+
- PostgreSQL database (or [Neon](https://neon.tech) free tier)
- Upstash Redis account ([free tier](https://upstash.com))
- OpenRouter API key ([openrouter.ai](https://openrouter.ai))
- Razorpay account (test keys work for local dev)

### Step 1 — Clone and install

```bash
git clone <repo-url>
cd ai-saas
npm install
```

### Step 2 — Configure environment

```bash
cp .env.example .env
# Edit .env with your values
```

### Step 3 — Set up database

```bash
# Push schema to your PostgreSQL database
npx prisma db push

# Optional: seed demo data
npx prisma db seed

# View database in Prisma Studio
npx prisma studio
```

### Step 4 — Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Step 5 — Set up Razorpay webhook (local testing)

Use [ngrok](https://ngrok.com) to expose your local server:

```bash
ngrok http 3000
```

Set the webhook URL in your Razorpay Dashboard to:
```
https://<your-ngrok-id>.ngrok.io/api/razorpay/webhook
```

### Available Scripts

```bash
npm run dev          # Start dev server (http://localhost:3000)
npm run build        # Production build
npm run start        # Start production server
npm run lint         # ESLint check
npx prisma studio    # GUI for database
npx prisma migrate dev  # Create and apply migration
npx prisma db push   # Push schema without migration history
```

---

## Security Architecture

### Password Security

```
Registration:
  plaintext → bcrypt.hash(password, 12 rounds) → stored hash
              ↑
              12 rounds = ~250ms hash time (brute-force resistant)

Login:
  bcrypt.compare(input, storedHash)
  ↑
  Constant-time comparison (no timing attacks)
```

### Token Security

```
Access Token (JWT, HS256):
  - 15-minute expiry (minimal exposure window)
  - Stored in httpOnly, Secure, SameSite=Strict cookie
  - Never accessible to JavaScript

Refresh Token (JWT, HS256):
  - 7-day expiry
  - Hash stored in database (never raw)
  - Single-use: rotated on every use
  - Revocation: marked revoked in DB on logout or rotation
  - Replay detection: revoked token reuse → immediate 401
```

### Webhook Security

```
Razorpay → POST /api/razorpay/webhook
              │
              ▼
  x-razorpay-signature header
              │
              ▼
  computed = HMAC-SHA256(body, RAZORPAY_WEBHOOK_SECRET)
              │
              ▼
  crypto.timingSafeEqual(computed, received)
              │
              ├── MISMATCH → 400 (reject, log)
              └── MATCH → process event
```

### Input Validation

All API endpoints use **Zod** schema validation at the boundary:

```typescript
const chatSchema = z.object({
  workspaceId: z.string().min(1),
  messages:    z.array(messageSchema).min(1).max(50),
  model:       z.enum(ALLOWED_MODELS).optional(),
  systemPrompt: z.string().max(2000).optional(),
})
```

Validation errors return structured `422` responses — never raw Prisma or database errors.

### Multi-Tenant Data Isolation

Every database query for workspace-scoped resources includes an explicit `workspaceId` filter **and** a membership check:

```typescript
// Pattern used in every protected route:
const membership = await prisma.workspaceMember.findFirst({
  where: { workspaceId, userId: req.userId }
})
if (!membership) return 403
```

This ensures users can never access data from workspaces they don't belong to, even if they guess a workspace ID.

---

## Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

Set all environment variables in the Vercel dashboard under **Settings → Environment Variables**.

### Required services for production

| Service | Purpose | Free tier |
|---|---|---|
| [Neon](https://neon.tech) | PostgreSQL | ✅ 0.5 GB |
| [Upstash](https://upstash.com) | Redis | ✅ 10K commands/day |
| [OpenRouter](https://openrouter.ai) | AI models | Pay per token |
| [Razorpay](https://razorpay.com) | Payments | ✅ Test mode free |
| [Vercel](https://vercel.com) | Hosting | ✅ Hobby plan |

### Post-deployment checklist

- [ ] All environment variables set in hosting platform
- [ ] `npx prisma db push` run against production DB
- [ ] Razorpay webhook URL updated to production domain
- [ ] Razorpay webhook secret matches `RAZORPAY_WEBHOOK_SECRET`
- [ ] `NEXT_PUBLIC_APP_URL` set to production domain
- [ ] `NODE_ENV=production`
- [ ] Test registration → login → AI chat → billing upgrade end-to-end

---

## Extending the Project

### Adding a new AI model

1. Add the model ID to `ALLOWED_MODELS` in `src/app/api/ai/chat/route.ts`
2. Add pricing in `src/lib/ai/quota.ts`
3. If it requires a higher tier, add the gating check to the model tier logic

### Adding a new plan tier

1. Add to `PlanTier` enum in `prisma/schema.prisma`
2. Run `npx prisma db push`
3. Add plan config in `src/lib/razorpay/plans.ts`
4. Create plan in Razorpay Dashboard, add plan ID to `.env`
5. Update rate limits in `src/lib/redis/rate-limit.ts`
6. Update token quotas in `src/lib/ai/quota.ts`

### Enabling Stripe (placeholder routes exist)

1. Complete `src/app/api/stripe/checkout/route.ts`
2. Complete `src/app/api/stripe/webhook/route.ts`
3. Add Stripe environment variables
4. Uncomment Stripe billing UI in `/billing` page

---

*Built with Next.js 15, Prisma, Upstash Redis, OpenRouter, and Razorpay.*
