import type { CareField, CareValues } from "@/lib/care/types";
import CareFieldInput from "./CareFields";

const GROUPS: Record<string, { title: string; keys: string[] }[]> = {
  io: [
    { title: "紀錄時間", keys: ["date", "time"] },
    { title: "餵食", keys: ["feeding", "amount", "condition", "sucking"] },
    { title: "排泄", keys: ["urine", "urineDetail", "stool", "stoolDetail"] },
  ],
  daily: [
    { title: "時間與量測", keys: ["date", "time", "temperature", "weight"] },
    { title: "日常照護", keys: ["bath", "cord", "skin", "redBottom", "phototherapy"] },
  ],
  ongoing: [
    { title: "時間與生命徵象", keys: ["date", "time", "temperature", "pulse", "bloodPressure", "respiration"] },
    { title: "身心狀況", keys: ["mood", "uri", "fundus", "painSites", "painScore", "lochia"] },
    { title: "乳房與傷口", keys: ["breast", "lactation", "pumping", "perinealWound", "abdominalWound"] },
  ],
};

/** 只將同一份 schema 分組顯示；欄位 key、值、驗證與存檔仍由原工作區管理。 */
export default function CareFieldGroups({ formKey, fields, values, onChange, personal, addPhrase }: {
  formKey: string; fields: CareField[]; values: CareValues; onChange: (patch: CareValues) => void; personal: string[]; addPhrase: (value: string) => void;
}) {
  const definitions = GROUPS[formKey] ?? [];
  const assigned = new Set(definitions.flatMap((group) => group.keys));
  const groups = definitions.map((group) => ({ title: group.title, fields: fields.filter((field) => group.keys.includes(field.key)) })).filter((group) => group.fields.length);
  const rest = fields.filter((field) => !assigned.has(field.key));
  if (rest.length) groups.push({ title: groups.length ? "補充紀錄" : "", fields: rest });
  return <div className="care-field-groups">{groups.map((group) => <div key={group.title} className="care-field-group">
    {group.title && <h4 className="mb-4 text-sm font-semibold text-stone-700">{group.title}</h4>}
    <div className="grid gap-x-5 gap-y-6 sm:grid-cols-2">{group.fields.map((field) => <CareFieldInput key={field.key} field={field} values={values} onChange={onChange} personal={personal} addPhrase={addPhrase} />)}</div>
  </div>)}</div>;
}
