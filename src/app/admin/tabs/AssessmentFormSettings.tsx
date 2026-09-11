"use client";

import { useState } from "react";
import { Plus, RotateCcw, Trash2 } from "lucide-react";
import {
  ASSESSMENT_SECTIONS,
  addAssessmentField,
  removeAssessmentField,
  resetAssessmentFields,
  updateAssessmentField,
  useAssessmentFields,
  type AssessmentFieldType,
} from "@/lib/assessmentConfigStore";

const FIELD_TYPES: { value: AssessmentFieldType; label: string }[] = [
  { value: "text", label: "單行文字" },
  { value: "textarea", label: "多行文字／特殊字" },
  { value: "single", label: "單選" },
  { value: "multiple", label: "複選" },
  { value: "select", label: "下拉選單" },
];

function parseOptions(value: string) {
  return value.split(/[,，、]/).map((item) => item.trim()).filter(Boolean);
}

export default function AssessmentFormSettings() {
  const fields = useAssessmentFields();
  const [section, setSection] = useState(ASSESSMENT_SECTIONS[0]);
  const [label, setLabel] = useState("");
  const [type, setType] = useState<AssessmentFieldType>("text");
  const [options, setOptions] = useState("");

  function addField() {
    if (!label.trim()) return;
    addAssessmentField({
      section,
      label: label.trim(),
      type,
      options: ["single", "multiple", "select"].includes(type) ? parseOptions(options) : [],
      required: false,
    });
    setLabel("");
    setOptions("");
  }

  return (
    <div className="space-y-4 text-sm">
      <div className="rounded-xl border border-sky-200 bg-sky-50 p-3 text-xs text-sky-700">
        此處的新增、修改與刪除會立即反映到「媽媽照護 → 入住評估」，用來確認後台設定與前台表單連動流程。
      </div>

      <div className="rounded-xl border border-stone-200 bg-white p-4">
        <div className="mb-3 font-medium text-stone-700">新增評估題目</div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label className="text-xs text-stone-500">
            表單區段
            <select value={section} onChange={(event) => setSection(event.target.value)} className="mt-1 w-full rounded-lg border border-stone-200 px-2 py-2 text-sm">
              {ASSESSMENT_SECTIONS.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label className="text-xs text-stone-500">
            題目名稱
            <input value={label} onChange={(event) => setLabel(event.target.value)} className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm" placeholder="例如：睡眠狀況" />
          </label>
          <label className="text-xs text-stone-500">
            輸入方式
            <select value={type} onChange={(event) => setType(event.target.value as AssessmentFieldType)} className="mt-1 w-full rounded-lg border border-stone-200 px-2 py-2 text-sm">
              {FIELD_TYPES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </label>
          <label className="text-xs text-stone-500">
            選項（逗號分隔）
            <input value={options} onChange={(event) => setOptions(event.target.value)} disabled={!(["single", "multiple", "select"] as AssessmentFieldType[]).includes(type)} className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm disabled:bg-stone-100" placeholder="良好,普通,需關懷" />
          </label>
        </div>
        <div className="mt-3 flex justify-end">
          <button type="button" onClick={addField} disabled={!label.trim()} className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-4 py-2 text-xs font-medium text-white">
            <Plus className="h-4 w-4" />新增題目
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {ASSESSMENT_SECTIONS.map((sectionName) => {
          const sectionFields = fields.filter((field) => field.section === sectionName);
          return (
            <section key={sectionName} className="rounded-xl border border-stone-200 bg-white p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-medium text-stone-700">{sectionName}</h3>
                <span className="text-xs text-stone-400">{sectionFields.length} 題</span>
              </div>
              <div className="space-y-2">
                {sectionFields.map((field) => (
                  <div key={field.id} className="grid gap-2 rounded-lg bg-stone-50 p-3 md:grid-cols-[1fr_150px_1.2fr_auto_auto] md:items-center">
                    <input value={field.label} onChange={(event) => updateAssessmentField(field.id, { label: event.target.value })} className="rounded-lg border border-stone-200 px-3 py-2 text-sm" aria-label={`${sectionName}題目名稱`} />
                    <select value={field.type} onChange={(event) => updateAssessmentField(field.id, { type: event.target.value as AssessmentFieldType })} className="rounded-lg border border-stone-200 px-2 py-2 text-sm" aria-label={`${field.label}輸入方式`}>
                      {FIELD_TYPES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                    </select>
                    <input value={field.options.join("、")} onChange={(event) => updateAssessmentField(field.id, { options: parseOptions(event.target.value) })} disabled={!(["single", "multiple", "select"] as AssessmentFieldType[]).includes(field.type)} className="rounded-lg border border-stone-200 px-3 py-2 text-sm disabled:bg-stone-100" aria-label={`${field.label}選項`} placeholder="選項以逗號分隔" />
                    <label className="flex items-center gap-1.5 whitespace-nowrap text-xs text-stone-600">
                      <input type="checkbox" checked={field.required} onChange={(event) => updateAssessmentField(field.id, { required: event.target.checked })} />必填
                    </label>
                    <button type="button" onClick={() => removeAssessmentField(field.id)} className="inline-flex items-center justify-center gap-1 rounded-lg px-3 py-2 text-xs text-rose-500 hover:bg-rose-50">
                      <Trash2 className="h-3.5 w-3.5" />刪除
                    </button>
                  </div>
                ))}
                {sectionFields.length === 0 && <div className="rounded-lg border border-dashed border-stone-200 p-4 text-center text-xs text-stone-400">此區段尚無題目</div>}
              </div>
            </section>
          );
        })}
      </div>

      <div className="flex justify-end">
        <button type="button" onClick={resetAssessmentFields} className="inline-flex items-center gap-1.5 rounded-lg bg-stone-100 px-4 py-2 text-xs text-stone-600">
          <RotateCcw className="h-3.5 w-3.5" />還原預設題目
        </button>
      </div>
    </div>
  );
}
