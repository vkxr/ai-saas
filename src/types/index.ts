export type UserRole = "ADMIN" | "USER";
export type MemberRole = "OWNER" | "ADMIN" | "MEMBER";
export type PlanTier = "FREE" | "PRO" | "ENTERPRISE";
export type SubscriptionStatus =
  | "ACTIVE"
  | "CANCELED"
  | "PAST_DUE"
  | "TRIALING"
  | "INCOMPLETE"
  | "PAUSED";

export interface JWTPayload {
  sub: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  role: UserRole;
  emailVerified: boolean;
}

export interface WorkspaceWithMeta {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
  memberCount: number;
  currentUserRole: MemberRole;
  subscription: SubscriptionMeta | null;
}

export interface SubscriptionMeta {
  tier: PlanTier;
  status: SubscriptionStatus;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
}

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

export interface AIUsageSummary {
  totalTokens: number;
  totalCalls: number;
  totalCost: number;
  quotaTokens: number;
  quotaPercent: number;
}

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
