const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const { chromium, webkit } = require("playwright");

const base = process.env.SANTINO_PREVIEW_BASE_URL || "http://localhost:4310";
const output = path.join(process.env.SANTINO_QA_OUTPUT || path.resolve("test-results"), "case-form-layout");
const screenshots = process.env.SANTINO_LAYOUT_SCREENSHOTS === "1";
const layouts = [
  ["桌機", 1440, 1000, false],
  ["iPad橫向", 1180, 820, true],
  ["iPad直向", 820, 1180, true],
  ["平板窄幅", 768, 1024, true],
  ["手機", 390, 844, true],
];
const results = [];

// 量所有可見單行欄位，包含空值、有值、disabled 與通知單內的欄位。
// 不以「整頁沒溢出」代替驗收：欄位可能仍在頁內互相蓋住。
async function check(page, name) {
  const result = await page.evaluate(() => {
    const visible = (element) => element.getClientRects().length && getComputedStyle(element).visibility !== "hidden";
    const fields = [...document.querySelectorAll('main input:not([type="checkbox"]):not([type="radio"]):not([type="hidden"]):not([type="file"]), main select')].filter(visible);
    const defects = [];
    for (const field of fields) {
      const rect = field.getBoundingClientRect();
      const owner = field.closest("label") || field.parentElement;
      const bounds = owner.getBoundingClientRect();
      const label = field.getAttribute("aria-label") || owner.textContent.trim().slice(0, 24);
      if (rect.right > bounds.right + 1 || rect.left < bounds.left - 1) defects.push(`${label} 超出欄位容器`);
      if (field.classList.contains("form-control") && Math.abs(rect.height - 48) > 1) defects.push(`${label} 高度 ${rect.height}，預期 48`);
      if (field.classList.contains("form-control") && parseFloat(getComputedStyle(field).fontSize) < 16) defects.push(`${label} 字體小於 16px`);
    }
    for (let i = 0; i < fields.length; i++) for (let j = i + 1; j < fields.length; j++) {
      const a = fields[i].getBoundingClientRect(), b = fields[j].getBoundingClientRect();
      if (Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1) {
        defects.push(`欄位重疊：${fields[i].getAttribute("aria-label")} / ${fields[j].getAttribute("aria-label")}`);
      }
      const left = fields[i].closest("label"), right = fields[j].closest("label");
      if (left && right && left.parentElement === right.parentElement && getComputedStyle(left.parentElement).display === "grid") {
        const leftBounds = left.getBoundingClientRect(), rightBounds = right.getBoundingClientRect();
        const sameRow = Math.min(leftBounds.bottom, rightBounds.bottom) - Math.max(leftBounds.top, rightBounds.top) > 1;
        if (sameRow && Math.abs(a.top - b.top) > 1) defects.push(`同列欄位上下未對齊：${fields[i].getAttribute("aria-label")} / ${fields[j].getAttribute("aria-label")}`);
      }
    }
    for (const panel of [...document.querySelectorAll("section.case-document")].filter(visible)) {
      const rect = panel.getBoundingClientRect();
      const parent = panel.parentElement;
      const style = getComputedStyle(parent);
      const available = parent.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
      if (Math.abs(rect.width - available) > 2) defects.push(`通知單未使用整列寬度：${rect.width} / ${available}`);
      const grid = panel.querySelector(".case-document-fields");
      if (!grid || grid.getBoundingClientRect().width < 1) defects.push("通知單欄位未顯示");
    }
    if (document.documentElement.scrollWidth > innerWidth + 1) defects.push("整頁水平溢出");
    const dates = fields.filter((field) => field.getAttribute("type") === "date");
    if (CSS.supports("-webkit-touch-callout", "none")) for (const date of dates) {
      const style = getComputedStyle(date);
      if (parseFloat(style.paddingLeft) || parseFloat(style.paddingRight)) defects.push("iOS 日期欄位不應再有外層左右內距");
    }
    return { fields: fields.length, dates: dates.length, defects };
  });
  results.push({ name, ...result });
  assert.ok(result.fields > 0, `${name} 應有欄位可驗收`);
  assert.deepEqual(result.defects, [], `${name}：${result.defects.join("；")}`);
}

