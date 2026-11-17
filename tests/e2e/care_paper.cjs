const assert=require("node:assert/strict");
const fs=require("node:fs/promises");
const path=require("node:path");
const {PDFDocument}=require("pdf-lib");
const {chromium,webkit}=require("playwright");
const base=process.env.SANTINO_PREVIEW_BASE_URL || "http://localhost:4310";
const output=path.join(process.env.SANTINO_QA_OUTPUT || path.resolve("test-results"),"care_paper");
let active;

async function download(page,name) {
  const pending=page.waitForEvent("download");
  await page.getByRole("link",{name:"下載紙本 PDF",exact:true}).click();
  const item=await pending;
  const file=path.join(output,name);
  await item.saveAs(file);
  return PDFDocument.load(await fs.readFile(file));
}
async function generate(page,blank=false) {
  await page.getByRole("button",{name:blank?"產生空白紙本 PDF":"產生填寫紙本 PDF",exact:true}).click();
  await page.getByRole("link",{name:"下載紙本 PDF",exact:true}).waitFor({timeout:60000});
  const alerts=(await page.getByRole("alert").allTextContents()).filter(text=>text.trim());
  assert.deepEqual(alerts,[],JSON.stringify(alerts));
}
async function check(page,name,width,height) {
  await page.setViewportSize({width,height});
  await page.evaluate(()=>window.scrollTo(0,0));
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),`${name} 不可水平溢出`);
  await page.screenshot({path:path.join(output,`${name}.png`),fullPage:true});
}
async function nativePdf(page,name,minimumPages) {
  const file=path.join(output,name);
  await page.emulateMedia({media:"print"});
  await page.pdf({path:file,format:"A4",printBackground:true,preferCSSPageSize:true});
  await page.emulateMedia({media:"screen"});
  const pdf=await PDFDocument.load(await fs.readFile(file));
  assert.ok(pdf.getPageCount()>=minimumPages,`${name} 至少 ${minimumPages} 頁`);
  return pdf;
}
(async()=>{
  await fs.mkdir(output,{recursive:true});
  const results=[];
  for(const [engine,type] of [["chromium",chromium],["webkit",webkit]]) {
    const browser=await type.launch({headless:true});active=browser;
    const context=await browser.newContext({viewport:{width:1440,height:1000},acceptDownloads:true});
    await context.addInitScript(()=>{localStorage.setItem("santino_auth_v1","1");localStorage.setItem("santino_current_role_v1","管理者");});
    const page=await context.newPage();
    const errors=[];page.on("pageerror",error=>errors.push(error.message));
    await page.goto(base+"/mama/");
    await page.getByRole("button",{name:"入住評估",exact:true}).first().click();
    await page.getByLabel("紀錄時間（必填）",{exact:true}).fill("07:21");
    await page.getByRole("navigation",{name:"表單區段"}).getByRole("button",{name:"入住護理紀錄",exact:true}).click();
    await page.getByLabel("入住護理紀錄（必填）",{exact:true}).fill("紙本流程測試，保留完整護理紀錄。");
    await page.getByRole("button",{name:"暫存",exact:true}).click();
    const state=await page.evaluate(()=>JSON.parse(localStorage.getItem("santino_care_workspace_v1")));
    assert.equal(state.documents[state.active.mama].values.time,"07:21");
    assert.equal(await page.getByRole("region",{name:"依紙本列印"}).count(),0);
    assert.equal(await page.locator('iframe[title="紙本 PDF 預覽"]').count(),0);
    await page.getByRole("button",{name:"列印空白表格",exact:true}).click();
    const nativeAdmission=page.locator('[data-native-print="mama-admission"]');
    await nativeAdmission.waitFor();
    assert.match(await nativeAdmission.textContent(),/產婦入住護理評估表/);
    assert.equal(await nativeAdmission.locator("iframe").count(),0);
    if(engine==="chromium") await nativePdf(page,`${engine}-mama-admission-native-blank.pdf`,4);
    await page.getByRole("button",{name:"回到填寫畫面",exact:true}).click();
    if(engine==="chromium") await nativePdf(page,`${engine}-mama-admission-native-filled.pdf`,4);
    await page.getByRole("navigation",{name:"表單區段"}).getByRole("button",{name:"病史",exact:true}).click();
    for(const [name,w,h] of [["desktop",1440,1000],["ipad-portrait",820,1180],["ipad-landscape",1180,820],["mobile",390,844]]) await check(page,`${engine}-mama-${name}`,w,h);
    await page.getByRole("button",{name:"每日照護",exact:true}).first().click();
    assert.match(await page.getByLabel("紀錄日期（必填）",{exact:true}).inputValue(),/^\d{4}-\d{2}-\d{2}$/);
    await page.getByRole("button",{name:"列印空白表格",exact:true}).click();
    const nativeDaily=page.locator('[data-native-print="mama-daily"]');
    await nativeDaily.waitFor();
    assert.match(await nativeDaily.textContent(),/產婦每日護理評估表/);
    assert.equal(await nativeDaily.locator("iframe").count(),0);
    if(engine==="chromium") await nativePdf(page,`${engine}-mama-daily-native-blank.pdf`,1);
    await page.goto(base+"/baby/");
    await page.getByRole("button",{name:"每日照護",exact:true}).first().click();
    const babyState=await page.evaluate(()=>JSON.parse(localStorage.getItem("santino_care_workspace_v1")));
    const key=babyState.active.baby;
    const doc=babyState.documents[key];
    babyState.entries=Array.from({length:6},(_,i)=>({id:`paper-${i}`,subjectId:doc.subjectId,formKey:"daily",author:"示範護理師",at:`2026-11-${13+i}T00:00:00Z`,historical:false,templateVersion:"20261113",values:{date:`2026-11-${13+i}`,time:"08:00",shift:"D",temperature:"36.7",activity:"適中",sucking:"強"}}));
    babyState.entries.push({...babyState.entries[0],id:"paper-duplicate",values:{...babyState.entries[0].values,time:"09:00"}});
    await page.evaluate(state=>localStorage.setItem("santino_care_workspace_v1",JSON.stringify(state)),babyState);
    await page.reload();
    await page.getByRole("button",{name:"產生填寫紙本 PDF",exact:true}).click();
    await page.getByRole("alert").filter({hasText:"有 2 筆紀錄"}).waitFor();
    await page.getByLabel("同班多筆列印選擇").getByRole("combobox").selectOption("paper-duplicate");
    await generate(page);
    assert.equal((await download(page,`${engine}-baby-six-days.pdf`)).getPageCount(),2);
    for(const [name,w,h] of [["desktop",1440,1000],["ipad-portrait",820,1180],["ipad-landscape",1180,820],["mobile",390,844]]) await check(page,`${engine}-baby-${name}`,w,h);
    assert.deepEqual(errors,[]);
    results.push({engine,passed:["產婦入住原生四頁版型","產婦每日原生四欄版型","評估時間暫存保留","寶寶同班多筆明選","寶寶連續六天兩頁","桌機／iPad直橫／手機無橫溢"],pageErrors:errors});
    await browser.close();active=null;
  }
  await fs.writeFile(path.join(output,"result.json"),JSON.stringify(results,null,2));
  console.log("列印流程：產婦兩張原生版型、寶寶 PDF 母版與多裝置版面檢查通過。");
})().catch(async(error)=>{console.error(error);await active?.close();process.exitCode=1;});
