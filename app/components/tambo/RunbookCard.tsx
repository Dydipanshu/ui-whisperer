import React from "react";

type RunbookStep = {
  step: string;
  owner?: string;
  status?: string;
};

export type RunbookCardProps = {
  title?: string;
  objective?: string;
  severity?: string;
  steps?: RunbookStep[];
};

const statusStyle: Record<"todo" | "in_progress" | "done", string> = {
  todo: "bg-slate-800 text-slate-100 border-slate-700",
  in_progress: "bg-amber-300/20 text-amber-100 border-amber-200/30",
  done: "bg-emerald-300/20 text-emerald-100 border-emerald-200/30",
};

const normalizeStatus = (status?: string): "todo" | "in_progress" | "done" => {
  const value = (status ?? "todo").toLowerCase().replaceAll(" ", "_").replaceAll("-", "_");
  if (["in_progress", "inprogress", "doing", "active", "pending"].includes(value)) return "in_progress";
  if (["done", "complete", "completed", "resolved", "closed"].includes(value)) return "done";
  return "todo";
};

const normalizeSeverity = (severity?: string): "P1" | "P2" | "P3" => {
  const value = (severity ?? "P2").toUpperCase().trim().replaceAll(" ", "").replaceAll("-", "");
  if (["P1", "SEV1", "S1", "CRITICAL", "HIGH"].includes(value)) return "P1";
  if (["P3", "SEV3", "S3", "LOW", "MINOR"].includes(value)) return "P3";
  return "P2";
};

export const RunbookCard: React.FC<RunbookCardProps> = ({
  title = "Incident Runbook",
  objective = "Stabilize core customer flows while preserving telemetry.",
  severity = "P2",
  steps = [],
}) => {
  const normalizedSeverity = normalizeSeverity(severity);

  return (
    <section className="rounded-2xl border border-cyan-200/25 bg-slate-950/92 p-4 shadow-xl shadow-cyan-900/20">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-cyan-50">{title}</h3>
        <span className="rounded-full border border-rose-200/30 bg-rose-300/15 px-2 py-0.5 text-[10px] font-semibold text-rose-100">
          {normalizedSeverity}
        </span>
      </div>
      <p className="mb-3 text-xs text-cyan-100/80">{objective}</p>
      <ul className="space-y-2">
        {steps.map((item, idx) => (
          <li key={`${item.step}-${idx}`} className="rounded-xl border border-cyan-200/15 bg-slate-900/80 p-2">
            {(() => {
              const status = normalizeStatus(item.status);
              return (
                <>
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-cyan-50">{item.step}</span>
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusStyle[status]}`}>
                      {status.replace("_", " ")}
                    </span>
                  </div>
                  {item.owner ? <p className="text-[11px] text-cyan-100/65">Owner: {item.owner}</p> : null}
                </>
              );
            })()}
          </li>
        ))}
      </ul>
    </section>
  );
};