(async () => {
  await fs.mkdir(output, { recursive: true });
  for (const [engine, launcher] of Object.entries({ chromium, webkit })) {
    const browser = await launcher.launch();
    try {
      for (const [layout, width, height, touch] of layouts) {
        const context = await browser.newContext({ viewport: { width, height }, hasTouch: touch, isMobile: touch, locale: "zh-TW" });
        await context.addInitScript(() => {
          localStorage.setItem("santino_auth_v1", "1");
          localStorage.setItem("santino_current_role_v1", "櫃台");
          localStorage.setItem("santino_sidebar_collapsed_v1", "0");
        });
        const page = await context.newPage();
        const errors = [];
        page.on("pageerror", (error) => errors.push(error.message));
        const prefix = `${engine}-${layout}`;
        try {
          await page.goto(`${base}/cases/`);
          await page.getByRole("button", { name: "＋ 新增預約", exact: true }).click();
          await check(page, `${prefix}-新增預約日期空白`);
          await page.getByLabel("預產期", { exact: true }).fill("2027-01-18");
          await check(page, `${prefix}-新增預約日期有值`);
          if (screenshots && layout !== "平板窄幅") await page.screenshot({ path: path.join(output, `${prefix}-新增預約.png`) });
          if (width >= 768) {
            await page.getByRole("button", { name: "收合選單", exact: true }).click();
            await check(page, `${prefix}-新增預約選單收合`);
            await page.getByRole("button", { name: "展開選單", exact: true }).click();
          }
          for (const stage of ["appointment", "visit", "deposit", "contract", "preadmission"]) {
            await page.goto(`${base}/cases/detail/?id=case-demo-${stage}`);
            await page.getByLabel("媽媽姓名", { exact: true }).waitFor();
            await check(page, `${prefix}-${stage}-選單展開`);
            if (screenshots && stage === "appointment" && layout !== "平板窄幅") await page.screenshot({ path: path.join(output, `${prefix}-共通資料與預約.png`) });
            if (stage === "visit") {
              await page.getByRole("button", { name: "1. 預約", exact: true }).click();
              assert.ok(await page.locator('#case-stage-0 input:disabled').count(), "已完成預約應保持唯讀");
              await check(page, `${prefix}-已完成預約唯讀`);
            }
            if (width >= 768) {
              await page.getByRole("button", { name: "收合選單", exact: true }).click();
              await check(page, `${prefix}-${stage}-選單收合`);
              await page.getByRole("button", { name: "展開選單", exact: true }).click();
            }
            if (stage === "contract") {
              await page.getByRole("button", { name: "3. 審閱期與入住日", exact: true }).click();
              await check(page, `${prefix}-合約日期`);
              await page.getByLabel("簽約日", { exact: true }).fill("2026-11-02");
              await check(page, `${prefix}-合約日期有值`);
            }
            if (stage === "preadmission") {
              for (const doc of ["入住前關懷表單", "入住餐飲通知單", "嬰兒入住通知單", "入住資訊－保全部", "繳款通知單"]) {
                const link = page.getByRole("button", { name: doc, exact: true });
                // 各單據分屬不同時間軸項目，先確認實際入口存在。
                assert.equal(await link.count(), 1, `找不到單據入口：${doc}`);
                await link.click();
                const panel = page.getByRole("region", { name: doc, exact: true });
                await panel.waitFor();
                await check(page, `${prefix}-${doc}`);
                const date = panel.locator('input[type="date"]').first();
                if (await date.count()) {
                  await date.fill("2026-11-02");
                  await check(page, `${prefix}-${doc}-日期有值`);
                }
                if (screenshots && ["iPad橫向", "iPad直向", "手機", "桌機"].includes(layout)) {
                  if (await date.count()) await date.evaluate((field) => field.blur());
                  await panel.screenshot({ path: path.join(output, `${prefix}-${doc}.png`) });
                  await panel.evaluate((element) => window.scrollBy({ top: element.getBoundingClientRect().top - 96, behavior: "instant" }));
                  await page.screenshot({ path: path.join(output, `${prefix}-${doc}-畫面.png`) });
                }
                if (doc === "繳款通知單") {
                  await panel.getByLabel("繳款方式", { exact: true }).selectOption({ index: 1 });
                  await panel.getByRole("button", { name: `儲存${doc}`, exact: true }).click();
                  await page.getByRole("status").filter({ hasText: "已儲存" }).waitFor();
                  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("santino_domain_v1")).cases.find((item) => item.id === "case-demo-preadmission").documents);
                  assert.equal(saved["payment-notice"].values.method, "現金", "選單值應正確儲存");
                  assert.equal(saved["payment-notice"].values.dueDate, "2026-11-02", "日期值應正確儲存");
                }
                await panel.getByRole("button", { name: `收起${doc}`, exact: true }).click();
              }
            }
          }
          assert.deepEqual(errors, [], `${prefix} 不得有頁面錯誤`);
        } finally { await context.close(); }
      }
    } finally { await browser.close(); }
  }
  console.log(`案件表單版面驗收通過：${results.length} 次檢查，Chromium／WebKit × 桌機／iPad 橫直向／窄平板／手機。`);
})().catch((error) => { console.error(error); process.exitCode = 1; }).finally(async () => {
  await fs.writeFile(path.join(output, "results.json"), JSON.stringify(results, null, 2));
});
