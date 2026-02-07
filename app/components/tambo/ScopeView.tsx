"use client";

import { useEffect } from "react";
import { logger } from "@/app/utils/logger";

export type ScopeViewProps = {
  mode?:
    | "all"
    | "city"
    | "highest_aqi"
    | "highest_risk"
    | "strongest_quake"
    | "quakes_only"
    | "cities_only"
    | "top_n_aqi"
    | "top_n_risk"
    | "top_n_quakes";
  cityId?: string;
  limit?: number;
};

const CITY_SELECTOR = "[data-scope='city']";
const QUAKE_SELECTOR = "[data-scope='quake']";
const PANEL_CITY = "#city-board";
const PANEL_QUAKE = "#quake-panel";

const show = (el: Element | null) => {
  if (!el) return;
  (el as HTMLElement).style.display = "";
};

const hide = (el: Element | null) => {
  if (!el) return;
  (el as HTMLElement).style.display = "none";
};

const resetScope = () => {
  document.querySelectorAll(CITY_SELECTOR).forEach(show);
  document.querySelectorAll(QUAKE_SELECTOR).forEach(show);
  show(document.querySelector(PANEL_CITY));
  show(document.querySelector(PANEL_QUAKE));
  logger.debug("scope", "scope reset to full view");
};

const rankElements = (selector: string, attr: string) => {
  return Array.from(document.querySelectorAll(selector))
    .map((item) => ({
      element: item,
      value: Number((item as HTMLElement).dataset[attr] ?? "-1"),
    }))
    .filter((row) => Number.isFinite(row.value))
    .sort((a, b) => b.value - a.value);
};

const keepTopN = (selector: string, attr: string, limit: number) => {
  const ranked = rankElements(selector, attr);
  const keep = new Set(ranked.slice(0, limit).map((row) => row.element));

  document.querySelectorAll(selector).forEach((el) => {
    if (!keep.has(el)) hide(el);
  });
};

export const ScopeView: React.FC<ScopeViewProps> = ({ mode = "all", cityId, limit = 5 }) => {
  useEffect(() => {
    logger.info("scope", "apply scope view", { mode, cityId, limit });

    resetScope();

    if (mode === "all") return;

    if (mode === "cities_only") {
      hide(document.querySelector(PANEL_QUAKE));
      return;
    }

    if (mode === "quakes_only") {
      hide(document.querySelector(PANEL_CITY));
      return;
    }

    if (mode === "city" && cityId) {
      document.querySelectorAll(CITY_SELECTOR).forEach((el) => {
        if (el.id !== cityId) hide(el);
      });
      hide(document.querySelector(PANEL_QUAKE));
      return;
    }

    if (mode === "highest_aqi") {
      keepTopN(CITY_SELECTOR, "aqi", 1);
      hide(document.querySelector(PANEL_QUAKE));
      return;
    }

    if (mode === "highest_risk") {
      keepTopN(CITY_SELECTOR, "risk", 1);
      hide(document.querySelector(PANEL_QUAKE));
      return;
    }

    if (mode === "top_n_aqi") {
      keepTopN(CITY_SELECTOR, "aqi", Math.max(1, limit));
      hide(document.querySelector(PANEL_QUAKE));
      return;
    }

    if (mode === "top_n_risk") {
      keepTopN(CITY_SELECTOR, "risk", Math.max(1, limit));
      hide(document.querySelector(PANEL_QUAKE));
      return;
    }

    if (mode === "strongest_quake") {
      keepTopN(QUAKE_SELECTOR, "mag", 1);
      hide(document.querySelector(PANEL_CITY));
      return;
    }

    if (mode === "top_n_quakes") {
      keepTopN(QUAKE_SELECTOR, "mag", Math.max(1, limit));
      hide(document.querySelector(PANEL_CITY));
    }

    const visibleCities = Array.from(document.querySelectorAll(CITY_SELECTOR)).filter((el) => (el as HTMLElement).style.display !== "none").length;
    const visibleQuakes = Array.from(document.querySelectorAll(QUAKE_SELECTOR)).filter((el) => (el as HTMLElement).style.display !== "none").length;
    logger.info("scope", "scope applied", { mode, visibleCities, visibleQuakes });
  }, [mode, cityId, limit]);

  return null;
};
