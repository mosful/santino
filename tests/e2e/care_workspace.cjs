const path = require("node:path");
const base = process.env.SANTINO_PREVIEW_BASE_URL || "http://localhost:4310";
let activeBrowser;
const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const output = path.join(process.env.SANTINO_QA_OUTPUT || path.resolve("test-results"), "care_workspace");

(async () => {
  await fs.mkdir(output, { recursive: true });
  const browser = await chromium.launch({ headless: true }); activeBrowser = browser;
  const errors = [];
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await context.addInitScript(() => {
    localStorage.setItem("santino_auth_v1", "1");
    if (!localStorage.getItem("santino_current_role_v1")) localStorage.setItem("santino_current_role_v1", "管理者");
  });
  const page = await context.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(base + "/mama/");
  await page.getByRole("button", { name: "入住評估", exact: true }).first().click();
  await page.getByLabel("入住護理紀錄（必填）", { exact: true }).fill("完整頁面測試：已完成入住護理評估。");
  assert.equal(await page.getByRole("dialog").count(), 0);
  await page.getByRole("button", { name: "暫存", exact: true }).click();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: `${output}/mama-desktop.png`, fullPage: true });
  await page.reload();
  await page.getByRole("button", { name: "入住護理紀錄", exact: true }).click();
  assert.equal(await page.getByLabel("入住護理紀錄（必填）", { exact: true }).inputValue(), "完整頁面測試：已完成入住護理評估。");
  await page.getByRole("button", { name: "完成簽出", exact: true }).click();
  await page.getByLabel("頁內操作確認").getByRole("button", { name: "確認", exact: true }).click();
  await page.getByText("已簽出紀錄（1）", { exact: true }).waitFor();
  await page.goto(base + "/baby/");
  await page.getByRole("button", { name: "哺餵母乳評估", exact: true }).first().click();
  const unlock = page.getByRole("button", { name: "解鎖此對象", exact: true });
  if (await unlock.count()) {
    await unlock.click();
    await page.getByLabel("頁內操作確認").getByRole("button", { name: "確認", exact: true }).click();
  }
  await page.getByLabel("含乳姿勢", { exact: true }).selectOption("再評估");
  await page.getByLabel("再評估護理紀錄（必填）", { exact: true }).fill("再評估情境：已於同頁記錄媽媽護理內容。");
  assert.equal(await page.getByRole("dialog").count(), 0);
  await page.getByRole("button", { name: "暫存", exact: true }).click();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: `${output}/baby-desktop.png`, fullPage: true });
  for (const [name, width, height] of [["ipad", 820, 1180], ["mobile", 390, 844]]) {
    await page.setViewportSize({ width, height });
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: `${output}/baby-${name}.png`, fullPage: true });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `${name} 不可水平溢出`);
  }
  assert.deepEqual(errors, []);
  await fs.writeFile(`${output}/result.json`, JSON.stringify({ passed: ["完整頁面無表單彈窗", "媽媽草稿重整恢復", "媽媽簽出歷史", "哺餵再評估同頁紀錄", "iPad 無水平溢出", "手機無水平溢出"], pageErrors: errors }, null, 2));
  console.log("照護完整頁面：6 項瀏覽器檢查通過，頁面錯誤 0。");
  await browser.close();
})().catch(async (error) => { console.error(error); await activeBrowser?.close(); process.exitCode = 1; });
