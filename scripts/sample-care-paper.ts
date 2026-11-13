import { readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { createPaperPdf } from "../src/lib/care/paperPdf";
import { MAMA_FORMS, BABY_FORMS } from "../src/lib/care/forms";
import type { CareDocument, CareSubject, CareValues } from "../src/lib/care/types";
import { paperSlots } from "../src/lib/care/paperValidation";

async function main() {
  const out = process.env.SANTINO_PAPER_QA || path.resolve("test-results/paper-pdf");
  await mkdir(out, { recursive: true });
  for (const kind of ["mama", "baby"] as const) {
    const subject: CareSubject = { id: `${kind}-qa`, kind, caseId: "qa-case", name: kind === "mama" ? "王○○媽媽" : "王○○之子", motherName: "王○○媽媽", room: "201", chartNo: "QA001", status: "入住", stayDay: 1, birthDate: "2026-11-10" };
    for (const form of (kind === "mama" ? MAMA_FORMS : BABY_FORMS).filter((form) => form.paperTemplate)) {
      const values: CareValues = { date: "2026-11-13", time: "08:20", birthDate: "2026-11-10", temperature: "36.7", pulse: "80", respiration: "20", bloodPressure: "120/80", note: "已完成評估，持續觀察。", stayDay: "1", shift: "白班 07–15", activity: "適中", sucking: "強", foodAllergy: "無", drugAllergy: "有", drugAllergyNote: "測試藥物", gravida: "2", para: "1", abortus: "0", bodyDate: "2026-11-13", bodyTime: "08:30", apgar1: "8", apgar5: "9", head: "34", height: "50", birthWeight: "3100", weight: "3200", sex: "男", stayPlan: "21", hospital: "璟馨", delivery: kind === "mama" ? "NSD 自然產" : "NSD", mood: ["平靜", "疲倦"], skinFindings: ["乾燥", "臉疹"], cordPresent: "存", cordAppearance: "乾燥", redBottom: "0 無紅疹", redBottomPresent: "無", careIssue: "持續觀察。" };
      const document: CareDocument = { key: "qa", subjectId: subject.id, formKey: form.key, values, dirty: true, author: "示範護理師" };
      if (process.env.SANTINO_PAPER_SIGNATURE && form.paperTemplate?.endsWith("admission")) document.signature=`data:image/png;base64,${(await readFile(process.env.SANTINO_PAPER_SIGNATURE)).toString("base64")}`;
      if (process.env.SANTINO_PAPER_DETAIL === "1") {
        for (const field of form.sections.flatMap(section=>section.fields)) {
          if (values[field.key] || form.supplementalKeys?.includes(field.key)) continue;
          if (field.type === "number") values[field.key]=String(Math.max(field.min??1,1));
          else if (field.type === "date") values[field.key]="2026-11-13";
          else if (!field.type || ["text","textarea"].includes(field.type)) values[field.key]="測試";
        }
        Object.assign(values,{gestation:"39＋2",hbig:"已施打",hepatitis:"已施打",screening:"未做",feeding:["母乳"],nippleLeft:["完整","凹陷"],nippleRight:["短平"],respondentIdentity:"孕婦本人",roomingDailyStatus:"其他時數",roomingDailyHours:"5"});
      }
      if (process.env.SANTINO_PAPER_CALIBRATION === "1") {
        const keys=new Map<string,string[]>();
        for(const slot of paperSlots(form)) if(slot.kind === "check" && slot.option) for(const key of slot.key.split("|")) keys.set(key,[...new Set([...(keys.get(key)??[]),slot.option])]);
        const checkValues:CareValues={date:"2026-11-13",time:"08:20",bodyDate:"2026-11-13",bodyTime:"08:20",birthDate:"2026-11-10"};
        for(const [key,options] of keys) checkValues[key]=options;
        if(form.paperTemplate === "baby-daily") Object.assign(checkValues,{shift:"D",redBottomPresent:"有",redBottom:"1 輕度紅疹",activity:"適中",sucking:"強"});
        const history=["mama-daily","baby-daily"].includes(form.paperTemplate!) ? Array.from({length:form.paperTemplate==="mama-daily"?4:15},(_,i)=>({id:`qa-${i}`,subjectId:subject.id,formKey:form.key,at:"2026-11-13T00:00:00Z",historical:false,author:"示範護理師",values:{...checkValues,date:form.paperTemplate==="baby-daily"?`2026-11-${13+Math.floor(i/3)}`:"2026-11-13",time:`08:${String(i).padStart(2,"0")}`,shift:["N","D","E"][i%3]}})) : [];
        const bytes=await createPaperPdf({form,document:{...document,values:checkValues},subject,history,includeDraft:false},async(asset)=>new Uint8Array(await readFile(path.resolve("public",asset))));
        await writeFile(path.join(out,`${form.paperTemplate}-calibration.pdf`),bytes);
        console.log(form.paperTemplate,"全框校準樣張");
        continue;
      }
      for (const blank of [true, false]) {
        const bytes = await createPaperPdf({ form, document, subject, history: [], blank, includeDraft: true, paperSize: process.env.SANTINO_PAPER_SIZE === "a4" ? "a4" : "source" }, async (asset) => new Uint8Array(await readFile(path.resolve("public", asset))));
        const filename = `${form.paperTemplate}-${blank ? "blank" : "filled"}.pdf`;
        await writeFile(path.join(out, filename), bytes);
        console.log(filename, bytes.length);
      }
    }
  }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
