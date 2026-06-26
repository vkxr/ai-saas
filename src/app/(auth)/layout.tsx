import Link from "next/link";
import { Zap } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f7f6f3] flex flex-col">
      {/* Logo */}
      <div className="px-8 pt-8">
        <Link href="/" className="inline-flex items-center gap-2 text-[#111] hover:opacity-70 transition-opacity">
          <div className="w-7 h-7 rounded-lg bg-green-700 flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-semibold text-sm">NexusAI</span>
        </Link>
      </div>

      {/* Center content */}
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
