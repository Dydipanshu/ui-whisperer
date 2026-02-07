import React from "react";

type RunbookStep = {
  step: string;
  owner?: string;
  status?: "todo" | "in_progress" | "done";
};

export type RunbookCardProps = {
  title?: string;
  objective?: string;
  severity?: "P1" | "P2" | "P3";
  steps?: RunbookStep[];
};

const statusStyle: Record<NonNullable<RunbookStep["status"]>, string> = {
  todo: "bg-slate-100 text-slate-700 border-slate-200",
  in_progress: "bg-amber-100 text-amber-800 border-amber-200",
  done: "bg-emerald-100 text-emerald-800 border-emerald-200",
};

export const RunbookCard: React.FC<RunbookCardProps> = ({
  title = "Incident Runbook",
  objective = "Stabilize core customer flows while preserving telemetry.",
  severity = "P2",
  steps = [],
}) => {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        <span className="rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-700">
          {severity}
        </span>
      </div>
      <p className="mb-3 text-xs text-slate-600">{objective}</p>
      <ul className="space-y-2">
        {steps.map((item, idx) => (
          <li key={`${item.step}-${idx}`} className="rounded-xl border border-slate-200 bg-slate-50 p-2">
            <div className="mb-1 flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-slate-800">{item.step}</span>
              <span
                className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusStyle[item.status ?? "todo"]}`}
              >
                {(item.status ?? "todo").replace("_", " ")}
              </span>
            </div>
            {item.owner ? <p className="text-[11px] text-slate-500">Owner: {item.owner}</p> : null}
          </li>
        ))}
      </ul>
    </section>
  );
};
