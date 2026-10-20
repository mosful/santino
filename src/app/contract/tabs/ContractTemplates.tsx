"use client";

import { useState } from "react";
import Switch from "@/components/ui/Switch";
import Badge from "@/components/ui/Badge";
import { domainStore, useDomainStore } from "@/lib/demo/domainStore";
import { contractSettingActions } from "@/lib/domain/contractSettings";
import { buttonStyles } from "@/components/ui/buttonStyles";

type Template = {
  id: number;
  name: string;
  version: string;
  active: boolean;
  createdDate: string; clauses: string;
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
  const { data } = useDomainStore(); const templates = data.contractSettings.templates;
  const [message, setMessage] = useState("");
  const [editing, setEditing] = useState<Template | null>(null);

  const editingLocked = !!(editing && templates.find((item) => item.id === editing.id)?.active);
  function run(action: () => void) { try { action(); setMessage("已儲存合約範本設定，已簽快照保留。"); } catch (error) { setMessage(error instanceof Error ? error.message : "儲存失敗。"); } }
  function toggleActive(id: number) { run(() => contractSettingActions.activate(id)); }
  function addTemplate() { run(() => { const id = contractSettingActions.addTemplate(); setEditing(domainStore.get().contractSettings.templates.find((item) => item.id === id)!); }); }
  return (
    <div className="space-y-3 text-sm">{message && <p role="status">{message}</p>}
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
      <button type="button" onClick={addTemplate} className={buttonStyles({ variant: "danger", size: "sm" })}>＋ 新增範本版本</button>

      {editing && (
        <div className="rounded border border-stone-200 p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium text-stone-600">編輯：{editing.name}</span>
            <button onClick={() => setEditing(null)} className="text-xs text-stone-400">
              收合
            </button>
          </div>
          <input aria-label="範本名稱" disabled={editingLocked} value={editing.name} onChange={(event) => setEditing({ ...editing, name: event.target.value })} className="mb-3 w-full rounded border border-stone-200 p-2 text-sm" /><textarea aria-label="範本條文內容" disabled={editingLocked} value={editing.clauses} onChange={(event) => setEditing({ ...editing, clauses: event.target.value })} className="mb-3 h-28 w-full rounded border border-stone-200 p-2 text-sm" /><button type="button" disabled={editingLocked} onClick={() => run(() => contractSettingActions.save(editing.id, editing.name, editing.clauses))} className="mb-3 rounded bg-rose-500 px-3 py-1.5 text-xs text-white disabled:opacity-40">儲存草稿條文</button>{editingLocked && <p className="mb-3 text-xs text-stone-500">啟用中的版本唯讀，請新增草稿版本後再修改。</p>}
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
