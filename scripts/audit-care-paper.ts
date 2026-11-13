import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { MAMA_FORMS, BABY_FORMS } from "../src/lib/care/forms";
import { PAPER_TEMPLATES, mamaDailySlots, babyDailySlots, babyDaySlots } from "../src/lib/care/paperTemplates";
import { printablePaperKeys } from "../src/lib/care/paperValidation";

async function main() {
  const out=process.env.SANTINO_PAPER_QA || path.resolve("test-results/paper-pdf");
  await mkdir(out,{recursive:true});
  const data=[];
  for (const form of [...MAMA_FORMS,...BABY_FORMS].filter((item)=>item.paperTemplate)) {
    const pages=PAPER_TEMPLATES[form.paperTemplate!].map((page)=>({...page,slots:[...page.slots,...(form.paperTemplate==="mama-daily" ? mamaDailySlots(0) : form.paperTemplate==="baby-daily" ? [...babyDailySlots(0,0),...babyDaySlots(0)] : [])]}));
    const keys=printablePaperKeys(form);
    for (const key of ["date","birthDate"]) keys.add(key);
    if(form.paperTemplate==="mama-daily") ["temperature","pulse","respiration","bloodPressure","symptoms","symptomNote"].forEach((key)=>keys.add(key));
    if(form.paperTemplate==="baby-daily") ["activity","sucking","redBottom","shift"].forEach((key)=>keys.add(key));
    const fields=form.sections.flatMap((section)=>section.fields);
    const unmapped=fields.filter((field)=>!keys.has(field.key)&&!form.supplementalKeys?.includes(field.key));
    data.push({id:form.paperTemplate,version:form.templateVersion,pages,fields,extra:form.supplementalKeys,unmapped});
    console.log(form.paperTemplate,'未映射主表欄位',unmapped.map((field)=>field.key).join(','));
  }
  await writeFile(path.join(out,'field-map.json'),JSON.stringify(data,null,2));
}
main().catch((error)=>{console.error(error);process.exitCode=1;});
