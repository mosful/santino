"use client";

import { useState } from "react";
import { caseActions } from "@/lib/demo/domainStore";
import { CASE_DOCS, docValues, type CaseDoc } from "@/lib/domain/caseDocs";
import type { CaseRecord } from "@/lib/domain/types";
import CollapsibleSection from "@/components/ui/CollapsibleSection";
import { buttonStyles } from "@/components/ui/buttonStyles";
import { taipeiTimestamp } from "@/lib/care/rules";

const input = "min-h-12 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm";
const button = buttonStyles();

/**
 * 櫃台單據區（入住前關懷表單、入住餐飲／嬰兒室／保全三張通知單、繳款通知單）。
 *
 * ⚠️ 這些以前只是入住前時間軸上的一個勾選＋一顆印出空白頁的按鈕，
 * 現在是可填、可存、可印的單據；欄位定義在 lib/domain/caseDocs.ts，這裡只負責畫。
 * 存檔會自動把時間軸對應項目打勾，不要再讓櫃台手動勾一次。
 */
function DocForm({ record, doc, editable }: { record: CaseRecord; doc: CaseDoc; editable: boolean }) {
  const saved = record.documents?.[doc.key];
  const [values, setValues] = useState<Record<string, string>>(() => docValues(record, doc));
  const [message, setMessage] = useState("");
  function set(key: string, value: string) { setValues((current) => ({ ...current, [key]: value })); }
  function toggle(key: string, option: string) {
    const picked = (values[key] ?? "").split("、").filter(Boolean);
    const next = picked.includes(option) ? picked.filter((item) => item !== option) : [...picked, option];
    set(key, next.join("、"));
  }
  return (
    <CollapsibleSection
      id={`case-doc-${doc.key}`}
      title={doc.label}
      summary={saved ? `已填寫 ${taipeiTimestamp(saved.savedAt)}` : "尚未填寫"}
      bodyClassName="space-y-4"
    >
      <p className="text-sm text-stone-600">{doc.hint}{saved ? `　最後儲存：${saved.actor}` : ""}</p>
      {doc.sections.map((section) => (
        <section key={section.label} className="space-y-3">
          <h4 className="font-medium">{section.label}</h4>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {section.fields.map((field) => {
              const value = values[field.key] ?? "";
              const span = field.wide || field.type === "textarea" || field.type === "multiple" ? "sm:col-span-2 xl:col-span-3" : "";
              if (field.type === "multiple") {
                const picked = value.split("、").filter(Boolean);
                return (
                  <fieldset key={field.key} className={`${span} space-y-2 text-sm`}>
                    <legend>{field.label}</legend>
                    <div className="flex flex-wrap gap-2">
                      {(field.options ?? []).map((option) => (
                        <label key={option} className="flex min-h-12 items-center gap-2 rounded-lg border border-stone-200 px-3">
                          <input type="checkbox" disabled={!editable} checked={picked.includes(option)} onChange={() => toggle(field.key, option)} />
                          {option}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                );
              }
              return (
                <label key={field.key} className={`${span} block space-y-2 text-sm`}>
                  <span>{field.label}</span>
                  {field.type === "select" ? (
                    <select aria-label={field.label} disabled={!editable} className={input} value={value} onChange={(event) => set(field.key, event.target.value)}>
                      <option value="">請選擇</option>
                      {(field.options ?? []).map((option) => <option key={option}>{option}</option>)}
                    </select>
                  ) : field.type === "textarea" ? (
                    <textarea aria-label={field.label} disabled={!editable} className={input} value={value} onChange={(event) => set(field.key, event.target.value)} />
                  ) : (
                    <input aria-label={field.label} type={field.type === "number" ? "number" : field.type === "date" ? "date" : field.type === "time" ? "time" : "text"} disabled={!editable} className={input} value={value} onChange={(event) => set(field.key, event.target.value)} />
                  )}
                </label>
              );
            })}
          </div>
        </section>
      ))}
      <div className="flex flex-wrap items-center gap-2">
        {editable && (
          <button
            type="button"
            className={buttonStyles({ variant: "primary" })}
            onClick={() => {
              try { caseActions.saveDocument(record.id, doc.key, values); setMessage("已儲存，並勾選入住前時間軸對應項目。"); }
              catch (error) { setMessage(error instanceof Error ? error.message : "儲存失敗。"); }
            }}
          >
            儲存{doc.label}
          </button>
        )}
        <button type="button" className={button} onClick={() => window.print()}>列印</button>
        {editable && <button type="button" className={button} onClick={() => { setValues(doc.prefill(record)); setMessage("已重新帶入案件資料。"); }}>重新帶入案件資料</button>}
        <p role="status" className="text-sm">{message}</p>
      </div>
    </CollapsibleSection>
  );
}

export default function CaseDocs({ record, editable }: { record: CaseRecord; editable: boolean }) {
  return (
    <section className="space-y-3" aria-label="櫃台單據">
      <h3 className="font-medium">櫃台單據</h3>
      <p className="text-sm text-stone-600">欄位會從案件自動帶入（開發總則第 3 條），填完儲存即完成對應的時間軸項目。</p>
      {CASE_DOCS.map((doc) => <DocForm key={`${record.id}-${doc.key}`} record={record} doc={doc} editable={editable} />)}
    </section>
  );
}
