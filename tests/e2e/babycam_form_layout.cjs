const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const { chromium, webkit } = require("playwright");
const base = process.env.SANTINO_PREVIEW_BASE_URL || "http://localhost:4310";
const output = path.join(process.env.SANTINO_QA_OUTPUT || path.resolve("test-results"), "babycam-form-layout");
const screenshots = process.env.SANTINO_LAYOUT_SCREENSHOTS === "1";
const layouts = [["桌機", 1440, 1000, false], ["iPad橫向", 1180, 820, true], ["iPad直向", 820, 1180, true], ["平板窄幅", 768, 1024, true], ["手機", 390, 844, true]];
const results = [];

async function check(page, name) {
  const result = await page.evaluate(() => {
    const defects = [];
    const fields = [...document.querySelectorAll('main input:not([type="checkbox"]):not([type="radio"]):not([type="hidden"]), main select')].filter((field) => field.getClientRects().length);
    for (const field of fields) {
      const rect = field.getBoundingClientRect(), owner = (field.closest("label") || field.parentElement).getBoundingClientRect();
      const label = field.getAttribute("aria-label");
      if (Math.abs(rect.height - 48) > 1) defects.push(`${label} 高度 ${rect.height}`);
      if (parseFloat(getComputedStyle(field).fontSize) < 16) defects.push(`${label} 字級不足 16px`);
      if (rect.left < owner.left - 1 || rect.right > owner.right + 1) defects.push(`${label} 超出容器`);
    }
    const dates = [...document.querySelectorAll('input[aria-label="出生日期"]')];
    const zones = [...document.querySelectorAll('fieldset[aria-label="監視器分區"] button')];
    const controls = [...fields, ...zones];
    for (let i = 0; i < controls.length; i++) for (let j = i + 1; j < controls.length; j++) {
      const a = controls[i].getBoundingClientRect(), b = controls[j].getBoundingClientRect();
      if (Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1) defects.push("欄位或日期與分區按鈕重疊");
    }
    for (const date of dates) if (date.getBoundingClientRect().right > innerWidth + 1) defects.push("日期超出畫面");
    if (document.documentElement.scrollWidth > innerWidth + 1) defects.push("整頁水平溢出");
    return { fields: fields.length, defects };
  });
  results.push({ name, ...result });
  assert.ok(result.fields >= 5, `${name} 須顯示入住案件、出生日期與寶寶欄位`);
  assert.deepEqual(result.defects, [], `${name}：${result.defects.join("；")}`);
}

(async () => {
  await fs.mkdir(output, { recursive: true });
  for (const [engine, launcher] of Object.entries({ chromium, webkit })) {
    const browser = await launcher.launch();
    try {
      for (const role of ["護理師 陳護理師", "管理者"]) for (const [layout, width, height, touch] of layouts) {
        const context = await browser.newContext({ viewport: { width, height }, hasTouch: touch, isMobile: touch, locale: "zh-TW" });
        await context.addInitScript((role) => {
          localStorage.setItem("santino_auth_v1", "1");
          localStorage.setItem("santino_current_role_v1", role);
          localStorage.setItem("santino_sidebar_collapsed_v1", "0");
        }, role);
        const page = await context.newPage(), errors = [];
        page.on("pageerror", (error) => errors.push(error.message));
        const prefix = `${engine}-${role}-${layout}`;
        try {
          await page.goto(`${base}/babycam/?section=assign`);
          await page.waitForLoadState("networkidle");
          const editor = page.getByRole("region", { name: "寶寶登錄表單", exact: true });
          await editor.waitFor();
          const bindingId = await page.getByLabel("選擇入住案件", { exact: true }).inputValue();
          assert.ok(bindingId);
          for (const [kind, count] of [["單胞胎", 1], ["雙胞胎", 2], ["多胞胎", 3]]) {
            await editor.getByRole("button", { name: kind, exact: true }).click();
            assert.equal(await editor.getByLabel(/第 \d+ 位寶寶姓名/, { exact: true }).count(), count);
            await check(page, `${prefix}-${kind}-側欄展開`);
            if (width >= 768) {
              await page.getByRole("button", { name: "收合選單", exact: true }).click();
              await check(page, `${prefix}-${kind}-側欄收合`);
              await page.getByRole("button", { name: "展開選單", exact: true }).click();
            }
          }
          for (const count of [3, 4, 5, 6]) {
            await page.getByLabel("多胞胎人數", { exact: true }).selectOption(String(count));
            assert.equal(await editor.getByLabel(/第 \d+ 位寶寶姓名/, { exact: true }).count(), count);
            await check(page, `${prefix}-多胞胎${count}位`);
          }
          await editor.getByRole("button", { name: "單胞胎", exact: true }).click();
          const date = page.getByLabel("出生日期", { exact: true });
          await date.fill("");
          await check(page, `${prefix}-出生日期空白`);
          await date.fill("2026-08-12");
          const zones = page.getByRole("group", { name: "監視器分區", exact: true });
          for (const zone of ["全部", "A", "B"]) {
            const button = zones.getByRole("button", { name: zone, exact: true });
            await button.click();
            assert.equal(await button.getAttribute("aria-pressed"), "true");
            await check(page, `${prefix}-監視器分區${zone}`);
          }
          if (screenshots && layout !== "平板窄幅") {
            await date.evaluate((field) => field.blur());
            await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
            await page.screenshot({ path: path.join(output, `${prefix}-寶寶登錄.png`), animations: "disabled" });
          }
          await page.getByRole("button", { name: "儲存這 1 位的資料", exact: true }).click();
          await page.getByRole("status").filter({ hasText: "已登錄 1 位寶寶" }).waitFor();
          const saved = await page.evaluate((id) => {
            const domain = JSON.parse(localStorage.getItem("santino_domain_v1"));
            const binding = domain.bindings.find((item) => item.id === id);
            return domain.subjects.find((item) => item.id === binding.babies[0].babyId).birthDate;
          }, bindingId);
          assert.equal(saved, "2026-08-12", "日期須正確寫入寶寶資料");
          const reopened = await context.newPage();
          reopened.on("pageerror", (error) => errors.push(error.message));
          await reopened.goto(`${base}/babycam/?section=assign`);
          assert.equal(await reopened.getByLabel("出生日期", { exact: true }).inputValue(), "2026-08-12");
          await reopened.close();
          assert.deepEqual(errors, [], `${prefix} 不得有頁面錯誤`);
        } finally { await context.close(); }
      }
    } finally { await browser.close(); }
  }
  console.log(`寶寶登錄版面驗收通過：${results.length} 次，Chromium／WebKit × 護理師／管理者 × 5 種尺寸，含單胞／雙胞／3–6 胞胎、日期、分區與儲存。`);
})().catch((error) => { console.error(error); process.exitCode = 1; }).finally(async () => {
  await fs.writeFile(path.join(output, "results.json"), JSON.stringify(results, null, 2));
});
