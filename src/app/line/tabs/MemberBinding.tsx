"use client";

import { useState } from "react";
import Badge from "@/components/ui/Badge";
import Switch from "@/components/ui/Switch";

type Binding = {
  id: number;
  name: string;
  userId: string;
  method: "LIFF" | "LINE Login";
  boundAt: string;
  consent: boolean;
};

export default function MemberBinding() {
  const [rows, setRows] = useState<Binding[]>([
    { id: 1, name: "邱o乾", userId: "U1a2b3c...", method: "LIFF", boundAt: "2026-08-05", consent: true },
    { id: 2, name: "林o臻", userId: "U9x8y7z...", method: "LINE Login", boundAt: "2026-08-16", consent: false },
  ]);

  function toggleConsent(id: number) {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, consent: !r.consent } : r)));
  }

  return (
    <div className="space-y-3 text-sm">
      <p className="text-xs text-slate-400">
        會員與LINE個人帳號綁定/解除；解除綁定後保留歷史發送記錄但停止後續推播。
      </p>
      <table className="w-full text-left text-xs">
        <thead className="text-slate-500">
          <tr>
            <th className="px-2 py-1">會員姓名</th>
            <th className="px-2 py-1">LINE userId</th>
            <th className="px-2 py-1">綁定方式</th>
            <th className="px-2 py-1">綁定時間</th>
            <th className="px-2 py-1">同意接收通知</th>
            <th className="px-2 py-1">操作</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-t border-slate-100">
              <td className="px-2 py-1.5">{r.name}</td>
              <td className="px-2 py-1.5 font-mono text-[11px] text-slate-400">{r.userId}</td>
              <td className="px-2 py-1.5">
                <Badge color="blue">{r.method}</Badge>
              </td>
              <td className="px-2 py-1.5">{r.boundAt}</td>
              <td className="px-2 py-1.5">
                <Switch checked={r.consent} onChange={() => toggleConsent(r.id)} />
              </td>
              <td className="px-2 py-1.5">
                <button className="text-rose-500 underline">解除綁定</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-xs text-amber-600">
        ⚠ 群發訊息與課程通知發送前必須檢查「同意接收通知」欄位，未同意者不可發送（個資合規要求）。
      </p>
    </div>
  );
}
