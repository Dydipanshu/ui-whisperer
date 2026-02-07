"use client";

import { useMemo } from "react";
import { useTamboThread } from "@tambo-ai/react";
import { tamboComponents } from "../tambo-registry";
import { logger } from "../utils/logger";

type MessagePart = { type?: string; text?: string };
type MessageComponent = { componentName?: string; props?: Record<string, unknown> };
type ThreadMessage = { id?: string; role?: string; content?: MessagePart[]; component?: MessageComponent };

const textOf = (m: ThreadMessage) =>
  (m.content ?? [])
    .filter((p) => p.type === "text" && p.text?.trim())
    .map((p) => p.text?.trim())
    .join("\n");

const dedupe = (messages: ThreadMessage[]) => {
  const seen = new Set<string>();
  const out: ThreadMessage[] = [];

  for (const m of messages) {
    if (m.id && seen.has(m.id)) continue;
    if (m.id) seen.add(m.id);
    const prev = out[out.length - 1];
    const sameAsPrev = prev && `${prev.role}|${textOf(prev)}|${JSON.stringify(prev.component ?? {})}` === `${m.role}|${textOf(m)}|${JSON.stringify(m.component ?? {})}`;
    if (!sameAsPrev) out.push(m);
  }

  return out;
};

const SIDE_EFFECT_COMPONENTS = new Set(["HighlightOverlay", "ScopeView", "StickyNote"]);

export function TamboCanvas() {
  const { thread } = useTamboThread();
  const messages = useMemo(() => dedupe((thread?.messages ?? []) as ThreadMessage[]), [thread?.messages]);

  const components = useMemo(() => {
    const entries = messages
      .filter((m) => m.role === "assistant" && m.component?.componentName)
      .map((m) => m.component as Required<ThreadMessage>["component"]);

    const sideEffects = entries.filter((c) => SIDE_EFFECT_COMPONENTS.has(c.componentName ?? ""));
    const cards = entries.filter((c) => !SIDE_EFFECT_COMPONENTS.has(c.componentName ?? ""));

    return {
      sideEffects,
      cards: cards.slice(-2),
    };
  }, [messages]);

  if (components.sideEffects.length + components.cards.length === 0) return null;

  return (
    <>
      {components.sideEffects.map((entry, idx) => {
        const def = tamboComponents.find((c) => c.name === entry.componentName);
        if (!def) return null;
        logger.info("canvas", "mount side-effect component", { componentName: entry.componentName, props: entry.props });
        const Component = def.component;
        return <Component key={`se-${entry.componentName}-${idx}`} {...(entry.props ?? {})} />;
      })}

      {components.cards.length > 0 ? (
        <section
          id="analysis-panel"
          data-target-id
          className="pointer-events-none fixed bottom-5 left-5 z-[80] flex max-h-[45vh] w-[min(480px,calc(100vw-2.5rem))] flex-col gap-3 overflow-auto"
        >
          {components.cards.map((entry, idx) => {
            const def = tamboComponents.find((c) => c.name === entry.componentName);
            if (!def) return null;
            const Component = def.component;
            return (
              <div key={`card-${entry.componentName}-${idx}`} className="pointer-events-auto">
                <Component {...(entry.props ?? {})} />
              </div>
            );
          })}
        </section>
      ) : null}
    </>
  );
}
