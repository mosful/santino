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
  const signatureButton = page.getByRole("button", { name: "確認對象並簽名", exact: true });
  assert.equal(await signatureButton.isDisabled(), true, "未確認填表人身分前不應開始書寫簽名");
  await page.getByRole("button", { name: "前往填表人欄位", exact: true }).click();
  await page.getByRole("radiogroup", { name: "身分", exact: true }).getByRole("radio", { name: "孕婦本人", exact: true }).check();
  assert.equal(await signatureButton.isEnabled(), true);
  await signatureButton.click();
  const signatureCanvas = page.getByLabel("手寫簽名區", { exact: true });
  await signatureCanvas.scrollIntoViewIfNeeded();
  const signatureBox = await signatureCanvas.boundingBox();
  await page.mouse.move(signatureBox.x + 30, signatureBox.y + 30); await page.mouse.down(); await page.mouse.move(signatureBox.x + 120, signatureBox.y + 70, { steps: 6 }); await page.mouse.up();
  await page.getByRole("button", { name: "確認本筆簽名", exact: true }).click();
  await page.getByRole("status").filter({ hasText: "已保存此個案本筆簽名" }).waitFor();
  const relatedPanel = page.getByRole("region", { name: "同案件媽媽／寶寶", exact: true });
  const historyPanel = page.getByRole("group", { name: "最近操作歷程", exact: true });
  assert.equal(await historyPanel.evaluate((element) => element.open), false, "最近操作歷程預設應收合");
  const relatedBox = await relatedPanel.boundingBox(); const historyBox = await historyPanel.boundingBox();
  assert.ok(relatedBox.width > historyBox.width * 1.5, "桌機上同案件區塊應明顯比歷程寬");
  await historyPanel.locator("summary").click();
  assert.equal(await historyPanel.evaluate((element) => element.open), true, "歷程應可點擊展開");
  await page.getByRole("navigation", { name: "表單區段" }).getByRole("button", { name: "入住護理紀錄", exact: true }).click();
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
  await page.getByRole("radiogroup", { name: "身體姿勢 1", exact: true }).getByLabel("肩膀僵硬，身體傾向新生兒", { exact: true }).check();
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
