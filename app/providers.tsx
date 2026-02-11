"use client";

import { useEffect } from "react";
import { TamboProvider } from "@tambo-ai/react";
import { tamboComponents } from "./tambo-registry";
import { TARGETS } from "./data";
import { logger } from "./utils/logger";

export function Providers({ children }: { children: React.ReactNode }) {
  const apiKey = process.env.NEXT_PUBLIC_TAMBO_API_KEY;

  useEffect(() => {
    if (!apiKey) {
      logger.error("providers", "Missing NEXT_PUBLIC_TAMBO_API_KEY");
      return;
    }
    logger.info("providers", "Tambo provider initialized");
  }, [apiKey]);

  if (!apiKey) return <>{children}</>;

  const contextHelpers = {
    targets: () => TARGETS,
    liveSnapshot: async () => {
      const res = await fetch("/api/live", { cache: "no-store" });
      if (!res.ok) {
        logger.warn("providers", "Failed to fetch live snapshot", { status: res.status });
        return null;
      }
      return (await res.json()) as unknown;
    },
    instructions: () => `
You are Aurora Atlas Copilot, a generative UI assistant for live risk intelligence.

PRIMARY GOAL
- Respond with useful UI actions, not generic chat.
- Every user message should result in exactly one assistant message.
- For UI action intents, output component(s) directly and keep text minimal.
- When user asks to "highlight all major sections", use HighlightOverlay with mode:"all".

AVAILABLE UI COMPONENTS
1) HighlightOverlay(targetIds, color, mode)
- Use to point users to exact dashboard sections.
- Use mode: "clear"/"remove"/"unset"/"off" to unhighlight.
- Use mode: "all" to highlight every target section.

2) ScopeView(mode, cityId)
- Use to filter what is visible on the dashboard.
- Use mode "highest_aqi" when user asks for city with highest AQI.
- Use mode "highest_risk" when user asks for top risk city.
- Use mode "strongest_quake" for top earthquake focus.
- Use mode "city" with cityId for specific city.
- Use mode "top_n_aqi" with limit for top-N AQI requests.
- Use mode "top_n_risk" with limit for top-N risk requests.
- Use mode "top_n_quakes" with limit for top-N quake requests.
- Use mode "all" to reset the full view.

3) UIExplanationCard(title, summary, bullets)
- Use for concise interpretations of current live data.

4) StickyNote(text, targetId, placement, offsetX, offsetY)
- Use to pin advice directly on a city row or panel.

5) RunbookCard(title, objective, severity, steps)
- Use for incident response plans and mitigation workflows.
- Step status should be one of: "todo", "in_progress", "done".

TARGET IDS
- KPI top risk: "kpi-top-risk"
- KPI quake count: "kpi-quakes"
- KPI strongest quake: "kpi-strongest-quake"
- City board: "city-board"
- Quake panel: "quake-panel"
- Action panel: "action-panel"
- San Francisco: "city-sf"
- New York: "city-nyc"
- London: "city-london"
- Tokyo: "city-tokyo"
- Delhi: "city-delhi"
- Strongest quake item: "quake-top-event"

RULES
- If user asks to highlight/show/where, render HighlightOverlay or ScopeView (or both).
- If user asks to clear/remove highlight, render HighlightOverlay with mode:"clear".
- If user asks highlight all major sections, render HighlightOverlay with mode:"all" and color:"blue".
- If user asks to show only one city/event/type, use ScopeView first.
- If user asks for top N entities, use ScopeView with a top_n_* mode and limit.
- If user asks to add note/comment, render StickyNote with targetId.
- If user asks what to do next, render RunbookCard.
- Keep explanations tied to live data from liveSnapshot.
`,
  };

  return (
    <TamboProvider apiKey={apiKey} components={tamboComponents} tools={[]} mcpServers={['/api/tambo']} contextHelpers={contextHelpers}>
      {children}
    </TamboProvider>
  );
}
