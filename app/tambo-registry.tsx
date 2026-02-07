import { z } from "zod";
import type { ComponentType } from "react";
import { UIExplanationCard } from "./components/tambo/UIExplanationCard";
import { HighlightOverlay } from "./components/tambo/HighlightOverlay";
import { StickyNote, stickyNoteSchema } from "./components/tambo/StickyNote";
import { RunbookCard } from "./components/tambo/RunbookCard";
import { ScopeView } from "./components/tambo/ScopeView";

type TamboComponentDefinition = {
  name: string;
  description: string;
  component: ComponentType<Record<string, unknown>>;
  propsSchema: z.ZodTypeAny;
};

export const tamboComponents: TamboComponentDefinition[] = [
  {
    name: "UIExplanationCard",
    description: "Structured explanatory card for summarizing live signals and observations.",
    component: UIExplanationCard,
    propsSchema: z.object({
      title: z.string().nullish(),
      summary: z.string().nullish(),
      bullets: z.array(z.string()).nullish(),
    }),
  },
  {
    name: "HighlightOverlay",
    description: "Highlights one or more dashboard targets. Use mode='clear' to remove all highlights.",
    component: HighlightOverlay,
    propsSchema: z.object({
      targetIds: z.array(z.string()).nullish(),
      color: z.enum(["red", "green", "blue", "yellow"]).nullish(),
      mode: z.string().nullish().describe("Supports set, clear, remove, unset, off, all."),
    }),
  },
  {
    name: "ScopeView",
    description: "Filters the dashboard to only show the most relevant subset (for example only the highest AQI city).",
    component: ScopeView,
    propsSchema: z.object({
      mode: z
        .enum(["all", "city", "highest_aqi", "highest_risk", "strongest_quake", "quakes_only", "cities_only", "top_n_aqi", "top_n_risk", "top_n_quakes"])
        .nullish(),
      cityId: z.string().nullish(),
      limit: z.number().nullish(),
    }),
  },
  {
    name: "StickyNote",
    description: "Anchored note pinned to a target section or row in the live dashboard.",
    component: StickyNote,
    propsSchema: stickyNoteSchema,
  },
  {
    name: "RunbookCard",
    description: "Operational runbook with concrete steps and ownership.",
    component: RunbookCard,
    propsSchema: z.object({
      title: z.string().nullish(),
      objective: z.string().nullish(),
      severity: z.enum(["P1", "P2", "P3"]).nullish(),
      steps: z
        .array(
          z.object({
            step: z.string(),
            owner: z.string().nullish(),
            status: z.enum(["todo", "in_progress", "done"]).nullish(),
          })
        )
        .nullish(),
    }),
  },
];
