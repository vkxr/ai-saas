"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Cpu,
  Users,
  CreditCard,
  Settings,
  Zap,
  LogOut,
  ChevronDown,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/ai", label: "AI Chat", icon: Cpu },
  { href: "/workspace", label: "Workspace", icon: Users },
  { href: "/billing", label: "Billing", icon: CreditCard },
  { href: "/settings", label: "Settings", icon: Settings },
];

const TIER_BADGE = {
  FREE: { label: "Free", variant: "free" as const },
  PRO: { label: "Pro", variant: "pro" as const },
  ENTERPRISE: { label: "Enterprise", variant: "enterprise" as const },
};

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { currentWorkspace, workspaces, setCurrentWorkspace } = useWorkspaceStore();

  const tier = (currentWorkspace?.subscription?.tier ?? "FREE") as keyof typeof TIER_BADGE;
  const tierBadge = TIER_BADGE[tier];

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      logout();
      router.push("/login");
    }
  };

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <aside className="flex h-screen w-60 flex-col border-r border-white/8 bg-[#0a0a14] overflow-hidden">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-white/5">
        <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center flex-shrink-0">
          <Zap className="w-3.5 h-3.5 text-white" />
        </div>
        <span className="font-semibold text-white text-sm">NexusAI</span>
      </div>

      {/* Workspace Switcher */}
      <div className="px-3 pt-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm hover:bg-white/5 transition-colors group">
              <div className="w-7 h-7 rounded-md bg-violet-600/20 border border-violet-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-xs text-violet-400 font-bold">
                  {currentWorkspace?.name?.slice(0, 1).toUpperCase() ?? "W"}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-medium truncate">
                  {currentWorkspace?.name ?? "Select workspace"}
                </p>
                <p className="text-zinc-500 text-[11px]">{currentWorkspace?.currentUserRole ?? ""}</p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="start">
            <DropdownMenuLabel className="text-xs text-zinc-500">Workspaces</DropdownMenuLabel>
            {workspaces.map((ws) => (
              <DropdownMenuItem
                key={ws.id}
                onClick={() => setCurrentWorkspace(ws)}
                className={cn(currentWorkspace?.id === ws.id && "bg-accent")}
              >
                <div className="w-5 h-5 rounded bg-violet-600/20 flex items-center justify-center text-xs text-violet-400 font-bold mr-2">
                  {ws.name.slice(0, 1).toUpperCase()}
                </div>
                <span className="truncate">{ws.name}</span>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/workspace/new">
                <Plus className="w-4 h-4" />
                New workspace
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5">
        {navItems.map((item) => {
          const active = isActive(item.href, item.exact);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-all duration-150",
                active
                  ? "bg-violet-600/15 text-violet-300 border border-violet-500/20"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
              )}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Plan Badge */}
      <div className="px-4 py-2">
        <div className="rounded-lg border border-white/5 bg-white/2 p-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-zinc-500">Current plan</span>
            <Badge variant={tierBadge.variant} className="text-[10px] px-1.5 py-0">
              {tierBadge.label}
            </Badge>
          </div>
          {tier === "FREE" && (
            <Link
              href="/billing"
              className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
            >
              Upgrade to Pro →
            </Link>
          )}
        </div>
      </div>

      {/* User */}
      <div className="border-t border-white/5 p-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-full flex items-center gap-2.5 rounded-lg px-2 py-2 hover:bg-white/5 transition-colors">
              <Avatar className="w-7 h-7">
                <AvatarImage src={user?.avatarUrl ?? undefined} />
                <AvatarFallback className="text-[11px]">{getInitials(user?.name ?? "U")}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-xs text-white font-medium truncate">{user?.name}</p>
                <p className="text-[11px] text-zinc-500 truncate">{user?.email}</p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-48" align="end" side="top">
            <DropdownMenuLabel className="font-normal">
              <p className="text-sm font-medium">{user?.name}</p>
              <p className="text-xs text-zinc-400 truncate">{user?.email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings"><Settings className="w-4 h-4" />Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-400 focus:text-red-400 focus:bg-red-400/10"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
