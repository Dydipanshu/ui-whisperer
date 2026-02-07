"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTambo, useTamboGenerationStage, useTamboThread } from "@tambo-ai/react";
import { Bot, Send, Sparkles, Wand2 } from "lucide-react";
import { QUICK_PROMPTS } from "../data";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { logger } from "../utils/logger";
import { TamboCanvas } from "./TamboCanvas";

type MessagePart = { type?: string; text?: string };
type MessageComponent = { componentName?: string; props?: Record<string, unknown> };
type ThreadMessage = { id?: string; role?: string; content?: MessagePart[]; component?: MessageComponent };
type LocalAction = { componentName: string; props?: Record<string, unknown> };

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
        <div className="mb-1 px-1 text-[11px] font-medium text-cyan-200/80">{isUser ? "You" : "Copilot"}</div>
        <div
          className={cn(
            "rounded-2xl p-3 text-sm backdrop-blur",
            isUser
              ? "border border-cyan-300/30 bg-cyan-500/20 text-cyan-50"
              : "border border-white/10 bg-slate-900/70 text-slate-100"
          )}
        >
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{textOf(message)}</p>
        </div>
      </div>
    </div>
  );
};

const parseLocalAction = (input: string): LocalAction[] | null => {
  const text = input.toLowerCase().trim();
  const topMatch = text.match(/top\s*(\d+)/);
  const topN = topMatch ? Number.parseInt(topMatch[1], 10) : null;

  if (/unhighlight|clear\s+highlight|remove\s+highlight/.test(text)) {
    return [{ componentName: "HighlightOverlay", props: { mode: "clear" } }];
  }

  if (/highlight\s+all|highlight\s+major\s+sections|highlight\s+major/.test(text)) {
    return [{ componentName: "HighlightOverlay", props: { mode: "all", color: "blue" } }];
  }

  if (/highest\s+aqi|city\s+with\s+highest\s+aqi/.test(text)) {
    return [
      { componentName: "ScopeView", props: { mode: "highest_aqi" } },
      { componentName: "HighlightOverlay", props: { mode: "set", color: "green", targetIds: ["city-board"] } },
    ];
  }

  if (/highest\s+risk|top\s+risk\s+city/.test(text)) {
    return [{ componentName: "ScopeView", props: { mode: "highest_risk" } }];
  }

  if (/strongest\s+earthquake|strongest\s+quake/.test(text)) {
    return [
      { componentName: "ScopeView", props: { mode: "strongest_quake" } },
      { componentName: "HighlightOverlay", props: { mode: "set", color: "red", targetIds: ["quake-panel"] } },
    ];
  }

  if (/top\s*\d+.*cities?.*earthquake|cities?.*earthquake.*top\s*\d+/.test(text) && topN) {
    return [
      { componentName: "ScopeView", props: { mode: "top_n_risk", limit: Math.max(1, Math.min(topN, 8)) } },
      { componentName: "HighlightOverlay", props: { mode: "set", color: "blue", targetIds: ["city-board", "quake-panel"] } },
      {
        componentName: "UIExplanationCard",
        props: {
          title: `Top ${Math.max(1, Math.min(topN, 8))} cities in focus`,
          summary: "The board is filtered to top-risk cities while earthquake context stays visible.",
          bullets: ["Use 'show all' to reset.", "Use 'highest AQI' to narrow to one city."],
        },
      },
    ];
  }

  if (/top\s+cities?.*earthquake|cities?.*earthquake/.test(text)) {
    return [
      { componentName: "ScopeView", props: { mode: "top_n_risk", limit: 5 } },
      { componentName: "HighlightOverlay", props: { mode: "set", color: "blue", targetIds: ["city-board", "quake-panel"] } },
    ];
  }

  if (/show\s+all|reset\s+view|show\s+everything/.test(text)) {
    return [
      { componentName: "ScopeView", props: { mode: "all" } },
      { componentName: "HighlightOverlay", props: { mode: "clear" } },
    ];
  }

  if (/mitigation\s+runbook|create\s+a?\s*runbook|runbook.*top\s+risks?|top\s+risks?.*runbook/.test(text)) {
    return [
      {
        componentName: "RunbookCard",
        props: {
          title: "Mitigation Runbook",
          objective: "Contain today's highest live risks and reduce operational impact in the next 2 hours.",
          severity: "P1",
          steps: [
            { step: "Escalate highest-risk city and verify AQI/wind alerts", owner: "City Ops", status: "in_progress" },
            { step: "Open incident bridge for quake-watch regions and assign command lead", owner: "Incident Commander", status: "todo" },
            { step: "Publish customer-facing status update and next review checkpoint", owner: "Comms", status: "todo" },
          ],
        },
      },
      { componentName: "HighlightOverlay", props: { mode: "set", color: "red", targetIds: ["action-panel", "city-board", "quake-panel"] } },
    ];
  }

  return null;
};

