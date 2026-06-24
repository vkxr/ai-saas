"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuthStore } from "@/stores/auth-store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/use-toast";
import { getInitials } from "@/lib/utils";
import { User, Bell, Lock, Trash2 } from "lucide-react";

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
});

type ProfileData = z.infer<typeof profileSchema>;

export default function SettingsPage() {
  const { user, setUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState<"profile" | "notifications" | "security">("profile");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileData>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name ?? "" },
  });

  const onSaveProfile = async (data: ProfileData) => {
    try {
      const res = await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();

      if (!res.ok) {
        toast({ variant: "destructive", title: "Error", description: json.error });
        return;
      }

      setUser(json.data);
      toast({ title: "Profile updated" });
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Please try again." });
    }
  };

  const tabs = [
    { id: "profile" as const, label: "Profile", icon: User },
    { id: "notifications" as const, label: "Notifications", icon: Bell },
    { id: "security" as const, label: "Security", icon: Lock },
  ];

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Settings</h1>
        <p className="text-zinc-400 text-sm">Manage your account preferences</p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar tabs */}
        <div className="w-44 flex-shrink-0 space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-left transition-all ${
                activeTab === tab.id
                  ? "bg-violet-600/15 text-violet-300 border border-violet-500/20"
                  : "text-zinc-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {activeTab === "profile" && (
            <Card className="border-white/8 bg-white/2">
              <CardHeader>
                <CardTitle className="text-white">Profile Information</CardTitle>
                <CardDescription>Update your personal details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Avatar */}
                <div className="flex items-center gap-4">
                  <Avatar className="w-16 h-16">
                    <AvatarFallback className="text-lg bg-violet-600/20 text-violet-400">
                      {getInitials(user?.name ?? "U")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium text-white">{user?.name}</p>
                    <p className="text-xs text-zinc-500">{user?.email}</p>
                  </div>
                </div>

                <Separator className="bg-white/5" />

                <form onSubmit={handleSubmit(onSaveProfile)} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-zinc-300">Full name</Label>
                    <Input
                      className="bg-white/4 border-white/10 text-white focus-visible:ring-violet-500"
                      {...register("name")}
                    />
                    {errors.name && <p className="text-xs text-red-400">{errors.name.message}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-zinc-300">Email address</Label>
                    <Input
                      value={user?.email ?? ""}
                      disabled
                      className="bg-white/2 border-white/5 text-zinc-500"
                    />
                    <p className="text-xs text-zinc-500">Email cannot be changed</p>
                  </div>

                  <Button
                    type="submit"
                    loading={isSubmitting}
                    disabled={!isDirty}
                    className="bg-violet-600 hover:bg-violet-700"
                  >
                    Save changes
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {activeTab === "notifications" && (
            <Card className="border-white/8 bg-white/2">
              <CardHeader>
                <CardTitle className="text-white">Notifications</CardTitle>
                <CardDescription>Configure when we contact you</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: "Usage quota warnings", desc: "When you reach 80% of monthly quota" },
                  { label: "Billing updates", desc: "Invoices, renewals, and payment issues" },
                  { label: "Team activity", desc: "New members and permission changes" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                    <div>
                      <p className="text-sm text-white">{item.label}</p>
                      <p className="text-xs text-zinc-500">{item.desc}</p>
                    </div>
                    <div className="w-10 h-5 rounded-full bg-violet-600 cursor-pointer relative">
                      <div className="absolute right-0.5 top-0.5 w-4 h-4 rounded-full bg-white shadow" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {activeTab === "security" && (
            <Card className="border-white/8 bg-white/2">
              <CardHeader>
                <CardTitle className="text-white">Security</CardTitle>
                <CardDescription>Manage your account security</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <p className="text-sm font-medium text-white mb-1">Active sessions</p>
                  <p className="text-xs text-zinc-500 mb-3">JWT refresh tokens are rotated on each use and expire after 7 days.</p>
                  <div className="rounded-lg border border-white/5 bg-white/2 p-3 text-xs font-mono text-zinc-400">
                    Session · Expires in 7 days · {navigator?.userAgent?.slice(0, 40) ?? "Unknown browser"}
                  </div>
                </div>

                <Separator className="bg-white/5" />

                <div>
                  <p className="text-sm font-medium text-red-400 mb-1 flex items-center gap-2">
                    <Trash2 className="w-3.5 h-3.5" />
                    Danger zone
                  </p>
                  <p className="text-xs text-zinc-500 mb-3">
                    Delete your account permanently. This action cannot be undone.
                  </p>
                  <Button variant="destructive" size="sm">
                    Delete account
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
