"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/stores/auth-store";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { toast } from "@/components/ui/use-toast";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Minimum 8 characters")
    .regex(/[A-Z]/, "Must contain an uppercase letter")
    .regex(/[0-9]/, "Must contain a number"),
  workspaceName: z.string().min(2, "Workspace name required").optional(),
});

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const { setUser, setAccessToken } = useAuthStore();
  const { setCurrentWorkspace } = useWorkspaceStore();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const password = watch("password", "");
  const strength = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^a-zA-Z0-9]/.test(password),
  ].filter(Boolean).length;

  const onSubmit = async (data: FormData) => {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await res.json();

      if (!res.ok) {
        toast({ variant: "destructive", title: "Registration failed", description: json.error });
        return;
      }

      setUser(json.data.user);
      setAccessToken(json.data.accessToken);
      if (json.data.workspace) setCurrentWorkspace(json.data.workspace);

      toast({ title: "Welcome to NexusAI!", description: "Your account is ready." });
      window.location.href = "/dashboard";
    } catch {
      toast({ variant: "destructive", title: "Network error", description: "Please try again." });
    }
  };

  const strengthColors = ["bg-red-500", "bg-orange-400", "bg-yellow-400", "bg-green-500"];
  const strengthLabels = ["Weak", "Fair", "Good", "Strong"];

  return (
    <div>
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-[#111] mb-2">Create your account</h1>
        <p className="text-sm text-gray-500">Start building with AI in minutes</p>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-gray-700 text-sm">Full name</Label>
            <Input
              id="name"
              placeholder="Alex Johnson"
              autoComplete="name"
              className="bg-white border-gray-200 text-[#111] placeholder:text-gray-400 focus-visible:ring-green-600"
              {...register("name")}
            />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-gray-700 text-sm">Work email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@company.com"
              autoComplete="email"
              className="bg-white border-gray-200 text-[#111] placeholder:text-gray-400 focus-visible:ring-green-600"
              {...register("email")}
            />
            {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-gray-700 text-sm">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                autoComplete="new-password"
                className="bg-white border-gray-200 text-[#111] placeholder:text-gray-400 focus-visible:ring-green-600 pr-10"
                {...register("password")}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {password.length > 0 && (
              <div className="space-y-1">
                <div className="flex gap-1">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-colors ${
                        i < strength ? strengthColors[strength - 1] ?? "bg-gray-200" : "bg-gray-200"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-gray-500">{strengthLabels[strength - 1] ?? "Enter password"}</p>
              </div>
            )}
            {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="workspaceName" className="text-gray-700 text-sm">
              Workspace name <span className="text-gray-400">(optional)</span>
            </Label>
            <Input
              id="workspaceName"
              placeholder="Acme Corp"
              className="bg-white border-gray-200 text-[#111] placeholder:text-gray-400 focus-visible:ring-green-600"
              {...register("workspaceName")}
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-green-700 hover:bg-green-800 text-white"
            loading={isSubmitting}
          >
            <UserPlus className="w-4 h-4" />
            Create account
          </Button>

          <p className="text-xs text-center text-gray-400">
            By signing up you agree to our Terms and Privacy Policy
          </p>
        </form>
      </div>

      <p className="text-center text-sm text-gray-500 mt-6">
        Already have an account?{" "}
        <Link href="/login" className="text-green-700 hover:text-green-800 font-medium transition-colors">
          Sign in
        </Link>
      </p>
    </div>
  );
}
