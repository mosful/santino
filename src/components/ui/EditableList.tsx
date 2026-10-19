"use client";

import { useState } from "react";
import { Inbox } from "lucide-react";
import Modal from "./Modal";
import Pagination from "./Pagination";
import { useAccess } from "@/lib/roleStore";
import { rowMatchesQuery } from "@/lib/fuzzySearch";

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
  searchPlaceholder = "輸入關鍵字查詢（支援模糊搜尋）",
  rows: controlledRows,
  onSave,
  onDelete,
  editAllowed,
}: {
  moduleNo: string;
  fields: FieldSchema[];
  initialRows: Row[];
  searchPlaceholder?: string;
  rows?: Row[];
  onSave?: (row: Row) => void;
  onDelete?: (id: number) => void;
  editAllowed?: boolean;
}) {
  const access = useAccess(moduleNo);
  const canEdit = editAllowed ?? access === "edit";
  const [rows, setRows] = useState<Row[]>(initialRows);
  const activeRows = controlledRows ?? rows;
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [editing, setEditing] = useState<Row | null>(null);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const filtered = q ? activeRows.filter((r) => rowMatchesQuery(r, q)) : activeRows;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  function openAdd() {
    setError("");
    setEditing({ id: 0 } as Row);
    setDraft(Object.fromEntries(fields.map((f) => [f.key, ""])));
  }

  function openEdit(row: Row) {
    setError("");
    setEditing(row);
    setDraft(Object.fromEntries(fields.map((f) => [f.key, String(row[f.key] ?? "")])));
  }

  function save() {
    if (!editing) return;
    if (onSave) { try { onSave({ id: editing.id, ...draft }); setEditing(null); setError(""); } catch (cause) { setError(cause instanceof Error ? cause.message : "儲存失敗。"); } return; }
    if (editing.id === 0) {
      const newRow = { id: Date.now(), ...draft } as Row;
      setRows((rs) => [...rs, newRow]);
    } else {
      setRows((rs) => rs.map((r) => (r.id === editing.id ? ({ ...r, ...draft } as Row) : r)));
    }
    setEditing(null);
  }

  function remove(id: number) {
    if (onDelete) { try { onDelete(id); setConfirmDeleteId(null); setError(""); } catch (cause) { setError(cause instanceof Error ? cause.message : "刪除失敗。"); } return; }
    setRows((rs) => rs.filter((r) => r.id !== id));
    setConfirmDeleteId(null);
  }

  return (
    <div className="space-y-3">
      {error && <p role="status" className="text-sm text-rose-700">{error}</p>}
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor="editable-list-search" className="sr-only">資料關鍵字查詢</label>
        <input
          id="editable-list-search"
          name="query"
          type="search"
          autoComplete="off"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
          placeholder={searchPlaceholder}
          className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm sm:w-64"
        />
        <span className="text-xs text-stone-400">共 {filtered.length} 筆</span>
        {canEdit ? (
          <button
            onClick={openAdd}
            className="ml-auto rounded-lg bg-gradient-to-r from-brand-500 to-brand-400 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-brand-200 transition-[transform,box-shadow] hover:shadow-md hover:shadow-brand-300 active:scale-[0.98]"
          >
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
            {paged.map((row) => (
              <tr key={row.id} className="border-t border-stone-100 transition-colors hover:bg-stone-50">
                {fields.map((f) => (
                  <td key={f.key} className="px-3 py-2.5">
                    {row[f.key]}
                  </td>
                ))}
                {canEdit && (
                  <td className="whitespace-nowrap px-3 py-2.5">
                    <button onClick={() => openEdit(row)} className="mr-3 text-brand-500 underline">
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
                <td colSpan={fields.length + 1} className="px-3 py-10 text-center text-stone-400">
                  <div className="flex flex-col items-center gap-1.5">
                    <Inbox className="h-6 w-6 text-stone-300" />
                    查無資料
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        page={safePage}
        pageSize={pageSize}
        total={filtered.length}
        onPageChange={setPage}
        onPageSizeChange={(n) => {
          setPageSize(n);
          setPage(1);
        }}
      />

      <Modal open={!!editing} title={editing?.id === 0 ? "新增" : "編輯"} onClose={() => setEditing(null)}>
        <div className="space-y-3">
          {fields.map((f) => {
            const fieldId = `editable-${editing?.id ?? 0}-${f.key}`;
            return (
            <div key={f.key}>
              <label htmlFor={fieldId} className="mb-1 block text-xs text-stone-500">{f.label}</label>
              {f.type === "select" ? (
                <select
                  id={fieldId}
                  name={f.key}
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
                  id={fieldId}
                  name={f.key}
                  type={f.type === "number" ? "number" : "text"}
                  value={draft[f.key] ?? ""}
                  onChange={(e) => setDraft((d) => ({ ...d, [f.key]: e.target.value }))}
                  className="w-full rounded-lg border border-stone-200 px-2 py-1.5 text-sm"
                />
              )}
            </div>
          );})}
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setEditing(null)} className="rounded-lg bg-stone-100 px-4 py-2 text-xs">
              取消
            </button>
            <button onClick={save} className="rounded-lg bg-brand-500 px-4 py-2 text-xs text-white">
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
