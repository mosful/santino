import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { PDFDocument, PDFDict, PDFName } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { MAMA_FORMS, BABY_FORMS } from "../src/lib/care/forms";
import { buildPaperSheets, dailySharedValues, paperHeaderRecord, paperRecords, validPaperDate, type PaperRequest } from "../src/lib/care/paperRecords";
import { printablePaperKeys, validatePaperValues } from "../src/lib/care/paperValidation";
import { createPaperPdf, PaperPrintError, PAPER_FONT_FEATURES } from "../src/lib/care/paperPdf";
import { canReviseCareEntry } from "../src/lib/care/rules";
import type { CareEntry, CareSubject, CareValues } from "../src/lib/care/types";

const subject:CareSubject={id:"qa-baby",kind:"baby",caseId:"qa",name:"王○○之子",motherName:"王○○媽媽",room:"201",chartNo:"QA001",status:"入住",stayDay:1};
const entry=(id:string,date:string,extra:CareValues={}):CareEntry=>({id,subjectId:subject.id,formKey:"daily",values:{date,time:"08:00",shift:"D",...extra},author:"陳護理師（護理師 陳護理師）",at:`${date}T00:00:00Z`,historical:false});
const request=(history:CareEntry[]=[],extra:Partial<PaperRequest>={}):PaperRequest=>({form:BABY_FORMS[2],subject,document:{key:"qa:daily",subjectId:subject.id,formKey:"daily",values:{date:"2026-11-13",time:"09:00"},dirty:false},history,...extra});

test("臨床數值與中英文混排不產生字寬表缺漏的替代字形",async()=>{
  const font=fontkit.create(await readFile(path.resolve("public/fonts/noto-sans-tc/NotoSansTC.ttf")));
  const mapped=new Set(font.characterSet.map(code=>font.glyphForCodePoint(code).id));
  const glyphs=font.layout("T36.7℃ P80 R20 BP120/80，PDA、PFO 39＋2",PAPER_FONT_FEATURES).glyphs;
  assert.ok(glyphs.every(glyph=>mapped.has(glyph.id)),"每個填值字形都必須包含於 PDF 的字寬及 Unicode 對照表");
});

test("寶寶每日五日保留缺日與 N／D／E 欄，六天接第二頁",()=>{
  const sheets=buildPaperSheets(request([entry("a","2026-11-13"),entry("b","2026-11-15"),entry("c","2026-11-18")]));
  assert.equal(sheets.length,2);
  assert.deepEqual(sheets[0].dates,["2026-11-13","2026-11-14","2026-11-15","2026-11-16","2026-11-17"]);
  assert.equal(sheets[0].columns?.length,15);
  assert.equal(sheets[0].columns?.[1]?.id,"a");
  assert.ok(sheets[0].columns?.slice(3,6).every((item)=>!item));
  assert.equal(sheets[1].columns?.[1]?.id,"c");
});

