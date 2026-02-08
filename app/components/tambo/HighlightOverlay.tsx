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

const MAJOR_TARGET_IDS = ["header-main", "kpi-top-risk", "kpi-quakes", "city-board", "quake-panel", "action-panel", "analysis-panel"];

const TARGET_ALIASES: Record<string, string> = {
  header: "header-main",
  main: "header-main",
  city: "city-board",
  cities: "city-board",
  cityboard: "city-board",
  board: "city-board",
  quake: "quake-panel",
  quakes: "quake-panel",
  earthquake: "quake-panel",
  earthquakes: "quake-panel",
  actions: "action-panel",
  action: "action-panel",
  major: "header-main",
  all: "all",
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

const resolveTargetId = (token: string): string | null => {
  const clean = token.trim();
  if (!clean) return null;
  const alias = TARGET_ALIASES[clean.toLowerCase().replaceAll(" ", "").replaceAll("-", "")];
  if (alias === "all") return "all";
  if (alias) return alias;

  const byId = document.getElementById(clean);
  if (byId) return byId.id;

  const byDataId = document.querySelector(`[data-target-id="${clean}"]`) as HTMLElement | null;
  if (byDataId?.id) return byDataId.id;

  return null;
};

export const HighlightOverlay: React.FC<HighlightOverlayProps> = ({ targetIds = [], color = "yellow", mode }) => {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const normalizedMode = normalizeMode(mode);
    const allTargetIds = Array.from(document.querySelectorAll("[data-target-id]"))
      .map((el) => (el as HTMLElement).id)
      .filter(Boolean);
    const resolvedRequested = (targetIds ?? []).map(resolveTargetId).filter((item): item is string => Boolean(item));
    const defaultMajor = MAJOR_TARGET_IDS.filter((id) => document.getElementById(id));
    const ids =
      normalizedMode === "all"
        ? allTargetIds
        : resolvedRequested.includes("all")
          ? allTargetIds
          : resolvedRequested.length > 0
            ? resolvedRequested
            : defaultMajor;

    logger.info("highlight", "apply highlight request", { mode, normalizedMode, color, targetIds: ids });

    clearHighlights();
    if (normalizedMode === "clear") return;

    const colorClass = CLASS_MAP[color] ?? CLASS_MAP.yellow;
    const applied: string[] = [];

    Array.from(new Set(ids)).forEach((id) => {
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
