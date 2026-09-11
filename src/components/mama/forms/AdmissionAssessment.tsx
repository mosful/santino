"use client";

import { useState } from "react";
import PhrasePicker from "@/components/phrases/PhrasePicker";
import PrototypeFormActions from "@/components/ui/PrototypeFormActions";
import {
  ASSESSMENT_SECTIONS,
  useAssessmentFields,
  type AssessmentField,
} from "@/lib/assessmentConfigStore";

function DynamicField({ field }: { field: AssessmentField }) {
  const [text, setText] = useState("");
  const [selected, setSelected] = useState<string[]>([]);

  function toggle(option: string) {
    setSelected((values) => values.includes(option) ? values.filter((item) => item !== option) : [...values, option]);
  }

  return (
    <div className={field.type === "textarea" || field.type === "multiple" ? "md:col-span-2" : ""}>
      <div className="mb-1 flex items-center justify-between gap-2">
        <label className="text-xs font-medium text-stone-600">
          {field.label}{field.required && <span className="ml-1 text-rose-500">＊</span>}
        </label>
        {field.type === "textarea" && <PhrasePicker onInsert={(value) => setText((current) => current ? `${current}\n${value}` : value)} />}
      </div>
      {field.type === "textarea" ? (
        <textarea value={text} onChange={(event) => setText(event.target.value)} className="h-24 w-full rounded-lg border border-stone-200 p-2 text-sm" placeholder={`請填寫${field.label}`} />
      ) : field.type === "single" ? (
        <div className="flex min-h-10 flex-wrap items-center gap-2">
          {field.options.map((option) => (
            <label key={option} className="flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs">
              <input type="radio" name={field.id} value={option} />{option}
            </label>
          ))}
        </div>
      ) : field.type === "multiple" ? (
        <div className="flex min-h-10 flex-wrap items-center gap-2">
          {field.options.map((option) => (
            <label key={option} className="flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs">
              <input type="checkbox" checked={selected.includes(option)} onChange={() => toggle(option)} />{option}
            </label>
          ))}
        </div>
      ) : field.type === "select" ? (
        <select className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm" defaultValue="">
          <option value="" disabled>請選擇</option>
          {field.options.map((option) => <option key={option}>{option}</option>)}
        </select>
      ) : (
        <input value={text} onChange={(event) => setText(event.target.value)} className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm" placeholder={`請填寫${field.label}`} />
      )}
    </div>
  );
}

export default function AdmissionAssessment({ room }: { room: string }) {
  const fields = useAssessmentFields();

  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-sky-50 px-3 py-2 text-xs text-sky-700">
        房號 {room}｜入住評估表由後台題目設定即時產生；區段格式可不同，不強制切成分頁。
      </div>
      {ASSESSMENT_SECTIONS.map((section) => {
        const sectionFields = fields.filter((field) => field.section === section);
        if (sectionFields.length === 0) return null;
        return (
          <section key={section} className="rounded-xl border border-stone-200 bg-white p-4">
            <div className="mb-3 flex items-center justify-between border-b border-stone-100 pb-2">
              <h3 className="font-medium text-stone-700">{section}</h3>
              <span className="text-xs text-stone-400">{sectionFields.length} 項</span>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {sectionFields.map((field) => <DynamicField key={field.id} field={field} />)}
            </div>
          </section>
        );
      })}
      <PrototypeFormActions accent="rose" />
    </div>
  );
}
