"use client";

import { useState } from "react";
import ReportTemplate from "./ReportTemplate";
import type { ReportDef } from "@/lib/reports";

export default function ReportPicker({ reports }: { reports: ReportDef[] }) {
  const [selected, setSelected] = useState<ReportDef>(reports[0]);
  return (
    <div className="grid gap-4 md:grid-cols-[220px_1fr]">
      <ul className="max-h-[28rem] space-y-0.5 overflow-y-auto text-xs">
        {reports.map((r) => (
          <li key={r.no}>
            <button
              onClick={() => setSelected(r)}
              className={
                "block w-full rounded px-2 py-1.5 text-left " +
                (r.no === selected.no ? "bg-rose-500 text-white" : "hover:bg-slate-100")
              }
            >
              {r.no} {r.name}
            </button>
          </li>
        ))}
      </ul>
      <ReportTemplate title={selected.name} columns={selected.columns} sampleRows={selected.sampleRows} />
    </div>
  );
}
