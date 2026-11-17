const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const { chromium, webkit } = require("playwright");

const base = process.env.SANTINO_PREVIEW_BASE_URL || "http://localhost:4310";
const output = path.join(process.env.SANTINO_QA_OUTPUT || path.resolve("test-results"), "care_paper_editors");
const layouts = [["desktop", 1440, 1000], ["ipad-landscape", 1180, 820], ["ipad-portrait", 820, 1180], ["mobile", 390, 844]];
let activeBrowser;

async function capture(page, engine, form, layout, width, height) {
  await page.setViewportSize({ width, height });
  await page.evaluate(() => scrollTo(0, 0));
  await page.mouse.move(0, 0);
  await page.waitForTimeout(350);
  assert.equal(await page.evaluate(() => window.scrollX), 0, `${engine} ${form} ${layout} 不可橫向捲動整頁`);
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${engine} ${form} ${layout} 不可水平溢出`);
  await page.screenshot({ path: path.join(output, `${engine}-${form}-${layout}.png`), fullPage: true });
}

(async () => {
  await fs.mkdir(output, { recursive: true });
  const results = [];
  for (const [engine, launcher] of [["chromium", chromium], ["webkit", webkit]]) {
    const browser = await launcher.launch({ headless: true });
    activeBrowser = browser;
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    await context.addInitScript(() => {
      localStorage.setItem("santino_auth_v1", "1");
      localStorage.setItem("santino_current_role_v1", "管理者");
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(`${base}/baby/`);

    await page.getByRole("button", { name: "每日照護", exact: true }).first().click();
    const daily = page.locator('[data-care-sheet="baby-daily"]');
    await daily.getByRole("heading", { name: "新生兒每日評估照護單", exact: true }).waitFor();
    assert.equal(await daily.locator("table thead tr").nth(1).locator("th").count(), 15, "每日照護應保留五日乘 N／D／E 三班矩陣");
    for (const text of ["日期", "入住日數", "班別／時間", "活動力", "吸吮力", "皮膚（有左列狀況打勾）", "臍帶", "紅臀", "親子同室持續時間", "照護問題（措施評值及護理紀錄）", "照護人員簽章"]) assert.ok(await daily.getByText(text, { exact: true }).count() >= 1, text);
    for (const [layout, width, height] of layouts) await capture(page, engine, "baby-daily", layout, width, height);

    await page.getByRole("button", { name: "入住評估", exact: true }).first().click();
    const admission = page.locator('[data-care-sheet="baby-admission"]');
    await admission.getByRole("heading", { name: "新生兒入住評估單", exact: true }).waitFor();
    assert.equal(await admission.getAttribute("data-paper-page"), "1");
    for (const [layout, width, height] of layouts) await capture(page, engine, "baby-admission-page1", layout, width, height);

    await page.getByRole("navigation", { name: "表單區段" }).getByRole("button", { name: "身體評估", exact: true }).click();
    await admission.getByRole("heading", { name: "新生兒入住身體狀況評估單", exact: true }).waitFor();
    assert.equal(await admission.getAttribute("data-paper-page"), "2");
    for (const [layout, width, height] of layouts) await capture(page, engine, "baby-admission-page2", layout, width, height);

    assert.deepEqual(errors, []);
    results.push({ engine, forms: ["新生兒每日評估照護單", "新生兒入住評估單", "新生兒入住身體狀況評估單"], layouts: layouts.map(([name]) => name), errors });
    await browser.close();
    activeBrowser = undefined;
  }
  await fs.writeFile(path.join(output, "result.json"), JSON.stringify(results, null, 2));
  console.log("寶寶紙本填寫：Chromium／WebKit 三張表與桌機、iPad 直橫、手機版面檢查通過。");
})().catch(async (error) => { console.error(error); await activeBrowser?.close(); process.exitCode = 1; });
