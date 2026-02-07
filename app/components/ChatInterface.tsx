"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTambo, useTamboGenerationStage, useTamboThread } from "@tambo-ai/react";
import { Bot, Send, Sparkles } from "lucide-react";
import { QUICK_PROMPTS } from "../data";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { logger } from "../utils/logger";

type MessagePart = { type?: string; text?: string };
type MessageComponent = { componentName?: string; props?: Record<string, unknown> };
type ThreadMessage = { id?: string; role?: string; content?: MessagePart[]; component?: MessageComponent };

const textOf = (m: ThreadMessage) =>
  (m.content ?? [])
    .filter((p) => p.type === "text" && p.text?.trim())
    .map((p) => p.text?.trim())
    .join("\n");

const componentSig = (m: ThreadMessage) =>
  m.component?.componentName ? `${m.component.componentName}:${JSON.stringify(m.component.props ?? {})}` : "";

const dedupe = (messages: ThreadMessage[]) => {
  const seen = new Set<string>();
  const out: ThreadMessage[] = [];

  for (const m of messages) {
    if (m.id && seen.has(m.id)) continue;
    if (m.id) seen.add(m.id);
    const prev = out[out.length - 1];
    const sameAsPrev = prev && `${prev.role}|${textOf(prev)}|${componentSig(prev)}` === `${m.role}|${textOf(m)}|${componentSig(m)}`;
    if (!sameAsPrev) out.push(m);
  }

  return out.filter((m, i, arr) => {
    if (m.role !== "assistant" || m.component?.componentName) return true;
    const prev = arr[i - 1];
    const next = arr[i + 1];
    return !(prev?.component?.componentName || next?.component?.componentName);
  });
};

const MessageBubble = ({ message }: { message: ThreadMessage }) => {
  const isUser = message.role === "user";
  const hasText = Boolean(textOf(message));
  if (!hasText) return null;

  return (
    <div className={cn("mb-4 flex w-full", isUser ? "justify-end" : "justify-start")}>
      <div className="max-w-[92%]">
        <div className="mb-1 px-1 text-[11px] font-medium text-slate-500">{isUser ? "You" : "Copilot"}</div>
        <div className={cn("rounded-2xl p-3 text-sm", isUser ? "bg-slate-900 text-white" : "border border-slate-200 bg-white text-slate-800")}>
          <p className="whitespace-pre-wrap text-sm">{textOf(message)}</p>
        </div>
      </div>
    </div>
  );
};

export function ChatInterface() {
  const { thread } = useTamboThread();
  const { isIdle } = useTamboGenerationStage();
  const isPending = !isIdle;
  const { sendThreadMessage } = useTambo();
  const [value, setValue] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const messagesRef = useRef<HTMLDivElement>(null);
  const messages = useMemo(() => dedupe((thread?.messages ?? []) as ThreadMessage[]), [thread?.messages]);

  useEffect(() => {
    if (messagesRef.current) messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
  }, [messages.length, isPending]);

  useEffect(() => {
    logger.debug("chat", "thread changed", {
      threadId: thread?.id,
      messageCount: thread?.messages?.length ?? 0,
      isPending,
    });
  }, [thread?.id, thread?.messages?.length, isPending]);

  const submitMessage = async (text: string) => {
    const clean = text.trim();
    if (!clean || isPending || !thread?.id) return;

    setValue("");
    setSubmitError(null);
    logger.info("chat", "submitting message", { threadId: thread.id, textPreview: clean.slice(0, 80) });

    try {
      await sendThreadMessage(clean, {
        threadId: thread.id,
        additionalContext: {
          ui_response_policy:
            "For action intents prefer component output over prose. Use ScopeView/HighlightOverlay/StickyNote/RunbookCard as primary response.",
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Connection error";
      setSubmitError(message);
      logger.error("chat", "sendThreadMessage failed", { message, error });
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitMessage(value);
  };

  return (
    <div className="flex h-full flex-col bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-slate-900 p-1.5 text-white">
            <Bot size={14} />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Operations Copilot</h2>
            <p className="text-[11px] text-slate-500">Live incident assistant</p>
          </div>
        </div>
      </header>

      <div className="border-b border-slate-200 bg-white px-3 py-2">
        <div className="flex flex-wrap gap-2">
          {QUICK_PROMPTS.map((prompt) => (
            <Button key={prompt} type="button" size="sm" variant="outline" onClick={() => submitMessage(prompt)} disabled={isPending}>
              {prompt}
            </Button>
          ))}
        </div>
      </div>

      <div ref={messagesRef} className="flex-1 overflow-y-auto p-3">
        {messages.length === 0 ? (
          <div className="mt-8 rounded-xl border border-slate-200 bg-white p-4 text-center text-sm text-slate-600">
            <Sparkles size={20} className="mx-auto mb-2 text-slate-400" />
            Ask for focus views, notes, runbooks, or live data interpretation.
          </div>
        ) : (
          messages.map((m, i) => <MessageBubble key={m.id ?? i} message={m} />)
        )}

        {isPending ? <p className="px-1 text-xs text-slate-500">Copilot is thinking...</p> : null}
        {submitError ? <p className="px-1 text-xs text-rose-600">{submitError}</p> : null}
      </div>

      <form onSubmit={onSubmit} className="border-t border-slate-200 bg-white p-3">
        <div className="flex items-center gap-2">
          <Input value={value} onChange={(e) => setValue(e.target.value)} placeholder="Ask about live risks..." />
          <Button type="submit" size="icon" disabled={isPending || !value.trim()}>
            <Send size={14} />
          </Button>
        </div>
      </form>
    </div>
  );
}
