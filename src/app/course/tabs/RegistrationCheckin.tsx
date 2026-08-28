"use client";

import { useState } from "react";
import Badge from "@/components/ui/Badge";

type Enrollee = { id: number; name: string; phone: string; checkedIn: boolean };

const SESSIONS = ["產後瑜珈 08/29 10:00", "新生兒沐浴教學 08/30 14:00"];

export default function RegistrationCheckin() {
  const [session, setSession] = useState(SESSIONS[0]);
  const [enrollees, setEnrollees] = useState<Enrollee[]>([
    { id: 1, name: "邱o乾", phone: "0912-345-678", checkedIn: true },
    { id: 2, name: "林o臻", phone: "0922-111-222", checkedIn: false },
  ]);

  function toggleCheckin(id: number) {
    setEnrollees((es) => es.map((e) => (e.id === id ? { ...e, checkedIn: !e.checkedIn } : e)));
  }

  const noShow = enrollees.filter((e) => !e.checkedIn).length;

  return (
    <div className="space-y-3 text-sm">
      <select value={session} onChange={(e) => setSession(e.target.value)} className="rounded border border-slate-200 px-2 py-1.5 text-xs">
        {SESSIONS.map((s) => (
          <option key={s}>{s}</option>
        ))}
      </select>
      <table className="w-full text-left text-xs">
        <thead className="text-slate-500">
          <tr>
            <th className="px-2 py-1">姓名</th>
            <th className="px-2 py-1">電話</th>
            <th className="px-2 py-1">簽到狀態</th>
          </tr>
        </thead>
        <tbody>
          {enrollees.map((e) => (
            <tr key={e.id} className="border-t border-slate-100">
              <td className="px-2 py-1.5">{e.name}</td>
              <td className="px-2 py-1.5">{e.phone}</td>
              <td className="px-2 py-1.5">
                <button onClick={() => toggleCheckin(e.id)}>
                  <Badge color={e.checkedIn ? "green" : "slate"}>{e.checkedIn ? "已簽到" : "未到"}</Badge>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-xs text-slate-400">未簽到者自動歸類為「未到記錄」（目前{noShow}人），供15.4.10媽媽報名記錄等報表統計。</p>
    </div>
  );
}
