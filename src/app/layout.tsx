import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/shared/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "NexusAI — AI-Native SaaS Platform",
    template: "%s | NexusAI",
  },
  description:
    "Production-grade AI platform with team workspaces, usage quotas, and Stripe billing.",
  keywords: ["AI", "SaaS", "Claude", "Anthropic", "team", "workspace"],
  authors: [{ name: "NexusAI" }],
  openGraph: {
    title: "NexusAI — AI-Native SaaS Platform",
    description: "Production-grade AI platform with team workspaces and smart billing",
    type: "website",
    locale: "en_US",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans min-h-screen`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