test("一到十日與一到五筆的頁數及末頁留白符合原表容量",()=>{
  for (const count of [1,5,6,10]) {
    const history=Array.from({length:count},(_,i)=>entry(`b-${i}`,`2026-11-${String(13+i).padStart(2,"0")}`));
    const sheets=buildPaperSheets(request(history));
    assert.equal(sheets.length,Math.ceil(count/5));
    assert.equal(sheets.flatMap(sheet=>sheet.columns??[]).filter(Boolean).length,count);
  }
  for (const count of [1,4,5]) {
    const form=MAMA_FORMS[1];
    const history=Array.from({length:count},(_,i)=>({...entry(`m-${i}`,"2026-11-13",{time:`0${i+1}:00`}),formKey:form.key}));
    assert.equal(buildPaperSheets(request(history,{form})).length,Math.ceil(count/4));
  }
});
test("列印區間可包含完全無紀錄日，缺測不補正常",()=>{
  const sheets=buildPaperSheets(request([],{start:"2026-11-01",end:"2026-11-10"}));
  assert.equal(sheets.length,2);
  assert.equal(sheets[1].dates?.at(-1),"2026-11-10");
  assert.ok(sheets.flatMap((sheet)=>sheet.columns!).every((item)=>!item));
});
test("跨年度按原表年度欄分頁，日期不遺失",()=>{
  const sheets=buildPaperSheets(request([],{start:"2026-12-31",end:"2027-01-02"}));
  assert.equal(sheets.length,2);
  assert.deepEqual(sheets[0].dates,["2026-12-31","","","",""]);
  assert.deepEqual(sheets[1].dates,["2027-01-01","2027-01-02","","",""]);
});
test("頁首取本次所選歷史資料，不以目前草稿改寫",()=>{
  const req=request([entry("a","2026-11-13",{delivery:"C/S",birthDate:"2026-11-01"})]);
  req.document.values.delivery="NSD";
  const sheet=buildPaperSheets(req)[0];
  assert.equal(paperHeaderRecord(req,sheet).values.delivery,"C/S");
  assert.equal(paperHeaderRecord(req,sheet).values.birthDate,"2026-11-01");
});
test("同日同班多筆須明確選擇，不任取第一筆且不改動原歷史",()=>{
  const history=[entry("a","2026-11-13"),entry("b","2026-11-13",{time:"10:00"})];
  assert.throws(()=>buildPaperSheets(request(history)),/有 2 筆/);
  const sheets=buildPaperSheets(request(history,{choices:{"2026-11-13/D":"b"}}));
  assert.equal(sheets[0].columns?.[1]?.id,"b");
  assert.equal(history.length,2);
  assert.equal(history[0].values.time,"08:00");
});
test("產婦每日按四次紀錄分頁，同日多次分別保留日期時間",()=>{
  const form=MAMA_FORMS[1];
  const history=Array.from({length:5},(_,i)=>({...entry(`m${i}`,"2026-11-13",{time:`0${i+1}:00`}),formKey:form.key}));
  const sheets=buildPaperSheets(request(history,{form}));
  assert.equal(sheets.length,2);
  assert.deepEqual(sheets[0].columns?.map((item)=>item?.values.time),["01:00","02:00","03:00","04:00"]);
  assert.equal(sheets[1].columns?.[0]?.id,"m4");
  assert.equal(sheets[1].columns?.[1],undefined);
});
test("草稿與編輯舊筆不重複列印，也不混入其他對象或表單",()=>{
  const old=entry("a","2026-11-13");
  const req=request([old,{...old,id:"other",subjectId:"other"},{...old,id:"io",formKey:"io"}],{includeDraft:true});
  req.document.editingEntryId="a";
  assert.deepEqual(paperRecords(req).map((item)=>item.id),["draft"]);
  req.includeDraft=false;
  assert.deepEqual(paperRecords(req).map((item)=>item.id),["a"]);
  assert.equal(req.history.length,3);
});
test("錯誤日期、起訖與未知班別不能被略過或猜測",()=>{
  assert.equal(validPaperDate("2026-02-30"),false);
  assert.equal(validPaperDate("2028-02-29"),true);
  assert.throws(()=>buildPaperSheets(request([],{start:"2026-11-15",end:"2026-11-13"})),/起日/);
  assert.throws(()=>buildPaperSheets(request([entry("a","2026-11-13",{shift:"未知班別"})])),/班別/);
});
test("同一天的日合計必須一致，不用第一個班的值替代",()=>{
  const a=entry("a","2026-11-13",{roomingDailyHours:"8"});
  const b=entry("b","2026-11-13",{roomingDailyHours:"7"});
  assert.throws(()=>dailySharedValues([a,b]),/不一致/);
  assert.deepEqual(dailySharedValues([a,undefined]),{roomingDailyHours:"8"});
});
test("每一新版主表欄位都有印位或明示補充位置",()=>{
  for (const form of [...MAMA_FORMS,...BABY_FORMS].filter((item)=>item.paperTemplate)) {
    const printable=printablePaperKeys(form);
    const uncovered=form.sections.flatMap((section)=>section.fields).filter((field)=>!printable.has(field.key)&&!form.supplementalKeys?.includes(field.key));
    assert.deepEqual(uncovered.map((field)=>field.key),[],form.paperTemplate);
  }
});
test("舊選項不猜轉，數字及紅臀與親子同室矛盾須核對",()=>{
  const baby=BABY_FORMS[2];
  assert.ok(validatePaperValues(MAMA_FORMS[1],{mood:["平穩"]}).some((message)=>message.includes("不自動轉換")));
  assert.ok(validatePaperValues(baby,{temperature:"NaN"}).some((message)=>message.includes("數值")));
  assert.ok(validatePaperValues(baby,{date:"2026-02-30",time:"25:00"}).some((message)=>message.includes("有效日期")));
  assert.ok(validatePaperValues(baby,{time:"25:00"}).some((message)=>message.includes("有效時間")));
  assert.ok(validatePaperValues(baby,{redBottomPresent:"無",redBottom:"2 中度紅疹及破皮"}).some((message)=>message.includes("不一致")));
  assert.ok(validatePaperValues(baby,{roomingDailyStatus:"≥8hrs",roomingDailyHours:"7"}).some((message)=>message.includes("不一致")));
});
test("列印署名取該筆最近簽出的護理人員，不讀目前登入者",()=>{
  const a={...entry("a","2026-11-13"),staffStamp:{author:"護理長（護理長 婉真）",at:"2026-11-14T00:00:00Z"}};
  assert.equal(paperRecords(request([a]))[0].author,a.staffStamp.author);
});
test("已簽紀錄僅本人或主管可以修正",()=>{
  const a=entry("a","2026-11-13");
  assert.equal(canReviseCareEntry("護理師 陳護理師",a),true);
  assert.equal(canReviseCareEntry("衛教師 琳雅",a),false);
  assert.equal(canReviseCareEntry("護理長 婉真",a),true);
  assert.equal(canReviseCareEntry("管理者",a),true);
});
test("PDF 原尺寸與 A4 等比例輸出，空白量表保持一頁且不載入字型",async()=>{
  const source=await PDFDocument.create(); source.addPage([578.16,824.4]); source.addPage([578.16,824.4]);
  const bytes=await source.save();
  for(const size of ["source","a4"] as const) {
    const output=await createPaperPdf(request([],{form:MAMA_FORMS.find((form)=>form.key==="social")!,blank:true,paperSize:size}),async(asset)=>{assert.ok(asset.endsWith(".pdf"));return bytes;});
    const doc=await PDFDocument.load(output);
    assert.equal(doc.getPageCount(),1);
    assert.ok(Math.abs(doc.getPage(0).getWidth()-(size==="a4"?595.276:578.16))<.01);
  }
});
test("長文字超框時拒絕輸出，不刪除或截斷原值",async()=>{
  const source=await PDFDocument.create();source.addPage([578.16,824.4]);
  const bytes=await source.save();
  const req=request([],{form:MAMA_FORMS[1],includeDraft:true});
  req.document.formKey=req.form.key;
  req.document.values.note="完整護理紀錄".repeat(400);
  const original=req.document.values.note;
  await assert.rejects(()=>createPaperPdf(req,async(asset)=>asset.endsWith(".ttf")?new Uint8Array(await readFile(path.resolve("public",asset))):bytes),(error)=>error instanceof PaperPrintError && error.issues.some((issue)=>issue.field === "note" && issue.message.includes("超出")));
  assert.equal(req.document.values.note,original);
});

