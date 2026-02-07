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
    <section className="rounded-2xl border border-indigo-200 bg-white/95 p-4 shadow-lg shadow-indigo-100">
      <h3 className="mb-2 text-sm font-semibold text-indigo-900">{title}</h3>
      {summary ? <p className="mb-2 text-xs text-slate-700">{summary}</p> : null}
      <ul className="space-y-1.5">
        {bullets.map((bullet, idx) => (
          <li key={`${bullet}-${idx}`} className="text-xs text-slate-700">
            • {bullet}
          </li>
        ))}
      </ul>
    </section>
  );
};
