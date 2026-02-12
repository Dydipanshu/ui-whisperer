"use client";

import { useEffect, useMemo, useState } from "react";
import { useTamboThread } from "@tambo-ai/react";
import { X } from "lucide-react";
import { tamboComponents } from "../tambo-registry";
import { logger } from "../utils/logger";

type MessagePart = { type?: string; text?: string };
type MessageComponent = { componentName?: string; props?: Record<string, unknown> };
type ThreadMessage = { id?: string; role?: string; content?: MessagePart[]; component?: MessageComponent };

type CanvasEntry = {
  key: string;
  componentName: string;
  props: Record<string, unknown>;
  source: "thread" | "local";
};

type LocalDispatch = {
  components?: Array<{ componentName?: string; props?: Record<string, unknown> }>;
  replace?: boolean;
};

const SIDE_EFFECT_COMPONENTS = new Set(["HighlightOverlay", "ScopeView", "StickyNote"]);

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
    const sameAsPrev =
      prev && `${prev.role}|${textOf(prev)}|${JSON.stringify(prev.component ?? {})}` === `${m.role}|${textOf(m)}|${JSON.stringify(m.component ?? {})}`;
    if (!sameAsPrev) out.push(m);
  }

  return out;
};

const normalizeEntries = (messages: ThreadMessage[]): CanvasEntry[] => {
  return messages
    .filter((m) => m.role === "assistant" && m.component?.componentName)
    .map((m, idx) => {
      const props = (m.component?.props ?? {}) as Record<string, any>;
      const key =
        props.id ??
        `${m.id ?? `idx-${idx}`}:${m.component?.componentName ?? "unknown"}:${JSON.stringify(props)}`;
      return {
        key: key,
        componentName: m.component?.componentName ?? "",
        props: props,
        source: "thread" as const,
      };
    });
};

const reduceSideEffects = (entries: CanvasEntry[]) => {
  const latestSingle = new Map<string, CanvasEntry>();
  const stickyNotes: CanvasEntry[] = [];

  entries.forEach((entry) => {
    if (entry.componentName === "StickyNote") {
      stickyNotes.push(entry);
      return;
    }
    latestSingle.set(entry.componentName, entry);
  });

  return [...latestSingle.values(), ...stickyNotes.slice(-3)];
};

export function TamboCanvas() {
  const { thread } = useTamboThread();
  const [localEntries, setLocalEntries] = useState<CanvasEntry[]>([]);
  const [dismissedCards, setDismissedCards] = useState<Record<string, true>>({});
  const [removedComponentIds, setRemovedComponentIds] = useState<Record<string, true>>({});

  const messages = useMemo(() => dedupe((thread?.messages ?? []) as ThreadMessage[]), [thread?.messages]);

  useEffect(() => {
    for (const message of messages) {
      const removedId = (message as any).removedComponent?.id;
      if (removedId && !removedComponentIds[removedId]) {
        logger.info("canvas", "removing component", { removedId });
        setRemovedComponentIds((prev) => ({ ...prev, [removedId]: true }));
      }
    }
  }, [messages, removedComponentIds]);

  useEffect(() => {
    const onDispatch = (event: Event) => {
      const customEvent = event as CustomEvent<LocalDispatch>;
      const payload = customEvent.detail ?? {};
      const incoming = (payload.components ?? [])
        .filter((item) => item.componentName)
        .map((item, idx) => ({
          key: `local-${Date.now()}-${idx}-${item.componentName}`,
          componentName: item.componentName ?? "",
          props: (item.props ?? {}) as Record<string, unknown>,
          source: "local" as const,
        }));

      logger.info("canvas", "received local component dispatch", {
        replace: Boolean(payload.replace),
        count: incoming.length,
        components: incoming.map((item) => item.componentName),
      });

      setLocalEntries((prev) => (payload.replace ? incoming : [...prev.slice(-12), ...incoming]));
    };

    window.addEventListener("uiw:dispatch-components", onDispatch as EventListener);
    return () => window.removeEventListener("uiw:dispatch-components", onDispatch as EventListener);
  }, []);

  const components = useMemo(() => {
    const threadEntries = normalizeEntries(messages).filter((entry) => !removedComponentIds[entry.key]);
    const sideEffects = [...threadEntries, ...localEntries].filter((c) => SIDE_EFFECT_COMPONENTS.has(c.componentName));

    return {
      sideEffects: reduceSideEffects(sideEffects),
    };
  }, [messages, localEntries, removedComponentIds]);

  if (components.sideEffects.length === 0) return null;

  return (
    <>
      {components.sideEffects.map((entry) => {
        const def = tamboComponents.find((c) => c.name === entry.componentName);
        if (!def) return null;
        logger.debug("canvas", "mount side-effect component", { source: entry.source, componentName: entry.componentName });
        const Component = def.component;
        return <Component key={entry.key} {...entry.props} />;
      })}
    </>
  );
}
