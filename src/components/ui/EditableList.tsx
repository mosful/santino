"use client";

import { useState } from "react";
import Modal from "./Modal";
import { useAccess } from "@/lib/roleStore";

export type FieldSchema = {
  key: string;
  label: string;
  type?: "text" | "number" | "select";
  options?: string[];
};

export type Row = Record<string, string | number> & { id: number };

export default function EditableList({
  moduleNo,
  fields,
  initialRows,
  searchPlaceholder = "輸入關鍵字查詢",
}: {
  moduleNo: string;
  fields: FieldSchema[];
  initialRows: Row[];
  searchPlaceholder?: string;
}) {
  const access = useAccess(moduleNo);
  const canEdit = access === "edit";
  const [rows, setRows] = useState<Row[]>(initialRows);
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Row | null>(null);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const filtered = q
    ? rows.filter((r) => Object.values(r).some((v) => String(v).toLowerCase().includes(q.toLowerCase())))
    : rows;

  function openAdd() {
    setEditing({ id: 0 } as Row);
    setDraft(Object.fromEntries(fields.map((f) => [f.key, ""])));
  }

  function openEdit(row: Row) {
    setEditing(row);
    setDraft(Object.fromEntries(fields.map((f) => [f.key, String(row[f.key] ?? "")])));
  }

  function save() {
    if (!editing) return;
    if (editing.id === 0) {
      const newRow = { id: Date.now(), ...draft } as Row;
      setRows((rs) => [...rs, newRow]);
    } else {
      setRows((rs) => rs.map((r) => (r.id === editing.id ? ({ ...r, ...draft } as Row) : r)));
    }
    setEditing(null);
  }

  function remove(id: number) {
    setRows((rs) => rs.filter((r) => r.id !== id));
    setConfirmDeleteId(null);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm sm:w-64"
        />
        <span className="text-xs text-stone-400">共 {filtered.length} 筆</span>
        {canEdit ? (
          <button onClick={openAdd} className="ml-auto rounded-lg bg-rose-500 px-4 py-2 text-sm font-medium text-white hover:bg-rose-600">
            ＋ 新增
          </button>
        ) : (
          <span className="ml-auto rounded-full bg-stone-100 px-3 py-1 text-xs text-stone-400">
            {access === "view" ? "唯讀權限，無法新增/修改/刪除" : "無存取權限"}
          </span>
        )}
      </div>

      <div className="scroll-fade overflow-x-auto rounded-xl border border-stone-200 bg-white">
        <table className="w-full min-w-max text-left text-sm">
          <thead className="bg-stone-50 text-xs text-stone-500">
            <tr>
              {fields.map((f) => (
                <th key={f.key} className="whitespace-nowrap px-3 py-2.5 font-medium">
                  {f.label}
                </th>
              ))}
              {canEdit && <th className="px-3 py-2.5 font-medium">操作</th>}
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <tr key={row.id} className="border-t border-stone-100">
                {fields.map((f) => (
                  <td key={f.key} className="px-3 py-2.5">
                    {row[f.key]}
                  </td>
                ))}
                {canEdit && (
                  <td className="whitespace-nowrap px-3 py-2.5">
                    <button onClick={() => openEdit(row)} className="mr-3 text-rose-500 underline">
                      編輯
                    </button>
                    <button onClick={() => setConfirmDeleteId(row.id)} className="text-stone-400 underline">
                      刪除
                    </button>
                  </td>
                )}
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={fields.length + 1} className="px-3 py-8 text-center text-stone-400">
                  查無資料
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal open={!!editing} title={editing?.id === 0 ? "新增" : "編輯"} onClose={() => setEditing(null)}>
        <div className="space-y-3">
          {fields.map((f) => (
            <div key={f.key}>
              <label className="mb-1 block text-xs text-stone-500">{f.label}</label>
              {f.type === "select" ? (
                <select
                  value={draft[f.key] ?? ""}
                  onChange={(e) => setDraft((d) => ({ ...d, [f.key]: e.target.value }))}
                  className="w-full rounded-lg border border-stone-200 px-2 py-1.5 text-sm"
                >
                  {(f.options ?? []).map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              ) : (
                <input
                  type={f.type === "number" ? "number" : "text"}
                  value={draft[f.key] ?? ""}
                  onChange={(e) => setDraft((d) => ({ ...d, [f.key]: e.target.value }))}
                  className="w-full rounded-lg border border-stone-200 px-2 py-1.5 text-sm"
                />
              )}
            </div>
          ))}
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setEditing(null)} className="rounded-lg bg-stone-100 px-4 py-2 text-xs">
              取消
            </button>
            <button onClick={save} className="rounded-lg bg-rose-500 px-4 py-2 text-xs text-white">
              儲存
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={confirmDeleteId !== null} title="確認刪除" onClose={() => setConfirmDeleteId(null)}>
        <p className="text-sm text-stone-600">確定要刪除這筆資料嗎？此動作無法復原。</p>
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={() => setConfirmDeleteId(null)} className="rounded-lg bg-stone-100 px-4 py-2 text-xs">
            取消
          </button>
          <button
            onClick={() => confirmDeleteId !== null && remove(confirmDeleteId)}
            className="rounded-lg bg-rose-600 px-4 py-2 text-xs text-white"
          >
            確定刪除
          </button>
        </div>
      </Modal>
    </div>
  );
}
