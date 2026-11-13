import type { CareDocument, CareEntry, CareForm, CareSubject, CareValues } from "./types";
import { PAPER_SHIFTS, PAPER_TEMPLATES, paperShift, type PaperPage } from "./paperTemplates";

export type PaperRecord = { id: string; values: CareValues; author?: string; signature?: string; templateVersion?: string };
export type PaperSheet = { template: PaperPage; record?: PaperRecord; columns?: (PaperRecord | undefined)[]; dates?: string[] };
export type PaperRequest = { form: CareForm; document: CareDocument; subject: CareSubject; history: CareEntry[]; blank?: boolean; includeDraft?: boolean; start?: string; end?: string; choices?: Record<string, string>; paperSize?: "source" | "a4" };
export const paperText = (value: string | string[] | undefined) => Array.isArray(value) ? value.join("、") : value ?? "";
const day = /^\d{4}-\d{2}-\d{2}$/;
export function validPaperDate(value: string) {
  if (!day.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(+parsed) && parsed.toISOString().slice(0, 10) === value;
}
export function addPaperDays(value: string, count: number) {
  return new Date(Date.parse(`${value}T00:00:00Z`) + count * 86400000).toISOString().slice(0, 10);
}
export function paperRecords(request: PaperRequest): PaperRecord[] {
  const { document, subject, form, history, includeDraft } = request;
  const records: PaperRecord[] = history.filter((entry) => entry.subjectId === subject.id && entry.formKey === form.key && (!includeDraft || entry.id !== document.editingEntryId)).map((entry) => ({ ...entry, author: entry.staffStamp?.author ?? entry.author, values: structuredClone(entry.values) }));
  if (includeDraft && !document.signedAt) records.push({ id: "draft", values: structuredClone(document.values), author: document.author, signature: document.signature, templateVersion: document.templateVersion });
  return records.sort((a, b) => `${paperText(a.values.date)} ${paperText(a.values.time)} ${a.id}`.localeCompare(`${paperText(b.values.date)} ${paperText(b.values.time)} ${b.id}`));
}
export function paperConflicts(request: PaperRequest) {
  const groups = new Map<string, PaperRecord[]>();
  if (request.form.paperTemplate !== "baby-daily" || request.blank) return groups;
  for (const item of paperRecords(request)) {
    const date = paperText(item.values.date);
    if ((request.start && date < request.start) || (request.end && date > request.end)) continue;
    const key = `${date}/${paperShift(paperText(item.values.shift))}`;
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }
  return new Map([...groups].filter(([, records]) => records.length > 1));
}

/** 不以「最近五個有紀錄日」代替連續日期，也不任取同班第一筆。 */
export function buildPaperSheets(request: PaperRequest): PaperSheet[] {
  const { form, blank, document, start, end } = request;
  if (!form.paperTemplate) throw new Error("此表單尚無紙本母版。");
  const templates = PAPER_TEMPLATES[form.paperTemplate];
  if (blank) return templates.map((template) => ({ template }));
  if (!["mama-daily", "baby-daily"].includes(form.paperTemplate)) return templates.map((template) => ({ template, record: { id: "current", ...document } }));
  const all = paperRecords(request);
  if (start && !validPaperDate(start) || end && !validPaperDate(end)) throw new Error("列印日期不正確。");
  if (start && end && start > end) throw new Error("列印起日不可晚於迄日。");
  const records = all.filter((item) => (!start || paperText(item.values.date) >= start) && (!end || paperText(item.values.date) <= end));
  if (records.some((item) => !validPaperDate(paperText(item.values.date)))) throw new Error("有紀錄缺少有效評估日期，請先核對，避免遺漏。");
  if (form.paperTemplate === "mama-daily") {
    return Array.from({ length: Math.max(1, Math.ceil(records.length / 4)) }, (_, i) => ({ template: templates[0], columns: Array.from({ length: 4 }, (_, j) => records[i * 4 + j]) }));
  }
  if (records.some((item) => !paperShift(paperText(item.values.shift)))) throw new Error("有紀錄班別尚未對應 N／D／E，請先核對原班別。");
  const from = start || paperText(records[0]?.values.date) || paperText(document.values.date);
  const to = end || paperText(records.at(-1)?.values.date) || from;
  if (!validPaperDate(from) || !validPaperDate(to)) throw new Error("請指定列印日期。");
  const days = Math.floor((Date.parse(to) - Date.parse(from)) / 86400000) + 1;
  if (days < 1 || days > 366) throw new Error("單次列印請選擇 1～366 天的範圍。");
  const conflicts = paperConflicts(request);
  for (const [key, items] of conflicts) {
    if (!items.some((item) => item.id === request.choices?.[key])) throw new Error(`${key} 有 ${items.length} 筆紀錄，請明確選擇本次列印的紀錄；其他資料仍保留。`);
  }
  const groups:string[][]=[];
  for(let i=0;i<days;i++) {
    const date=addPaperDays(from,i);
    if(!groups.length || groups.at(-1)!.length===5 || groups.at(-1)![0].slice(0,4)!==date.slice(0,4)) groups.push([]);
    groups.at(-1)!.push(date);
  }
  return groups.map((group) => {
    const dates = [...group];
    while(dates.length<5) dates.push("");
    const columns = dates.flatMap((date) => PAPER_SHIFTS.map((shift) => {
      const matches = records.filter((item) => paperText(item.values.date) === date && paperShift(paperText(item.values.shift)) === shift);
      return matches.length > 1 ? matches.find((item) => item.id === request.choices?.[`${date}/${shift}`]) : matches[0];
    }));
    return { template: templates[0], dates, columns };
  });
}

export function paperValue(key: string, record: PaperRecord | undefined, subject: CareSubject, columnDate?: string): string | string[] {
  const values = record?.values ?? {};
  if (key.includes("|")) return key.split("|").flatMap((part) => { const value = paperValue(part, record, subject); return Array.isArray(value) ? value : value ? [value] : []; });
  switch (key) {
    case "$room": return subject.room || subject.previousRoom || "";
    case "$name": return subject.name;
    case "$birth": return paperText(values.birthDate) || subject.birthDate || "";
    case "fundus": return values.fundus === "其他" ? values.fundusNote ?? "其他" : values.fundus ?? "";
    case "$author": return (record?.author ?? "").split("（")[0];
    case "$columnDate": return columnDate ? columnDate.slice(5).replace("-", "/") : "";
    case "$vitals": return [["temperature", "T", "℃"], ["pulse", "P", ""], ["respiration", "R", ""], ["bloodPressure", "BP", ""]].filter(([field]) => paperText(values[field])).map(([field, prefix, unit]) => `${prefix}${paperText(values[field])}${unit}`).join(" ");
    case "$uri": return [paperText(values.symptoms), paperText(values.symptomNote)].filter(Boolean).join(" ");
    case "$redGrade": return /^([0-3])\s/.exec(paperText(values.redBottom))?.[1] ?? "";
    case "$activity": case "$sucking": return paperText(values[key === "$activity" ? "activity" : "sucking"]);
    default: return values[key] ?? "";
  }
}

export function dailySharedValues(records: (PaperRecord | undefined)[]) {
  const shared: CareValues = {};
  for (const key of ["stayDay", "roomingDailyStatus", "roomingDailyHours"]) {
    const values = [...new Set(records.map((record) => paperText(record?.values[key])).filter(Boolean))];
    if (values.length > 1) throw new Error(`同一天的${key === "stayDay" ? "入住日數" : "親子同室合計"}不一致，請核對後再列印。`);
    if (values[0]) shared[key] = values[0];
  }
  return shared;
}

/** 紙本頁首只有一組欄位，不拿目前草稿覆蓋所選歷史紀錄的頁首。 */
export function paperHeaderRecord(request:PaperRequest,sheet:PaperSheet):PaperRecord {
  if(sheet.record) return sheet.record;
  if(!sheet.columns) return {id:"header",values:request.document.values};
  const values:CareValues={};
  for(const key of ["birthDate","delivery","feedingType","feedingOther","woundSite"]) {
    const items=sheet.columns.filter((record):record is PaperRecord=>!!record).map((record)=>record.values[key]).filter((value)=>!!paperText(value));
    const distinct=new Map(items.map((value)=>[Array.isArray(value)?[...value].sort().join("、"):value,value]));
    if(distinct.size>1) throw new Error("同頁紀錄的生產日期、生產方式或紙本頁首條件不同，請縮短範圍分次列印，避免印錯頁首。");
    if(items[0]) values[key]=items[0];
  }
  values.date=sheet.dates?.find(Boolean) ?? paperText(sheet.columns.find(Boolean)?.values.date) ?? "";
  return {id:"header",values};
}
