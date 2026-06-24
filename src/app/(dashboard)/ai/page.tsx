"use client";

import { useState, useRef, useEffect } from "react";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { Send, Cpu, User, Loader2, RotateCcw, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Model =
  | "anthropic/claude-3-haiku"
  | "anthropic/claude-3.5-sonnet"
  | "openai/gpt-4o-mini"
  | "google/gemini-flash-1.5";

const MODELS: {
  id: Model;
  label: string;
  provider: string;
  description: string;
  tier: string;
}[] = [
  {
    id: "anthropic/claude-3-haiku",
    label: "Claude 3 Haiku",
    provider: "Anthropic",
    description: "Fast & cost-efficient",
    tier: "All plans",
  },
  {
    id: "anthropic/claude-3.5-sonnet",
    label: "Claude 3.5 Sonnet",
    provider: "Anthropic",
    description: "Balanced intelligence",
    tier: "Pro+",
  },
  {
    id: "openai/gpt-4o-mini",
    label: "GPT-4o Mini",
    provider: "OpenAI",
    description: "Fast & smart",
    tier: "Pro+",
  },
  {
    id: "google/gemini-flash-1.5",
    label: "Gemini Flash 1.5",
    provider: "Google",
    description: "Multimodal speed",
    tier: "Pro+",
  },
];

const PROVIDER_COLORS: Record<string, string> = {
  Anthropic: "text-violet-400 bg-violet-500/10",
  OpenAI: "text-emerald-400 bg-emerald-500/10",
  Google: "text-blue-400 bg-blue-500/10",
};

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export default function AIPage() {
  const { currentWorkspace } = useWorkspaceStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [model, setModel] = useState<Model>("anthropic/claude-3-haiku");
  const [isStreaming, setIsStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isStreaming || !currentWorkspace) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: input.trim(),
    };

    const assistantId = crypto.randomUUID();
    const assistantMessage: Message = { id: assistantId, role: "assistant", content: "" };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setInput("");
    setIsStreaming(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId: currentWorkspace.id,
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          model,
          stream: true,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        setMessages((prev) => prev.slice(0, -1));
        toast({ variant: "destructive", title: "AI Error", description: err.error });
        setIsStreaming(false);
        return;
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          for (const line of chunk.split("\n")) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6);
            if (data === "[DONE]") break;
            try {
              const parsed = JSON.parse(data) as { text?: string };
              if (parsed.text) {
                fullText += parsed.text;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId ? { ...m, content: fullText } : m
                  )
                );
              }
            } catch { /* partial SSE chunk */ }
          }
        }
      }
    } catch {
      toast({ variant: "destructive", title: "Connection error", description: "Failed to reach AI endpoint." });
    } finally {
      setIsStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSend();
    }
  };

  const selectedModel = MODELS.find((m) => m.id === model)!;
  const providerStyle = PROVIDER_COLORS[selectedModel.provider] ?? "text-zinc-400 bg-zinc-500/10";

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
        <div>
          <h1 className="text-lg font-semibold text-white">AI Chat</h1>
          <p className="text-xs text-zinc-500">
            via OpenRouter · {currentWorkspace?.name}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="border-white/10 text-zinc-300 hover:text-white gap-2"
              >
                <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-medium", providerStyle)}>
                  {selectedModel.provider}
                </span>
                {selectedModel.label}
                <ChevronDown className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel className="text-xs text-zinc-500">
                Select model · via OpenRouter
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {MODELS.map((m) => {
                const pStyle = PROVIDER_COLORS[m.provider] ?? "text-zinc-400 bg-zinc-500/10";
                return (
                  <DropdownMenuItem
                    key={m.id}
                    onClick={() => setModel(m.id)}
                    className={cn(m.id === model && "bg-accent")}
                  >
                    <div className="flex items-start gap-2 w-full">
                      <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-medium mt-0.5 shrink-0", pStyle)}>
                        {m.provider}
                      </span>
                      <div>
                        <p className="text-sm font-medium">{m.label}</p>
                        <p className="text-xs text-zinc-500">
                          {m.description} · {m.tier}
                        </p>
                      </div>
                    </div>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>

          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-zinc-500 hover:text-zinc-300"
              onClick={() => setMessages([])}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
              <Cpu className="w-6 h-6 text-violet-400" />
            </div>
            <div>
              <p className="text-white font-medium mb-1">Start a conversation</p>
              <p className="text-sm text-zinc-500">
                Powered by OpenRouter — access 200+ models
              </p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center max-w-sm">
              {[
                "Explain JWT refresh token rotation",
                "Write a Redis rate limiter in TypeScript",
                "How does Razorpay webhook verification work?",
              ].map((p) => (
                <button
                  key={p}
                  className="px-3 py-1.5 rounded-full text-xs border border-white/8 bg-white/3 text-zinc-400 hover:text-white hover:border-violet-500/30 hover:bg-violet-500/5 transition-all"
                  onClick={() => {
                    setInput(p);
                    textareaRef.current?.focus();
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex gap-3",
              msg.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            {msg.role === "assistant" && (
              <div className="w-7 h-7 rounded-lg bg-violet-600/20 border border-violet-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Cpu className="w-3.5 h-3.5 text-violet-400" />
              </div>
            )}

            <div
              className={cn(
                "max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap",
                msg.role === "user"
                  ? "bg-violet-600 text-white rounded-tr-sm"
                  : "bg-white/5 border border-white/8 text-zinc-200 rounded-tl-sm"
              )}
            >
              {msg.content || (
                <span className="flex items-center gap-2 text-zinc-500">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Thinking…
                </span>
              )}
            </div>

            {msg.role === "user" && (
              <Avatar className="w-7 h-7 flex-shrink-0 mt-0.5">
                <AvatarFallback className="text-[10px] bg-zinc-800 text-zinc-300">
                  <User className="w-3.5 h-3.5" />
                </AvatarFallback>
              </Avatar>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-white/8 px-6 py-4">
        <div className="flex gap-3 items-end">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message AI… (⌘ + Enter to send)"
            className="min-h-[52px] max-h-36 resize-none bg-white/4 border-white/10 text-white placeholder:text-zinc-500 focus-visible:ring-violet-500 rounded-xl py-3"
            rows={1}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isStreaming}
            className="bg-violet-600 hover:bg-violet-700 h-[52px] px-4 flex-shrink-0"
          >
            {isStreaming ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-zinc-600 mt-2 text-center">
          {selectedModel.label} via OpenRouter · Quota enforced per workspace · Usage tracked in PostgreSQL
        </p>
      </div>
    </div>
  );
}
