"use client";

import { useState } from "react";
import ReportTemplate from "./ReportTemplate";
import type { ReportDef } from "@/lib/reports";

export default function ReportPicker({ reports }: { reports: ReportDef[] }) {
  const [selected, setSelected] = useState<ReportDef>(reports[0]);
  return (
    <div className="grid gap-4 md:grid-cols-[220px_1fr]">
      <ul className="work-surface max-h-[28rem] space-y-1 overflow-y-auto p-3 text-sm">
        {reports.map((r) => (
          <li key={r.no}>
            <button
              onClick={() => setSelected(r)}
              className={
                "block min-h-10 w-full rounded-lg px-3 py-2 text-left " +
                (r.no === selected.no ? "bg-brand-50 font-semibold text-brand-700" : "text-stone-600 hover:bg-stone-100")
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
