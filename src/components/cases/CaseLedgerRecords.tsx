"use client";

import { useState } from "react";
import type { CaseRecord } from "@/lib/domain/types";
import { taipeiTimestamp } from "@/lib/care/rules";
import { buttonStyles } from "@/components/ui/buttonStyles";

type Entry = CaseRecord["ledger"][number];

/** 費用與合約變更使用原帳本，避免畫面另外保存一份不同步的明細。 */
export default function CaseLedgerRecords({ record, editable, manager, onEditCharge, onEditChange }: {
  record: CaseRecord; editable: boolean; manager: boolean;
  onEditCharge: (entry: Entry) => void; onEditChange: (entry: Entry) => void;
}) {
  const [sort, setSort] = useState<{ key: "date" | "label" | "amount"; ascending: boolean }>({ key: "date", ascending: false });
  function heading(key: typeof sort.key, label: string) {
    return <th className="p-2" aria-sort={sort.key === key ? sort.ascending ? "ascending" : "descending" : "none"}>
      <button type="button" className={buttonStyles({ variant: "ghost", size: "sm" })} onClick={() => setSort({ key, ascending: sort.key === key ? !sort.ascending : true })}>{label} {sort.key === key ? sort.ascending ? "↑" : "↓" : "↕"}</button>
    </th>;
  }
  const entries = [...record.ledger].sort((a, b) => {
    const compared = sort.key === "amount" ? a.amount - b.amount : sort.key === "date" ? a.date.localeCompare(b.date) || (a.at ?? "").localeCompare(b.at ?? "") : a.label.localeCompare(b.label, "zh-Hant");
    return sort.ascending ? compared : -compared;
  });
  function editAction(entry: Entry) {
    if (!editable) return null;
    const change = entry.kind === "contract-change" || entry.label.startsWith("合約變更");
    const charge = (entry.kind === "charge" || !!entry.category) && entry.before === undefined && !entry.adjustsId;
    return change ? manager ? <button type="button" className={buttonStyles({ size: "sm" })} onClick={() => onEditChange(entry)}>修改變更單</button> : <span className="text-xs text-stone-600">主管可修改</span> : charge ? <button type="button" className={buttonStyles({ size: "sm" })} onClick={() => onEditCharge(entry)}>修改費用</button> : <span className="text-xs text-stone-600">由原單據調整</span>;
  }
  return <section id="case-ledger" className="space-y-3" aria-label="費用與合約變更明細">
    <div className="flex flex-wrap items-baseline justify-between gap-2"><h3 className="font-semibold">費用與合約變更明細</h3><span className="text-sm text-stone-600">共 {entries.length} 筆</span></div>
    <p className="text-sm text-stone-600">費用可修改原筆；合約變更以修訂單保留前次內容，帳務只計新差額。</p>
    <ul className="divide-y divide-stone-200 sm:hidden">{entries.map((entry) => <li key={entry.id} className="space-y-2 py-4 text-sm">
      <div className="flex flex-wrap justify-between gap-2 tabular-nums"><span className="text-stone-600">{entry.date}</span><strong>{entry.amount.toLocaleString("zh-TW")} 元</strong></div>
      <p className="break-words">{entry.label}</p>
      {entry.qty !== undefined && <p className="text-xs text-stone-600">{entry.category}・數量 {entry.qty}{entry.unitPrice !== undefined ? `・單價 ${entry.unitPrice.toLocaleString("zh-TW")} 元` : ""}</p>}
      {entry.before !== undefined && <p className="text-xs text-stone-600">變更前 {entry.before.toLocaleString("zh-TW")} → 變更後 {entry.after?.toLocaleString("zh-TW")} 元</p>}
      {record.ledger.some((item) => item.revisesId === entry.id) && <p className="text-xs text-stone-600">已有後續修訂單</p>}
      {entry.revisesId && <p className="text-xs text-stone-600">修訂前次變更單</p>}
      <p className="text-xs leading-6 text-stone-600">{entry.at ? taipeiTimestamp(entry.at) : "未記錄時間"}・{entry.actor ?? "—"}</p>
      {editAction(entry)}
    </li>)}{!entries.length && <li className="py-4 text-sm text-stone-600">尚無新增費用或合約變更，儲存後會顯示在此處。</li>}</ul>
    <div className="hidden overflow-x-auto sm:block">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead><tr className="border-b border-stone-200">{heading("date", "計費日期")}{heading("label", "項目／變更內容")}{heading("amount", "金額")}<th className="p-2">登錄時間／經辦</th>{editable && <th className="p-2">操作</th>}</tr></thead>
        <tbody>{entries.map((entry) => {
          const revised = record.ledger.some((item) => item.revisesId === entry.id);
          return <tr key={entry.id} className="border-b border-stone-100 align-top">
            <td className="whitespace-nowrap p-2 tabular-nums">{entry.date}</td>
            <td className="p-2"><p className="max-w-xl break-words">{entry.label}</p>{entry.qty !== undefined && <p className="mt-1 text-xs text-stone-600">{entry.category}・數量 {entry.qty}{entry.unitPrice !== undefined ? `・單價 ${entry.unitPrice.toLocaleString("zh-TW")} 元` : ""}</p>}{entry.before !== undefined && <p className="mt-1 text-xs text-stone-600">變更前 {entry.before.toLocaleString("zh-TW")} → 變更後 {entry.after?.toLocaleString("zh-TW")} 元</p>}{revised && <p className="mt-1 text-xs text-stone-600">已有後續修訂單</p>}{entry.revisesId && <p className="mt-1 text-xs text-stone-600">修訂前次變更單</p>}</td>
            <td className="whitespace-nowrap p-2 text-right tabular-nums">{entry.amount.toLocaleString("zh-TW")} 元</td>
            <td className="p-2 text-xs text-stone-600"><p className="whitespace-nowrap">{entry.at ? taipeiTimestamp(entry.at) : "未記錄時間"}</p><p className="mt-1">{entry.actor ?? "—"}</p></td>
            {editable && <td className="p-2">{editAction(entry)}</td>}
          </tr>;
        })}{!entries.length && <tr><td colSpan={editable ? 5 : 4} className="p-6 text-center text-stone-600">尚無新增費用或合約變更，儲存後會顯示在此處。</td></tr>}</tbody>
      </table>
    </div>
  </section>;
}
