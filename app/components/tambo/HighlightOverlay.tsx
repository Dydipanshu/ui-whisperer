"use client";

import { useEffect } from "react";
import { logger } from "@/app/utils/logger";

export type HighlightOverlayProps = {
  targetIds?: string[];
  color?: "red" | "green" | "blue" | "yellow";
  mode?: string;
};

declare global {
  interface Window {
    __uiwHighlightedIds?: string[];
  }
}

const CLASS_MAP = {
  red: "uiw-highlight-red",
  green: "uiw-highlight-green",
  blue: "uiw-highlight-blue",
  yellow: "uiw-highlight-yellow",
};

const normalizeMode = (mode?: string) => {
  const value = (mode ?? "set").toLowerCase();
  if (["clear", "remove", "unset", "off", "none", "reset"].includes(value)) return "clear";
  if (["all", "everything"].includes(value)) return "all";
  return "set";
};

const clearHighlights = () => {
  const ids = window.__uiwHighlightedIds ?? [];
  ids.forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.remove("uiw-highlight", "uiw-highlight-red", "uiw-highlight-green", "uiw-highlight-blue", "uiw-highlight-yellow");
  });
  document.body.classList.remove("uiw-focus-active");
  window.__uiwHighlightedIds = [];
};

export const HighlightOverlay: React.FC<HighlightOverlayProps> = ({ targetIds = [], color = "yellow", mode }) => {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const normalizedMode = normalizeMode(mode);
    const allTargetIds = Array.from(document.querySelectorAll("[data-target-id]")).map((el) => el.id).filter(Boolean);
    const ids = normalizedMode === "all" ? allTargetIds : targetIds;

    logger.info("highlight", "apply highlight request", { mode, normalizedMode, color, targetIds: ids });

    clearHighlights();
    if (normalizedMode === "clear") return;

    const colorClass = CLASS_MAP[color] ?? CLASS_MAP.yellow;
    const applied: string[] = [];

    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.classList.add("uiw-highlight", colorClass);
      applied.push(id);
    });

    if (ids.length > 0 && applied.length === 0) {
      logger.warn("highlight", "No target ids were found in DOM", { ids });
    }

    if (applied.length > 0) {
      document.body.classList.add("uiw-focus-active");
      window.__uiwHighlightedIds = applied;
    }

    return () => {
      // Intentionally persist until next highlight/clear command.
    };
  }, [targetIds, color, mode]);

  return null;
};
