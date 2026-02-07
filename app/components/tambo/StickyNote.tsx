"use client";

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { withInteractable } from '@tambo-ai/react';
import { z } from 'zod';
import { logger } from '@/app/utils/logger';
import { X } from 'lucide-react';

const placementSchema = z.enum(["top-right", "top-left", "bottom-right", "bottom-left", "center"]);

export type StickyNoteProps = {
  text?: string;
  x?: number;
  y?: number;
  targetId?: string;
  placement?: z.infer<typeof placementSchema>;
  offsetX?: number;
  offsetY?: number;
};

// Define Schema here so we can pass it to the HOC
export const stickyNoteSchema = z.object({
  text: z.string().nullish().describe("The text content of the note"),
  targetId: z.string().nullish().describe("Preferred: DOM id to anchor note to (example: metric-errors, chart-main, table-services, service-payment)."),
  placement: placementSchema.nullish().describe("Where to place note relative to targetId."),
  offsetX: z.number().nullish().describe("Horizontal pixel offset from computed anchor position."),
  offsetY: z.number().nullish().describe("Vertical pixel offset from computed anchor position."),
  x: z.number().nullish().describe("Fallback absolute x coordinate in viewport pixels when targetId is unavailable."),
  y: z.number().nullish().describe("Fallback absolute y coordinate in viewport pixels when targetId is unavailable."),
});

const NOTE_WIDTH = 240;
const NOTE_HEIGHT = 132;

const computeAnchoredPosition = (
  rect: DOMRect,
  placement: NonNullable<StickyNoteProps["placement"]>,
  offsetX: number,
  offsetY: number
) => {
  if (placement === "top-left") return { left: rect.left - NOTE_WIDTH - 12 + offsetX, top: rect.top - 8 + offsetY };
  if (placement === "bottom-right") return { left: rect.right - 12 + offsetX, top: rect.bottom - 8 + offsetY };
  if (placement === "bottom-left") return { left: rect.left - NOTE_WIDTH - 12 + offsetX, top: rect.bottom - 8 + offsetY };
  if (placement === "center") {
    return {
      left: rect.left + rect.width / 2 - NOTE_WIDTH / 2 + offsetX,
      top: rect.top + rect.height / 2 - NOTE_HEIGHT / 2 + offsetY,
    };
  }
  return { left: rect.right - 12 + offsetX, top: rect.top - 8 + offsetY };
};

const clampToViewport = (left: number, top: number) => {
  const maxLeft = window.innerWidth - NOTE_WIDTH - 8;
  const maxTop = window.innerHeight - NOTE_HEIGHT - 8;
  return {
    left: Math.max(8, Math.min(left, maxLeft)),
    top: Math.max(8, Math.min(top, maxTop)),
  };
};

const StickyNoteBase: React.FC<StickyNoteProps> = ({
  text = "New Note",
  x = 100,
  y = 100,
  targetId,
  placement = "top-right",
  offsetX = 0,
  offsetY = 0,
}) => {
  const [position, setPosition] = useState({ left: x, top: y });
  const [dismissed, setDismissed] = useState(false);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    logger.info("sticky-note", "Mount/update note", { targetId, placement, offsetX, offsetY, x, y, text });

    const updatePosition = () => {
      const target = targetId ? document.getElementById(targetId) : null;
      if (target) {
        const rect = target.getBoundingClientRect();
        const anchored = computeAnchoredPosition(rect, placement, offsetX, offsetY);
        const next = clampToViewport(anchored.left, anchored.top);
        setPosition((prev) => (prev.left === next.left && prev.top === next.top ? prev : next));
        return;
      }
      const next = clampToViewport(x + offsetX, y + offsetY);
      setPosition((prev) => (prev.left === next.left && prev.top === next.top ? prev : next));
    };

    const scheduleUpdate = () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      frameRef.current = requestAnimationFrame(updatePosition);
    };

    const resizeObserver = new ResizeObserver(scheduleUpdate);
    if (targetId) {
      const target = document.getElementById(targetId);
      if (target) resizeObserver.observe(target);
    }

    window.addEventListener('resize', scheduleUpdate, { passive: true });
    document.addEventListener('scroll', scheduleUpdate, { passive: true, capture: true });
    scheduleUpdate();

    return () => {
      resizeObserver.disconnect();
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      window.removeEventListener('resize', scheduleUpdate);
      document.removeEventListener('scroll', scheduleUpdate, true);
    };
  }, [targetId, placement, offsetX, offsetY, x, y, text]);

  if (typeof document === 'undefined' || dismissed) return null;
  
  return createPortal(
    <div
      className="fixed w-60 rounded-md border border-amber-300 bg-amber-100 p-4 text-amber-950 shadow-lg transition-all duration-300"
      style={{
        left: position.left,
        top: position.top,
      }}
    >
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-rose-400/70 shadow-sm" />
          {targetId ? <span className="text-[10px] font-semibold uppercase tracking-wide text-amber-800/80">{targetId}</span> : null}
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="rounded p-1 text-amber-800/70 transition hover:bg-amber-200 hover:text-amber-950"
          aria-label="Close note"
        >
          <X size={12} />
        </button>
      </div>
      <p className="text-sm leading-relaxed font-medium">{text}</p>
    </div>,
    document.body
  );
};

// Wrap it!
export const StickyNote = withInteractable(StickyNoteBase, {
  componentName: "StickyNote",
  description: "A sticky note that can be placed anywhere on the screen. Use this for persistent notes or comments.",
  propsSchema: stickyNoteSchema,
});