const dispatchLocalActions = (actions: LocalAction[]) => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("uiw:dispatch-components", {
      detail: {
        replace: true,
        components: actions,
      },
    })
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
    setValue("");
    if (!clean) return;

    const localActions = parseLocalAction(clean);
    if (localActions) {
      logger.info("chat", "resolved command locally", { input: clean, actions: localActions.map((a) => a.componentName) });
      dispatchLocalActions(localActions);
      setSubmitError(null);
      return;
    }

    if (isPending || !thread?.id) {
      logger.warn("chat", "submit ignored due to pending state or missing thread", { isPending, hasThreadId: Boolean(thread?.id) });
      return;
    }

    setSubmitError(null);
    logger.info("chat", "submitting message", { threadId: thread.id, textPreview: clean.slice(0, 80) });

    try {
      await sendThreadMessage(clean, {
        threadId: thread.id,
        additionalContext: {
          ui_response_policy:
            "For action intents emit components first. Prefer ScopeView and HighlightOverlay over prose. Return a single assistant response.",
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Connection error";
      setSubmitError(message);
      logger.error("chat", "sendThreadMessage failed", {
        message,
        name: error instanceof Error ? error.name : undefined,
        stack: error instanceof Error ? error.stack : undefined,
      });
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitMessage(value);
  };

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.26),transparent_46%),radial-gradient(circle_at_14%_30%,rgba(56,189,248,0.18),transparent_42%)]" />
      <header className="relative border-b border-cyan-300/20 bg-slate-900/70 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-2">
          <div className="rounded-lg border border-cyan-300/40 bg-cyan-300/15 p-1.5 text-cyan-100">
            <Bot size={14} />
          </div>
          <div>
            <h2 className="text-sm font-semibold tracking-wide text-cyan-50">Atlas Copilot</h2>
            <p className="text-[11px] text-cyan-100/65">Native command surface</p>
          </div>
        </div>
      </header>

      <div className="relative border-b border-cyan-300/20 bg-slate-900/55 px-3 py-2">
        <div className="flex flex-wrap gap-2">
          {QUICK_PROMPTS.map((prompt) => (
            <Button
              key={prompt}
              type="button"
              size="sm"
              variant="outline"
              className="border-cyan-200/25 bg-slate-900/60 text-cyan-100 hover:border-cyan-200/40 hover:bg-cyan-500/10"
              onClick={() => submitMessage(prompt)}
              disabled={isPending}
            >
              {prompt}
            </Button>
          ))}
        </div>
      </div>

      <div ref={messagesRef} className="relative flex-1 overflow-y-auto p-3">
        {messages.length === 0 ? (
          <div className="mt-8 rounded-xl border border-cyan-300/20 bg-slate-900/60 p-4 text-center text-sm text-cyan-50/80 backdrop-blur">
            <Sparkles size={20} className="mx-auto mb-2 text-cyan-300/70" />
            Ask for focus views, notes, runbooks, or live data interpretation.
          </div>
        ) : (
          messages.map((m, i) => <MessageBubble key={m.id ?? i} message={m} />)
        )}

        <div className="mt-3">
          <TamboCanvas />
        </div>

        {isPending ? <p className="px-1 text-xs text-cyan-100/70">Copilot is analyzing live feeds...</p> : null}
        {submitError ? <p className="px-1 text-xs text-rose-300">{submitError}</p> : null}
      </div>

      <form onSubmit={onSubmit} className="relative border-t border-cyan-300/20 bg-slate-900/70 p-3 backdrop-blur">
        <div className="flex items-center gap-2 rounded-2xl border border-cyan-200/20 bg-slate-950/70 p-2">
          <Wand2 size={14} className="ml-1 text-cyan-300/70" />
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Type a command like: Highlight all major sections"
            className="border-0 bg-transparent text-cyan-50 placeholder:text-cyan-100/35 focus-visible:ring-0"
          />
          <Button type="submit" size="icon" className="bg-cyan-400 text-slate-950 hover:bg-cyan-300" disabled={isPending || !value.trim()}>
            <Send size={14} />
          </Button>
        </div>
      </form>
    </div>
  );
}
