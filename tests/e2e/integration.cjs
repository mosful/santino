const path = require("node:path");
const base = process.env.SANTINO_PREVIEW_BASE_URL || "http://localhost:4310";
let activeBrowser;
const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const jsQR = require("jsqr");
const output = path.join(process.env.SANTINO_QA_OUTPUT || path.resolve("test-results"), "integration");
async function decodeQr(locator, label = false) {
  const pixels = await locator.evaluate(async (image, crop) => { await image.decode(); const canvas = document.createElement("canvas"); canvas.width = crop ? Math.min(320, image.naturalWidth) : image.naturalWidth; canvas.height = image.naturalHeight; const context = canvas.getContext("2d"); context.drawImage(image, 0, 0); return { width: canvas.width, height: canvas.height, data: Array.from(context.getImageData(0, 0, canvas.width, canvas.height).data) }; }, label);
  const decoded = jsQR(new Uint8ClampedArray(pixels.data), pixels.width, pixels.height); assert.ok(decoded, "產生的 QR 圖片須可解碼"); return new URL(decoded.data);
}

(async () => {
  await fs.mkdir(output, { recursive: true });
  const browser = await chromium.launch({ headless: true }); activeBrowser = browser;
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
  await context.addInitScript(() => { localStorage.setItem("santino_auth_v1", "1"); localStorage.setItem("santino_current_role_v1", "管理者"); });
  const page = await context.newPage();  const errors = []; const unexpected = [];
  page.on("pageerror", (error) => { console.error(`頁面錯誤 ${page.url()}: ${error.message}`); errors.push(error.message); });
  page.on("request", (request) => { if (/\/api\//.test(request.url()) || /^https?:/.test(request.url()) && !request.url().startsWith(base + "")) unexpected.push(request.url().replace(/\?.*$/, "")); });
  await page.goto(base + "/cases/");
  await page.getByRole("button", { name: "＋ 新增預約", exact: true }).click();
  await page.getByLabel("媽媽姓名", { exact: true }).fill("整合測試媽媽");
  await page.getByLabel("聯絡電話（展示資料）", { exact: true }).fill("DEMO-INTEGRATION");
  await page.getByLabel("預產期", { exact: true }).fill("2026-11-20");
  await page.getByLabel("參觀日期", { exact: true }).fill("2026-10-20");
  await page.getByRole("button", { name: "儲存預約", exact: true }).click();
  await page.getByLabel("參觀日期", { exact: true }).fill("2026-10-20");
  await page.getByRole("button", { name: /^預約完成/ }).click();


  await page.getByLabel("參觀出席", { exact: true }).selectOption("已出席");
  await page.getByRole("button", { name: /^參觀完成/ }).click();
  await page.getByLabel("收字第○號（合約編號）", { exact: true }).fill("DEMO-INTEGRATION");
  await page.getByLabel("訂金", { exact: true }).fill("30000");
  await page.getByRole("button", { name: /^下訂完成/ }).click();
  await page.getByRole("button", { name: "3. 審閱期與入住日", exact: true }).click();
  await page.getByLabel("簽約日", { exact: true }).fill("2026-10-20");
  await page.getByRole("button", { name: "4. 簽名", exact: true }).click();
  await page.getByRole("checkbox", { name: /母乳哺育意願書已完成確認/ }).check();
  await page.getByRole("button", { name: "確認對象並簽名", exact: true }).click();
  const canvas = page.getByLabel("手寫簽名區"); await canvas.scrollIntoViewIfNeeded(); const rect = await canvas.boundingBox();
  await page.mouse.move(rect.x + 30, rect.y + 40); await page.mouse.down(); await page.mouse.move(rect.x + 120, rect.y + 80, { steps: 8 }); await page.mouse.up();
  await page.getByRole("button", { name: "確認本筆簽名", exact: true }).click();
  /* 簽名一次多處帶入（客戶 2026-10-30）。
     ⚠️ 帶入的來源依身分分開：媽媽的簽名跟著病歷號、員工的跟著登入角色，
     所以剛剛那筆媽媽簽名**不會**出現在經辦人員欄——那正是要的行為。
     這裡驗的是同一位員工的第二次：先手寫一次，再開就該有「帶入上次簽名」。 */
  await page.getByRole("button", { name: "經辦人員簽名", exact: true }).click();
  assert.equal(await page.getByRole("button", { name: "帶入上次簽名", exact: true }).count(), 0, "媽媽的簽名不該帶到經辦人員欄");
  const staffCanvas = page.getByLabel("手寫簽名區"); await staffCanvas.scrollIntoViewIfNeeded(); const staffRect = await staffCanvas.boundingBox();
  await page.mouse.move(staffRect.x + 40, staffRect.y + 50); await page.mouse.down(); await page.mouse.move(staffRect.x + 150, staffRect.y + 90, { steps: 8 }); await page.mouse.up();
  await page.getByRole("button", { name: "確認本筆簽名", exact: true }).click();
  await page.getByRole("status").filter({ hasText: "經辦人員簽名已保存" }).waitFor();
  await page.getByRole("button", { name: "重新簽名（經辦人員）", exact: true }).click();
  await page.getByRole("button", { name: "帶入上次簽名", exact: true }).click();
  await page.getByRole("button", { name: "改成重新手寫", exact: true }).click();
  await page.getByRole("button", { name: "帶入上次簽名", exact: true }).click();
  await page.getByRole("button", { name: "確認帶入這個簽名", exact: true }).click();
  await page.getByRole("status").filter({ hasText: "經辦人員簽名已保存" }).waitFor();
  await page.getByRole("button", { name: /^合約完成/ }).click();
  await page.getByLabel("實際入住日", { exact: true }).fill("2026-10-16");
  await page.getByLabel("入住房號", { exact: true }).fill("303");
  await page.getByRole("button", { name: /^入住前完成/ }).click();
  const caseRecord = await page.evaluate(() => JSON.parse(localStorage.getItem("santino_domain_v1")).cases.find((item) => item.name === "整合測試媽媽"));
  assert.equal(caseRecord.stage, 5);
  await page.locator("#case-stage-3").getByRole("button", { name: /4\. 合約/ }).click();
  await page.locator("#case-stage-3").getByRole("button", { name: "5. 產生合約", exact: true }).click();
  await page.getByText("檢視原簽署快照 v1", { exact: true }).click();
  await page.screenshot({ path: `${output}/case-desktop.png`, fullPage: true });
  await page.goto(base + "/babycam/");
  const binding = await page.evaluate((id) => JSON.parse(localStorage.getItem("santino_domain_v1")).bindings.find((item) => item.caseId === id), caseRecord.id);
  await page.getByLabel("選擇入住案件", { exact: true }).selectOption(binding.id);
  await page.getByRole("link", { name: "寶寶登錄", exact: true }).click(); await page.getByRole("button", { name: "寶寶登錄與標籤", exact: true }).click();
  /* 表單改成「選了幾位就填幾組」（客戶 2026-10-30），欄位帶位次：第 1 位寶寶姓名／車號。
     預設是單胞胎一組。 */
  await page.getByLabel("第 1 位寶寶姓名", { exact: true }).fill("整合測試寶寶");
  await page.getByLabel("第 1 位車號", { exact: true }).fill("DEMO-99");
  // 監視器改以晶片網格挑選（原本是下拉）；挑一支未指派的。
  // 已指派的晶片 aria-label 會帶「（已指派）」，用 $ 結尾挑第一支還沒人用的。
  await page.getByRole("checkbox", { name: /^監視器 [AB]\d+$/ }).first().check();
  await page.getByRole("button", { name: "登錄這 1 位寶寶", exact: true }).click();
  const assigned = await page.evaluate((id) => JSON.parse(localStorage.getItem("santino_domain_v1")).bindings.find((item) => item.id === id), binding.id);
  assert.equal(assigned.babies.length, 1);
  await page.getByRole("button", { name: "產生標籤預覽", exact: true }).click();
  await page.getByAltText("寶寶 1 標籤預覽", { exact: true }).waitFor();
  const labelQr = await decodeQr(page.getByAltText("寶寶 1 標籤預覽", { exact: true }), true); assert.equal(labelQr.pathname, new URL(`${base}/babycam/scan/`).pathname); assert.equal(labelQr.searchParams.get("code"), assigned.babies[0].identityCode); assert.equal(labelQr.searchParams.has("ticket"), false);
  await page.screenshot({ path: `${output}/labels-desktop.png`, fullPage: true });
  await page.getByRole("link", { name: "入住登記", exact: true }).click(); await page.getByRole("button", { name: "入住登記", exact: true }).click(); // 櫃台只交付親友觀看連結（客戶 2026-10-29）；院內那張與「踢除親友登入」都已下架。
  const ticketQr = await decodeQr(page.getByAltText("可掃描的展示 QRCode", { exact: true }).first()); assert.equal(ticketQr.pathname, new URL(`${base}/view/family/`).pathname); assert.equal(ticketQr.searchParams.get("ticket"), assigned.familyTicket);
  assert.equal(await page.getByRole("button", { name: "踢除親友登入", exact: true }).count(), 0);
  await page.getByRole("link", { name: "入住登記", exact: true }).click(); await page.getByRole("button", { name: "紀錄與報表", exact: true }).click();
  await page.getByRole("button", { name: "操作", exact: true }).click();
  const downloadWait = page.waitForEvent("download"); await page.getByRole("button", { name: "匯出 Excel", exact: true }).click();
  const download = await downloadWait; await download.saveAs(`${output}/report.xlsx`);
  await page.goto(`${base}/view/family/?ticket=${encodeURIComponent(assigned.familyTicket)}`);
  await page.getByLabel("手機號碼", { exact: true }).fill("DEMO-INTEGRATION");
  await page.getByLabel("密碼", { exact: true }).fill(assigned.passcode);
  await page.getByRole("button", { name: "進入觀看", exact: true }).click();
  await page.getByRole("button", { name: "登出", exact: true }).waitFor();
  await page.getByRole("button", { name: "全螢幕", exact: true }).click();
  await page.waitForFunction(() => !!document.fullscreenElement, null, { timeout: 5000 }); await page.evaluate(() => document.exitFullscreen());
  await page.screenshot({ path: `${output}/family-view.png`, fullPage: true });
  assert.equal(await page.getByText("觀看授權已失效或尚未生效", { exact: true }).count(), 0);
  await page.goto(base + "/baby/");
  await page.getByRole("textbox", { name: "搜尋照護對象", exact: true }).fill("整合測試寶寶");
  await page.getByText("整合測試寶寶", { exact: true }).waitFor();
  assert.equal(await page.getByRole("dialog").count(), 0);
  assert.deepEqual(errors, []); assert.deepEqual(unexpected, []);
  await fs.writeFile(`${output}/result.json`, JSON.stringify({ passed: ["七階段至實際入住", "視訊登記自動建立", "寶寶指派寫入照護", "原版標籤產生", "真正 Excel 下載", "交付連結登入親友觀看", "無業務 API 或外部服務請求"], pageErrors: errors }, null, 2));
  console.log("整合情境 7 項通過，瀏覽器錯誤與業務 API／外部服務請求皆為 0。");
  await browser.close();
})().catch(async (error) => { console.error(error); await activeBrowser?.close(); process.exitCode = 1; });