test("A4 嵌頁先完成中文字型與簽名資源，避免填值亂碼或遺失",async()=>{
  const source=await PDFDocument.create();source.addPage([578.16,824.4]);source.addPage([578.16,824.4]);
  const sourceBytes=await source.save();
  const req=request([],{form:MAMA_FORMS[0],paperSize:"a4"});
  req.document.signature="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j9t0AAAAASUVORK5CYII=";
  const bytes=await createPaperPdf(req,async(asset)=>asset.endsWith(".ttf")?new Uint8Array(await readFile(path.resolve("public",asset))):sourceBytes);
  const doc=await PDFDocument.load(bytes);
  const objects=doc.context.enumerateIndirectObjects().map(([,object])=>object);
  assert.ok(objects.some(object=>object instanceof PDFDict && object.has(PDFName.of("FontFile2"))),"A4 必須內嵌完整中文字型程式");
  assert.ok(objects.some(object=>"dict" in object && object.dict instanceof PDFDict && object.dict.get(PDFName.of("Subtype"))?.toString()==="/Image"),"A4 必須保留簽名圖片");
});

test("產婦每日 URI 勾兩個症狀仍能產出 PDF，非 URI 症狀不擠進 URI 格",async()=>{
  const source=await PDFDocument.create();source.addPage([578.16,824.4]);
  const bytes=await source.save();
  const req=request([],{form:MAMA_FORMS[1],includeDraft:true});
  req.document.formKey=req.form.key;
  Object.assign(req.document.values,{uriStatus:"有",symptoms:["咳嗽","有痰","流鼻水","頭痛"],note:"示範紀錄"});
  const pdf=await createPaperPdf(req,async(asset)=>asset.endsWith(".ttf")?new Uint8Array(await readFile(path.resolve("public",asset))):bytes);
  assert.ok(pdf.byteLength>0);
});

test("矛盾選項互斥：未解與有排便、上肢正常與上肢水腫不能並存",async()=>{
  const { conflicts } = await import("../src/lib/care/rules");
  assert.ok(conflicts("未解","有，正常"));
  assert.ok(conflicts("有，軟","未解"));
  assert.ok(conflicts("有，正常","腹瀉"));
  assert.ok(conflicts("上肢水腫","上肢正常"));
  assert.ok(!conflicts("咳嗽","有痰"));
  assert.ok(!conflicts("腹瀉","水便"));
});
