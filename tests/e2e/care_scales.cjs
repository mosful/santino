const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const { chromium, webkit } = require("playwright");
const { PDFDocument } = require("pdf-lib");

const base = process.env.SANTINO_PREVIEW_BASE_URL || "http://localhost:4310";
const output = path.join(process.env.SANTINO_QA_OUTPUT || path.resolve("test-results"), "care_scales");
let activeBrowser;

async function openForm(page, name) {
  await page.getByRole("button", { name, exact: true }).first().click();
  await page.getByRole("heading", { name: name === "社會支持" ? "產婦家庭及社會支持量表" : "產後心情量表", exact: true }).waitFor();
}

async function answerFirstOption(page) {
  const groups = page.getByRole("radiogroup", { name: /^第 \d+ 題/ });
  for (let index = 0; index < await groups.count(); index += 1) await groups.nth(index).getByRole("radio").first().check();
}

async function checkLayout(page, engine, form, width, height) {
  await page.setViewportSize({ width, height });
  await page.evaluate(() => window.scrollTo(0, 0));
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `${engine} ${form} ${width} 不可水平溢出`);
  await page.screenshot({ path: path.join(output, `${engine}-${form}-${width}.png`), fullPage: true });
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
    await page.goto(`${base}/mama/`);

    await openForm(page, "社會支持");
    assert.equal(await page.getByRole("region", { name: "依紙本列印" }).count(), 0);
    assert.equal(await page.locator('img[alt*="原紙本"], iframe[title="紙本 PDF 預覽"]').count(), 0);
    await answerFirstOption(page);
    await page.getByText("14 分", { exact: true }).waitFor();
    for (const [width, height] of [[1440, 1000], [820, 1180], [390, 844]]) await checkLayout(page, engine, "social", width, height);
    await page.getByRole("button", { name: "列印空白表格", exact: true }).click();
    const socialPrint = page.locator("table").filter({ hasText: "我有能支持我的好朋友" });
    await socialPrint.waitFor();
    assert.equal(await socialPrint.locator("img, iframe").count(), 0);
    if (engine === "chromium") {
      const file = path.join(output, "social-blank-print.pdf");
      await page.emulateMedia({ media: "print" });
      await page.screenshot({ path: path.join(output, "social-blank-print.png"), fullPage: true });
      await page.pdf({ path: file, format: "A4", printBackground: true });
      await page.emulateMedia({ media: "screen" });
      assert.equal((await PDFDocument.load(await fs.readFile(file))).getPageCount(), 1);
    }
    await page.getByRole("button", { name: "回到填寫畫面", exact: true }).click();

    await openForm(page, "心情量表");
    await answerFirstOption(page);
    await page.getByText("21 分", { exact: true }).waitFor();
    for (const [width, height] of [[1440, 1000], [820, 1180], [390, 844]]) await checkLayout(page, engine, "mood", width, height);
    await page.getByRole("button", { name: "列印空白表格", exact: true }).click();
    const moodPrint = page.locator('[class*="scaleMoodPrint"]').filter({ hasText: "我能看到事物有趣的一面" });
    await moodPrint.waitFor();
    assert.equal(await moodPrint.locator("img, iframe").count(), 0);
    if (engine === "chromium") {
      const file = path.join(output, "mood-blank-print.pdf");
      await page.emulateMedia({ media: "print" });
      await page.screenshot({ path: path.join(output, "mood-blank-print.png"), fullPage: true });
      await page.pdf({ path: file, format: "A4", printBackground: true });
      await page.emulateMedia({ media: "screen" });
      assert.equal((await PDFDocument.load(await fs.readFile(file))).getPageCount(), 1);
    }
    assert.deepEqual(errors, []);
    results.push({ engine, socialScore: 14, moodScore: 21, layouts: [1440, 820, 390], scannedPreview: false });
    await browser.close();
    activeBrowser = undefined;
  }
  await fs.writeFile(path.join(output, "result.json"), JSON.stringify(results, null, 2));
  console.log("媽媽量表：Chromium／WebKit 原生填答、計分、空白列印及桌機／iPad／手機版面檢查通過。");
})().catch(async (error) => { console.error(error); await activeBrowser?.close(); process.exitCode = 1; });
