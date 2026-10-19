"use client";

import type { CareForm, CareKind, CareSubject } from "@/lib/care/types";
import { backfillDeadline, isBackfillExpired, taipeiTimestamp } from "@/lib/care/rules";
import styles from "./CareWorkspace.module.css";

/**
 * 照護對象的清單檢視：與卡片檢視顯示同一組資料與同一組表單按鈕，
 * 差別在欄位對齊、一列一位，適合一次掃過整館。狀態底色沿用卡片的色彩語意。
 */
export default function CareSubjectTable({
  subjects,
  kind,
  forms,
  backfillDays,
  onOpen,
  caption,
}: {
  subjects: CareSubject[];
  kind: CareKind;
  forms: CareForm[];
  backfillDays: number;
  onOpen: (subjectId: string, formKey: string) => void;
  caption: string;
}) {
  return (
    <div className="scroll-fade overflow-x-auto rounded-xl border border-border-subtle bg-surface-raised">
      <table className="w-full min-w-[920px] text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-stone-200 text-xs text-stone-500">
            <th scope="col" className="px-3 py-2 font-medium">{kind === "mama" ? "房號" : "房號／車號"}</th>
            <th scope="col" className="px-3 py-2 font-medium">姓名</th>
            {kind === "baby" && <th scope="col" className="px-3 py-2 font-medium">媽媽</th>}
            <th scope="col" className="px-3 py-2 font-medium">狀態</th>
            <th scope="col" className="px-3 py-2 font-medium">病歷號</th>
            <th scope="col" className="px-3 py-2 font-medium">住房天數</th>
            <th scope="col" className="px-3 py-2 font-medium">表單</th>
          </tr>
        </thead>
        <tbody>
          {subjects.map((item) => {
            const deadline = item.historical ? backfillDeadline(item, backfillDays) : null;
            return (
              <tr
                key={item.id}
                data-status={item.historical ? "退房回補" : item.status}
                className={`${styles.subjectRow} border-b border-stone-100 last:border-b-0`}
              >
                <td className="whitespace-nowrap px-3 py-2 font-semibold">
                  {item.room ? `房 ${item.room}` : `車 ${item.carNo || "待指派"}`}
                  {item.room && item.carNo && <span className="ml-1 text-xs font-normal text-stone-500">車 {item.carNo}</span>}
                </td>
                <td className="whitespace-nowrap px-3 py-2 font-medium">{item.name}</td>
                {kind === "baby" && <td className="whitespace-nowrap px-3 py-2 text-stone-600">{item.motherName}</td>}
                <td className="whitespace-nowrap px-3 py-2">
                  <span className={`${styles.status} inline-block text-xs`}>{item.historical ? "退房回補" : item.status}</span>
                </td>
                <td className="whitespace-nowrap px-3 py-2 tabular-nums text-stone-600">{item.chartNo}</td>
                <td className="whitespace-nowrap px-3 py-2 tabular-nums text-stone-600">
                  第 {item.stayDay} 天
                  {deadline && (
                    <span className="ml-2 text-xs text-amber-900">
                      可補至 {taipeiTimestamp(deadline)}
                      {isBackfillExpired(item, backfillDays) ? "（逾期需授權）" : ""}
                    </span>
                  )}
                </td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-1.5">
                    {forms.map((itemForm) => (
                      <button
                        key={itemForm.key}
                        type="button"
                        onClick={() => onOpen(item.id, itemForm.key)}
                        className={`${styles.rowAction} whitespace-nowrap rounded-lg border border-stone-200 bg-surface-raised px-2.5 text-xs font-medium text-stone-600 transition-[border-color,background-color,color] hover:border-brand-300 hover:bg-brand-50 hover:text-brand-600`}
                      >
                        {itemForm.label}
                      </button>
                    ))}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
