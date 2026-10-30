"use client";

import { useState } from "react";
import { Toast, useToast } from "@/components/ui/Toast";
import { X } from "lucide-react";
import { caseActions, useDomainStore } from "@/lib/demo/domainStore";
import { hospitalOptions } from "@/lib/domain/options";
import { docValues, type CaseDoc } from "@/lib/domain/caseDocs";
import type { CaseRecord } from "@/lib/domain/types";
import { buttonStyles } from "@/components/ui/buttonStyles";
import { taipeiTimestamp } from "@/lib/care/rules";

const input = "min-h-12 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm";
const button = buttonStyles();

/**
 * 櫃台單據的填寫面板（入住前關懷表單、三張入住前通知單、繳款通知單、中醫調查單、兒科諮詢單）。
 *
 * ⚠️ 不要再把七張單一字排開列在階段下方：客戶 2026-10-22 回報版面太長，
 * 入口改掛在「入住前時間軸」每一列右邊的文字連結上，點了才就地展開這個面板。
 * 欄位定義一律在 lib/domain/caseDocs.ts，這裡只負責畫與存。
 */
export function CaseDocPanel({ record, doc, editable, onClose }: { record: CaseRecord; doc: CaseDoc; editable: boolean; onClose: () => void }) {
  const { data } = useDomainStore();
  const saved = record.documents?.[doc.key];
  const [values, setValues] = useState<Record<string, string>>(() => docValues(record, doc));
  const [toast, toastProps] = useToast();
  function set(key: string, value: string) { setValues((current) => ({ ...current, [key]: value })); }
  function toggle(key: string, option: string) {
    const picked = (values[key] ?? "").split("、").filter(Boolean);
    const next = picked.includes(option) ? picked.filter((item) => item !== option) : [...picked, option];
    set(key, next.join("、"));
  }
  return (
    <section className="mt-2 space-y-4 rounded-xl border border-brand-200 bg-brand-50/40 p-4" aria-label={doc.label}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h4 className="font-semibold">{doc.label}</h4>
          <p className="mt-1 text-sm text-stone-600">{doc.hint}{saved ? `　最後儲存：${taipeiTimestamp(saved.savedAt)}｜${saved.actor}` : ""}</p>
        </div>
        <button type="button" className={buttonStyles({ size: "sm" })} onClick={onClose} aria-label={`收起${doc.label}`}>
          <X className="h-3.5 w-3.5" aria-hidden="true" />
          收起
        </button>
      </div>
      {doc.sections.map((section) => (
        <section key={section.label} className="space-y-3">
          <h5 className="font-medium">{section.label}</h5>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {section.fields.map((field) => {
              const value = values[field.key] ?? "";
              // 生產醫院的選項是主檔不是定義：櫃台在新增預約加的院所，這裡也要看得到。
              const options = field.key === "hospital" && field.type === "select" ? hospitalOptions(data.hospitals) : field.options ?? [];
              const span = field.wide || field.type === "textarea" || field.type === "multiple" ? "sm:col-span-2 xl:col-span-3" : "";
              if (field.type === "multiple") {
                const picked = value.split("、").filter(Boolean);
                return (
                  <fieldset key={field.key} className={`${span} space-y-2 text-sm`}>
                    <legend>{field.label}</legend>
                    <div className="flex flex-wrap gap-2">
                      {options.map((option) => (
                        <label key={option} className="flex min-h-12 items-center gap-2 rounded-lg border border-stone-200 bg-white px-3">
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
                      {options.map((option) => <option key={option}>{option}</option>)}
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
              try { caseActions.saveDocument(record.id, doc.key, values); toast.ok("已儲存，並勾選對應的時間軸項目。"); }
              catch (error) { toast.fail(error instanceof Error ? error.message : "儲存失敗。"); }
            }}
          >
            儲存{doc.label}
          </button>
        )}
        <button type="button" className={button} onClick={() => window.print()}>列印</button>
        {editable && <button type="button" className={button} onClick={() => { setValues(doc.prefill(record)); toast.ok("已重新帶入案件資料。"); }}>重新帶入案件資料</button>}
        <Toast {...toastProps} />
      </div>
    </section>
  );
}

/** 一列文字連結：點了就地展開單據，再點一次收起。 */
export function CaseDocLinks({ record, docs, editable }: { record: CaseRecord; docs: CaseDoc[]; editable: boolean }) {
  const [openKey, setOpenKey] = useState("");
  const open = docs.find((doc) => doc.key === openKey);
  if (!docs.length) return null;
  return (
    <>
      <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
        {docs.map((doc) => (
          <button
            key={doc.key}
            type="button"
            className={`text-sm underline underline-offset-2 ${openKey === doc.key ? "font-semibold text-brand-700" : "text-brand-600 hover:text-brand-700"}`}
            onClick={() => setOpenKey(openKey === doc.key ? "" : doc.key)}
          >
            {doc.label}
            {record.documents?.[doc.key] ? "（已填）" : ""}
          </button>
        ))}
      </span>
      {open && <CaseDocPanel key={`${record.id}-${open.key}`} record={record} doc={open} editable={editable} onClose={() => setOpenKey("")} />}
    </>
  );
}
