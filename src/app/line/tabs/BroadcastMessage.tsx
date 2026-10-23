"use client";

import { useState } from "react";
import Tabs from "@/components/ui/Tabs";
import Badge from "@/components/ui/Badge";
import DemoActionButton from "@/components/ui/DemoActionButton";
import { FormSection, ResultCard, SummaryRow, WorkArea } from "@/components/ui/Workspace";

type MsgTemplate = { id: number; name: string; type: "文字" | "圖片" | "圖文選單" | "Flex" };
const TEMPLATES: MsgTemplate[] = [
  { id: 1, name: "入住提醒通知", type: "文字" },
  { id: 2, name: "課程開課提醒卡片", type: "Flex" },
];

function TemplateTab() {
  return (
    <div className="query-panel space-y-4 text-sm">
      <div className="overflow-x-auto"><table className="w-full min-w-[480px] text-left text-xs">
        <thead className="text-stone-500">
          <tr>
            <th className="px-2 py-1">範本名稱</th>
            <th className="px-2 py-1">類型</th>
            <th className="px-2 py-1">操作</th>
          </tr>
        </thead>
        <tbody>
          {TEMPLATES.map((t) => (
            <tr key={t.id} className="border-t border-stone-100">
              <td className="px-2 py-1.5">{t.name}</td>
              <td className="px-2 py-1.5">
                <Badge color="purple">{t.type}</Badge>
              </td>
              <td className="px-2 py-1.5">
                <DemoActionButton feedback={`已開啟「${t.name}」範本編輯器（Demo 模式）`} variant="link" size="sm">編輯</DemoActionButton>
              </td>
            </tr>
          ))}
        </tbody>
      </table></div>
      <DemoActionButton feedback="已建立一筆訊息範本草稿" variant="primary" size="sm">＋ 新增範本</DemoActionButton>
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
    <FormSection title="建立受眾群組" description="勾選要套用的分眾條件，建立供排程使用的 audience 群組。" className="text-sm">
      <p className="text-xs text-stone-400">分眾條件轉換為LINE Narrowcast API所需的audience物件。</p>
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
      <DemoActionButton feedback="Audience 群組條件已更新（Demo 模式不呼叫 LINE API）" variant="primary" size="sm">建立/更新 audience 群組</DemoActionButton>
      <p className="text-xs text-stone-400">
        建議提前建立好audience群組，不要每次發送才即時計算（Narrowcast為非同步API）。
      </p>
    </FormSection>
  );
}

type SendRecord = { id: number; template: string; audience: string; time: string; status: string };
const RECORDS: SendRecord[] = [
  { id: 1, template: "入住提醒通知", audience: "本週入住會員", time: "2026-08-27 09:00", status: "已送達" },
];

function ScheduleTab() {
  return (
    <WorkArea aside={<ResultCard title="排程摘要" value={`${RECORDS.length} 筆`} description="目前已建立的發送排程"><SummaryRow label="最近一次" value={RECORDS[0].time} /><SummaryRow label="狀態" value={RECORDS[0].status} /></ResultCard>}>
      <FormSection title="新增排程" description="選擇訊息範本、受眾與預定發送時間。" className="text-sm">
        <div className="form-grid text-xs">
          <label className="space-y-2 text-stone-600">訊息範本<select className="w-full rounded border border-stone-200 px-2 py-1.5">
            {TEMPLATES.map((t) => (
              <option key={t.id}>{t.name}</option>
            ))}
          </select></label>
          <label className="space-y-2 text-stone-600">受眾群組<input placeholder="例如：本週入住會員" className="w-full rounded border border-stone-200 px-2 py-1.5" /></label>
          <label className="space-y-2 text-stone-600">發送時間<input type="datetime-local" className="w-full rounded border border-stone-200 px-2 py-1.5" /></label>
        </div>
        <div className="form-actions justify-end">
          <DemoActionButton feedback="訊息排程草稿已建立（Demo 模式不發送訊息）" variant="primary" size="sm">建立排程</DemoActionButton>
        </div>
      </FormSection>
      <div className="query-panel overflow-x-auto"><table className="w-full min-w-[540px] text-left text-xs">
        <thead className="text-stone-500">
          <tr>
            <th className="px-2 py-1">範本</th>
            <th className="px-2 py-1">受眾</th>
            <th className="px-2 py-1">時間</th>
            <th className="px-2 py-1">狀態</th>
          </tr>
        </thead>
        <tbody>
          {RECORDS.map((r) => (
            <tr key={r.id} className="border-t border-stone-100">
              <td className="px-2 py-1.5">{r.template}</td>
              <td className="px-2 py-1.5">{r.audience}</td>
              <td className="px-2 py-1.5">{r.time}</td>
              <td className="px-2 py-1.5">
                <Badge color="green">{r.status}</Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table></div>
    </WorkArea>
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
