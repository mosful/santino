"use client";

import { useState } from "react";
import Tabs from "@/components/ui/Tabs";
import Badge from "@/components/ui/Badge";

type MsgTemplate = { id: number; name: string; type: "文字" | "圖片" | "圖文選單" | "Flex" };
const TEMPLATES: MsgTemplate[] = [
  { id: 1, name: "入住提醒通知", type: "文字" },
  { id: 2, name: "課程開課提醒卡片", type: "Flex" },
];

function TemplateTab() {
  return (
    <div className="space-y-2 text-sm">
      <table className="w-full text-left text-xs">
        <thead className="text-slate-500">
          <tr>
            <th className="px-2 py-1">範本名稱</th>
            <th className="px-2 py-1">類型</th>
            <th className="px-2 py-1">操作</th>
          </tr>
        </thead>
        <tbody>
          {TEMPLATES.map((t) => (
            <tr key={t.id} className="border-t border-slate-100">
              <td className="px-2 py-1.5">{t.name}</td>
              <td className="px-2 py-1.5">
                <Badge color="purple">{t.type}</Badge>
              </td>
              <td className="px-2 py-1.5">
                <button className="text-rose-500 underline">編輯</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button className="rounded bg-rose-500 px-3 py-1.5 text-xs text-white">＋ 新增範本</button>
    </div>
  );
}

function AudienceTab() {
  const [conditions, setConditions] = useState({
    level: false,
    admissionStatus: false,
    admissionRange: false,
    courseEnrollment: false,
  });
  return (
    <div className="space-y-3 text-sm">
      <p className="text-xs text-slate-400">分眾條件轉換為LINE Narrowcast API所需的audience物件。</p>
      <div className="space-y-2 text-xs">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={conditions.level} onChange={(e) => setConditions((c) => ({ ...c, level: e.target.checked }))} />
          會員等級（如VIP/一般客戶）
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={conditions.admissionStatus}
            onChange={(e) => setConditions((c) => ({ ...c, admissionStatus: e.target.checked }))}
          />
          入住狀態（入住中／已退住／孕期）
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={conditions.admissionRange}
            onChange={(e) => setConditions((c) => ({ ...c, admissionRange: e.target.checked }))}
          />
          入住區間（如指定月份入住）
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={conditions.courseEnrollment}
            onChange={(e) => setConditions((c) => ({ ...c, courseEnrollment: e.target.checked }))}
          />
          課程報名狀態（已報名／未報名特定課程）
        </label>
      </div>
      <button className="rounded bg-slate-700 px-3 py-1.5 text-xs text-white">建立/更新 audience 群組</button>
      <p className="text-xs text-slate-400">
        建議提前建立好audience群組，不要每次發送才即時計算（Narrowcast為非同步API）。
      </p>
    </div>
  );
}

type SendRecord = { id: number; template: string; audience: string; time: string; status: string };
const RECORDS: SendRecord[] = [
  { id: 1, template: "入住提醒通知", audience: "本週入住會員", time: "2026-08-27 09:00", status: "已送達" },
];

function ScheduleTab() {
  return (
    <div className="space-y-3 text-sm">
      <div className="rounded border border-slate-200 p-3">
        <div className="mb-2 text-xs font-medium text-slate-600">新增排程</div>
        <div className="grid grid-cols-3 gap-2 text-xs">
          <select className="rounded border border-slate-200 px-2 py-1.5">
            {TEMPLATES.map((t) => (
              <option key={t.id}>{t.name}</option>
            ))}
          </select>
          <input placeholder="受眾群組" className="rounded border border-slate-200 px-2 py-1.5" />
          <input placeholder="發送時間" className="rounded border border-slate-200 px-2 py-1.5" />
        </div>
        <div className="mt-2 flex justify-end">
          <button className="rounded bg-rose-500 px-3 py-1.5 text-xs text-white">建立排程</button>
        </div>
      </div>
      <table className="w-full text-left text-xs">
        <thead className="text-slate-500">
          <tr>
            <th className="px-2 py-1">範本</th>
            <th className="px-2 py-1">受眾</th>
            <th className="px-2 py-1">時間</th>
            <th className="px-2 py-1">狀態</th>
          </tr>
        </thead>
        <tbody>
          {RECORDS.map((r) => (
            <tr key={r.id} className="border-t border-slate-100">
              <td className="px-2 py-1.5">{r.template}</td>
              <td className="px-2 py-1.5">{r.audience}</td>
              <td className="px-2 py-1.5">{r.time}</td>
              <td className="px-2 py-1.5">
                <Badge color="green">{r.status}</Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function BroadcastMessage() {
  return (
    <Tabs
      tabs={[
        { key: "template", label: "訊息範本管理", content: <TemplateTab /> },
        { key: "audience", label: "受眾分眾設定", content: <AudienceTab /> },
        { key: "schedule", label: "發送排程與記錄", content: <ScheduleTab /> },
      ]}
    />
  );
}
