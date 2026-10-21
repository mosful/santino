const path = require("node:path");
const base = process.env.SANTINO_PREVIEW_BASE_URL || "http://localhost:4310";
let activeBrowser;
const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const output = path.join(process.env.SANTINO_QA_OUTPUT || path.resolve("test-results"), "babycam_followup");
(async () => {
  await fs.mkdir(output, { recursive: true });
  const browser = await chromium.launch({ headless: true }); activeBrowser = browser;
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
  await context.addInitScript(() => { localStorage.setItem("santino_auth_v1", "1"); localStorage.setItem("santino_current_role_v1", "管理者"); });
  const page = await context.newPage(); const errors = []; const requests = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("request", (request) => { if (/\/api\//.test(request.url()) || /^https?:/.test(request.url()) && !request.url().startsWith(base + "")) requests.push(request.url().replace(/\?.*$/, "")); });
  await page.goto(base + "/babycam/");
  await page.getByRole("link", { name: "寶寶登錄", exact: true }).click(); await page.getByRole("button", { name: "寶寶登錄與標籤", exact: true }).click();

  // 首次未寫入時，從畫面觸發共用資料保存。
  await page.getByLabel("新增或編輯寶寶", { exact: true }).selectOption({ index: 1 });
  await page.getByLabel("胎序（單胞胎 0）", { exact: true }).fill("1");
  await page.getByRole("button", { name: "儲存原寶寶指派", exact: true }).click();
  const data = await page.evaluate(() => JSON.parse(localStorage.getItem("santino_domain_v1")));
  const binding = data.bindings[0]; const first = binding.babies[0];
  assert.equal(first.birthOrder, 1);
  await page.getByLabel("新增或編輯寶寶", { exact: true }).selectOption("");
  await page.getByLabel("寶寶姓名", { exact: true }).fill("多胞胎測試二寶");
  await page.getByLabel("車號", { exact: true }).fill("TWINS99");
  await page.getByLabel("胎序（單胞胎 0）", { exact: true }).fill("2");
  const freeCamera = data.cameras.find((camera) => camera.enabled && !data.bindings.some((item) => !item.ended && item.babies.some((baby) => baby.cameraId === camera.id)));
  // 監視器改以晶片網格挑選（隱藏的 checkbox，aria-label 為「監視器 {代碼}」）。
  await page.getByRole("checkbox", { name: `監視器 ${freeCamera.code}`, exact: true }).check();
  await page.getByRole("button", { name: "指派新寶寶", exact: true }).click();
  await page.getByRole("button", { name: "產生標籤預覽", exact: true }).click();
  await page.getByAltText("寶寶 2 標籤預覽").waitFor();
  await page.goto(`${base}/babycam/scan/?code=${encodeURIComponent(first.identityCode)}`);
  await page.getByRole("button", { name: "核對並歸位", exact: true }).click();
  await page.getByRole("status").filter({ hasText: "身分核對通過" }).waitFor();
  // 掃碼頁現在直接落在「掃碼歸位核對」，要解除指派得先切到登錄頁籤。
  await page.getByRole("button", { name: "寶寶登錄與標籤", exact: true }).click();
  await page.getByLabel("新增或編輯寶寶", { exact: true }).selectOption(first.babyId);
  await page.getByRole("button", { name: "解除此寶寶指派", exact: true }).click();
  await page.getByRole("button", { name: "確認解除指派", exact: true }).click();
  // 再切回核對頁籤，確認該標籤已失效、不能再歸位。
  await page.getByRole("button", { name: "掃碼歸位核對", exact: true }).click();
  await page.getByRole("status").filter({ hasText: "此識別標籤已失效" }).waitFor();
  assert.equal(await page.getByRole("button", { name: "核對並歸位", exact: true }).count(), 0);
  await page.getByLabel("選擇入住案件", { exact: true }).selectOption(binding.id);
  await page.getByLabel("應歸位的寶寶", { exact: true }).selectOption({ index: 1 });
  await page.getByRole("button", { name: "核對並歸位", exact: true }).click();
  await page.getByRole("status").filter({ hasText: "識別不符" }).waitFor();
  const removed = await page.evaluate(() => JSON.parse(localStorage.getItem("santino_domain_v1")));
  assert.ok(removed.subjects.some((subject) => subject.id === first.babyId));
  assert.equal(removed.bindings[0].babies.length, 1);
  await page.getByRole("link", { name: "設定與維運", exact: true }).click(); await page.getByRole("button", { name: "狀態維護", exact: true }).click();
  await page.getByLabel("上傳親子同室背景圖", { exact: true }).setInputFiles({ name: "匿名測試.png", mimeType: "image/png", buffer: Buffer.from(await page.evaluate(() => { const canvas = document.createElement("canvas"); canvas.width = 100; canvas.height = 60; canvas.getContext("2d").fillRect(0, 0, 100, 60); return canvas.toDataURL().split(",")[1]; }), "base64") });
  // 背景圖改成卡片底圖（CSS background-image），不再是獨立的 <img> 預覽。
  await page.waitForFunction(() => {
    const input = document.querySelector('input[aria-label="親子同室 狀態名稱"]');
    const card = input?.closest("article");
    return !!card && /^url\("?blob:/.test(card.style.backgroundImage);
  });
  await page.reload();
  await page.getByRole("link", { name: "設定與維運", exact: true }).click(); await page.getByRole("button", { name: "狀態維護", exact: true }).click();
  // 背景圖改成卡片底圖（CSS background-image），不再是獨立的 <img> 預覽。
  await page.waitForFunction(() => {
    const input = document.querySelector('input[aria-label="親子同室 狀態名稱"]');
    const card = input?.closest("article");
    return !!card && /^url\("?blob:/.test(card.style.backgroundImage);
  });
  await page.getByRole("link", { name: "入住登記", exact: true }).click(); await page.getByRole("button", { name: "紀錄與報表", exact: true }).click();
  await page.getByRole("button", { name: "操作", exact: true }).click();
  await page.getByLabel("報表開始日期", { exact: true }).fill("2099-01-01");
  assert.equal(await page.locator("tbody tr").count(), 0);
  await page.getByLabel("報表開始日期", { exact: true }).fill("");
  assert.ok(await page.locator("tbody tr").count() > 0);
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "匯出 Excel", exact: true }).click();
  await (await downloadPromise).saveAs(`${output}/filtered-report.xlsx`);
  await page.screenshot({ path: `${output}/reports-desktop.png`, fullPage: true });
  assert.deepEqual(errors, []); assert.deepEqual(requests, []);
  const result = { checks: ["原指派編輯", "多胞胎個別胎序與標籤", "掃碼深連結核對", "解除指派保留照護對象且舊標籤失效", "背景圖本機保存與重整", "日期篩選與完整 Excel 匯出"], errors, requests };
  await fs.writeFile(`${output}/result.json`, JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result)); await browser.close();
})().catch(async (error) => { console.error(error); await activeBrowser?.close(); process.exitCode = 1; });
