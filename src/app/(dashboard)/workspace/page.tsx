"use client";

import { useEffect, useState } from "react";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { useAuthStore } from "@/stores/auth-store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/use-toast";
import { getInitials } from "@/lib/utils";
import { UserPlus, Trash2, Crown, Shield, User, Users } from "lucide-react";
import type { MemberRole } from "@/types";

interface Member {
  id: string;
  role: MemberRole;
  joinedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
  };
}

const ROLE_ICONS: Record<MemberRole, typeof Crown> = {
  OWNER: Crown,
  ADMIN: Shield,
  MEMBER: User,
};

const ROLE_COLORS: Record<MemberRole, string> = {
  OWNER: "text-amber-500",
  ADMIN: "text-green-700",
  MEMBER: "text-gray-400",
};

export default function WorkspacePage() {
  const { currentWorkspace } = useWorkspaceStore();
  const { user } = useAuthStore();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);

  const currentUserMember = members.find((m) => m.user.id === user?.id);
  const canManage = currentUserMember?.role === "OWNER" || currentUserMember?.role === "ADMIN";

  useEffect(() => {
    if (!currentWorkspace) return;
    setLoading(true);
    fetch(`/api/workspace/${currentWorkspace.id}/members`)
      .then((r) => r.json())
      .then((j) => { setMembers(j.data ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [currentWorkspace?.id]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !currentWorkspace) return;
    setInviting(true);

    try {
      const res = await fetch(`/api/workspace/${currentWorkspace.id}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim(), role: "MEMBER" }),
      });
      const json = await res.json();

      if (!res.ok) {
        toast({ variant: "destructive", title: "Failed to invite", description: json.error });
        return;
      }

      setMembers((prev) => [...prev, json.data]);
      setInviteEmail("");
      toast({ title: "Member added!", description: `${inviteEmail} joined the workspace.` });
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Please try again." });
    } finally {
      setInviting(false);
    }
  };

  const handleRemove = async (targetUserId: string, memberName: string) => {
    if (!currentWorkspace) return;
    if (!confirm(`Remove ${memberName} from the workspace?`)) return;

    try {
      const res = await fetch(
        `/api/workspace/${currentWorkspace.id}/members?userId=${targetUserId}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const json = await res.json();
        toast({ variant: "destructive", title: "Error", description: json.error });
        return;
      }
      setMembers((prev) => prev.filter((m) => m.user.id !== targetUserId));
      toast({ title: "Member removed" });
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Please try again." });
    }
  };

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#111] mb-1">Workspace</h1>
        <p className="text-gray-400 text-sm">{currentWorkspace?.name}</p>
      </div>

      <div className="grid gap-6">
        {/* Members */}
        <Card className="border-gray-100 bg-white">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-[#111] flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-400" />
                  Team Members
                </CardTitle>
                <CardDescription className="text-gray-400">
                  {members.length} member{members.length !== 1 ? "s" : ""} in this workspace
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            {loading ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3">
                  <Skeleton className="w-9 h-9 rounded-full bg-gray-100" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3.5 w-32 bg-gray-100" />
                    <Skeleton className="h-3 w-48 bg-gray-100" />
                  </div>
                </div>
              ))
            ) : (
              members.map((member) => {
                const RoleIcon = ROLE_ICONS[member.role];
                const isCurrentUser = member.user.id === user?.id;
                const canRemove = canManage && !isCurrentUser && member.role !== "OWNER";

                return (
                  <div
                    key={member.id}
                    className="flex items-center gap-3 rounded-xl p-3 hover:bg-gray-50 transition-colors"
                  >
                    <Avatar className="w-9 h-9">
                      <AvatarFallback className="text-xs bg-gray-100 text-gray-500">
                        {getInitials(member.user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-[#111] truncate">
                          {member.user.name}
                          {isCurrentUser && (
                            <span className="text-gray-400 font-normal"> (you)</span>
                          )}
                        </p>
                      </div>
                      <p className="text-xs text-gray-400 truncate">{member.user.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`flex items-center gap-1 text-xs ${ROLE_COLORS[member.role]}`}>
                        <RoleIcon className="w-3 h-3" />
                        {member.role.charAt(0) + member.role.slice(1).toLowerCase()}
                      </div>
                      {canRemove && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-gray-300 hover:text-red-500 hover:bg-red-50"
                          onClick={() => handleRemove(member.user.id, member.user.name)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Invite */}
        {canManage && (
          <Card className="border-gray-100 bg-white">
            <CardHeader>
              <CardTitle className="text-[#111] text-base flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-gray-400" />
                Invite Member
              </CardTitle>
              <CardDescription className="text-gray-400">
                Invite existing NexusAI users by email address
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleInvite} className="flex gap-3">
                <div className="flex-1">
                  <Label htmlFor="invite-email" className="sr-only">Email</Label>
                  <Input
                    id="invite-email"
                    type="email"
                    placeholder="colleague@company.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="bg-white border-gray-200 text-[#111] placeholder:text-gray-400 focus-visible:ring-green-600"
                  />
                </div>
                <Button
                  type="submit"
                  loading={inviting}
                  disabled={!inviteEmail.trim()}
                  className="bg-green-700 hover:bg-green-800 text-white"
                >
                  <UserPlus className="w-4 h-4" />
                  Invite
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Workspace Info */}
        <Card className="border-gray-100 bg-white">
          <CardHeader>
            <CardTitle className="text-[#111] text-base">Workspace Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-0">
            {[
              { label: "Workspace name", value: currentWorkspace?.name },
              { label: "Slug", value: currentWorkspace?.slug, mono: true },
              { label: "Your role", value: currentUserMember?.role ?? "—" },
              {
                label: "Plan",
                value: (
                  <Badge variant={(currentWorkspace?.subscription?.tier?.toLowerCase() ?? "free") as "free" | "pro" | "enterprise"}>
                    {currentWorkspace?.subscription?.tier ?? "FREE"}
                  </Badge>
                ),
              },
            ].map((item) => (
              <div key={item.label} className="flex justify-between items-center py-3 border-b border-gray-100 last:border-0">
                <span className="text-sm text-gray-400">{item.label}</span>
                {typeof item.value === "string" ? (
                  <span className={`text-sm text-[#111] ${item.mono ? "font-mono text-xs bg-gray-50 border border-gray-100 px-2 py-0.5 rounded" : ""}`}>
                    {item.value}
                  </span>
                ) : (
                  item.value
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
