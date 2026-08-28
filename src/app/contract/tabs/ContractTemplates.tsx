"use client";

import { useState } from "react";
import Switch from "@/components/ui/Switch";
import Badge from "@/components/ui/Badge";

type Template = {
  id: number;
  name: string;
  version: string;
  active: boolean;
  createdDate: string;
};

const CLAUSES = [
  "第一條 定義",
  "第二條 進住日期",
  "第三條 收費標準",
  "第四條 猶豫期（審閱期）",
  "第五條 退費規定",
  "……（共21條，完整內容另見合約條款檢視頁）",
];

export default function ContractTemplates() {
  const [templates, setTemplates] = useState<Template[]>([
    { id: 1, name: "標準21條範本 v2", version: "v2", active: true, createdDate: "2026-06-01" },
    { id: 2, name: "標準21條範本 v1（疫情訪客限制版）", version: "v1", active: false, createdDate: "2025-05-10" },
  ]);
  const [editing, setEditing] = useState<Template | null>(null);

  function toggleActive(id: number) {
    setTemplates((ts) =>
      ts.map((t) => (t.id === id ? { ...t, active: !t.active } : t))
    );
  }

  return (
    <div className="space-y-3 text-sm">
      <p className="text-xs text-stone-400">
        維護標準21條條款範本，供新增合約套用，支援版本管理；同時間僅一個版本可為「啟用中」，
        新客戶簽署一律套用啟用中版本，不影響已簽署的舊客戶。
      </p>
      <table className="w-full text-left text-sm">
        <thead className="bg-stone-50 text-xs text-stone-500">
          <tr>
            <th className="px-3 py-2">範本名稱</th>
            <th className="px-3 py-2">版本</th>
            <th className="px-3 py-2">建立日期</th>
            <th className="px-3 py-2">啟用中</th>
            <th className="px-3 py-2">操作</th>
          </tr>
        </thead>
        <tbody>
          {templates.map((t) => (
            <tr key={t.id} className="border-t border-stone-100">
              <td className="px-3 py-2">{t.name}</td>
              <td className="px-3 py-2">
                <Badge color="slate">{t.version}</Badge>
              </td>
              <td className="px-3 py-2">{t.createdDate}</td>
              <td className="px-3 py-2">
                <Switch checked={t.active} onChange={() => toggleActive(t.id)} />
              </td>
              <td className="px-3 py-2">
                <button onClick={() => setEditing(t)} className="text-rose-500 underline">
                  編輯條款
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button className="rounded bg-rose-500 px-3 py-1.5 text-xs text-white">＋ 新增範本版本</button>

      {editing && (
        <div className="rounded border border-stone-200 p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium text-stone-600">編輯：{editing.name}</span>
            <button onClick={() => setEditing(null)} className="text-xs text-stone-400">
              收合
            </button>
          </div>
          <ul className="space-y-1 text-xs text-stone-600">
            {CLAUSES.map((c) => (
              <li key={c} className="rounded border border-stone-100 px-2 py-1.5">
                {c}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
