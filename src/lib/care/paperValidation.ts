import type { CareForm, CareValues } from "./types";
import { PAPER_TEMPLATES, mamaDailySlots, babyDailySlots, babyDaySlots } from "./paperTemplates";
import { paperText, validPaperDate } from "./paperRecords";

export function paperSlots(form: CareForm) {
  if (!form.paperTemplate) return [];
  return [...PAPER_TEMPLATES[form.paperTemplate].flatMap((page) => page.slots),
    ...(form.paperTemplate === "mama-daily" ? mamaDailySlots(0) : form.paperTemplate === "baby-daily" ? [...babyDailySlots(0,0), ...babyDaySlots(0)] : [])];
}
export function printablePaperKeys(form: CareForm) {
  const keys=new Set(paperSlots(form).flatMap((slot)=>slot.key.split("|")));
  ["date","birthDate","fundusNote"].forEach((key)=>keys.add(key));
  if (form.paperTemplate === "mama-daily") ["temperature","pulse","respiration","bloodPressure","symptoms","symptomNote"].forEach((key)=>keys.add(key));
  if (form.paperTemplate === "baby-daily") ["activity","sucking","redBottom","shift"].forEach((key)=>keys.add(key));
  return keys;
}

/** 原表未有「有」的單獨方框：保留勾無或填症狀／診斷的原格局。 */
const implicit: Record<string,string[]> = { motherInfection:["無","有"],familyInfection:["無","有"],schoolInfection:["無","有"],abdominalWound:["敷料覆蓋"],familySymptoms:["其他"],hemorrhoidMedication:["無"] };
export function validatePaperValues(form: CareForm, values: CareValues) {
  const errors: string[]=[];
  const fields=form.sections.flatMap((section)=>section.fields);
  const mapped=printablePaperKeys(form);
  const options=new Map<string,Set<string>>();
  for (const slot of paperSlots(form)) {
    if (slot.kind !== "check" || !slot.option || slot.key.includes("|")) continue;
    if(!options.has(slot.key)) options.set(slot.key,new Set());
    options.get(slot.key)!.add(slot.option);
  }
  for (const field of fields) {
    const value=values[field.key];
    if (!paperText(value)) continue;
    if (field.type === "date" && !validPaperDate(paperText(value))) errors.push(`${field.label}不是有效日期，請核對原紀錄。`);
    if (field.type === "time" && !/^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(paperText(value))) errors.push(`${field.label}不是有效時間，請核對原紀錄。`);
    if (field.type === "number" && !field.range && (!Number.isFinite(Number(value)) || field.min !== undefined && Number(value)<field.min || field.max !== undefined && Number(value)>field.max)) errors.push(`${field.label}超出有效數值範圍，請核對原紀錄。`);
    if(form.supplementalKeys?.includes(field.key)) continue;
    if(!mapped.has(field.key)) { errors.push(`${field.label}尚未對應原紙本位置，完整資料仍保留。`); continue; }
    const allowed=options.get(field.key);
    if(!allowed) continue;
    const selected=Array.isArray(value)?value:[paperText(value)];
    for(const item of selected) {
      const aliases=item === "NSD 自然產" ? [item,"NSD"] : item === "C/S 剖腹產" ? [item,"C/S"] : [item];
      if(!aliases.some((option)=>allowed.has(option)) && !implicit[field.key]?.includes(item)) errors.push(`${field.label}的「${item}」未對應原紙本選項，請核對後再列印；不自動轉換舊值。`);
    }
  }
  if(form.paperTemplate === "mama-daily" && values.uriStatus === "無" && (Array.isArray(values.symptoms)?values.symptoms:[paperText(values.symptoms)]).some((item)=>item && item !== "無")) errors.push("URI 勾「無」卻有症狀，請核對。");
  if(form.paperTemplate === "baby-daily") {
    if(values.redBottomPresent === "無" && paperText(values.redBottom) && !paperText(values.redBottom).startsWith("0 ")) errors.push("紅臀有無與分級不一致，請核對。");
    if(values.redBottomPresent === "有" && paperText(values.redBottom).startsWith("0 ")) errors.push("紅臀有無與分級不一致，請核對。");
    if(values.roomingDailyStatus && paperText(values.roomingDailyHours)) {
      const hours=Number(values.roomingDailyHours);
      if (values.roomingDailyStatus === "≥8hrs" && hours<8) errors.push("親子同室時數與原表勾選不一致，請核對。");
    }
  }
  return errors;
}
