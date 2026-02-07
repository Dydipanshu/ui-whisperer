import React from "react";

export type UIExplanationCardProps = {
  title?: string;
  bullets?: string[];
  summary?: string;
};

export const UIExplanationCard: React.FC<UIExplanationCardProps> = ({
  title = "Analysis",
  summary,
  bullets = [],
}) => {
  return (
    <section className="rounded-2xl border border-cyan-200/30 bg-slate-950/90 p-4 shadow-xl shadow-cyan-900/20">
      <h3 className="mb-2 text-sm font-semibold text-cyan-50">{title}</h3>
      {summary ? <p className="mb-2 text-xs text-cyan-100/80">{summary}</p> : null}
      <ul className="space-y-1.5">
        {bullets.map((bullet, idx) => (
          <li key={`${bullet}-${idx}`} className="text-xs text-cyan-100/80">
            • {bullet}
          </li>
        ))}
      </ul>
    </section>
  );
};
