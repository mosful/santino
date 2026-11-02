const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const { chromium, webkit } = require("playwright");
const base = process.env.SANTINO_PREVIEW_BASE_URL || "http://localhost:4310";
const output = path.join(process.env.SANTINO_QA_OUTPUT || path.resolve("test-results"), "care-form-layout");
const screenshots = process.env.SANTINO_LAYOUT_SCREENSHOTS === "1";
const layouts = [["桌機", 1440, 1000, false], ["iPad橫向", 1180, 820, true], ["iPad直向", 820, 1180, true], ["平板窄幅", 768, 1024, true], ["手機", 390, 844, true]];
const forms = {
  mama: ["入住評估", "持續護理", "媽媽護理紀錄", "社會支持", "心情量表", "護理指導單"],
  baby: ["入住評估", "寶寶護理紀錄", "每日照護", "哺餵母乳評估", "成長日記", "寶寶身體照片", "I/O", "護理指導單"],
};
const results = [];
const formButton = (page, label) => page.getByRole("navigation", { name: "此對象的照護表單", exact: true }).getByRole("button", { name: new RegExp(`^${label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?: · 草稿| ✓)?$`) });

async function capture(page, panel, name) {
  if (!screenshots) return;
  await panel.evaluate((article) => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    const header = document.querySelector("#app-header-slot").parentElement;
    window.scrollBy({ top: article.getBoundingClientRect().top - header.getBoundingClientRect().height - 12, behavior: "instant" });
  });
  await page.screenshot({ path: path.join(output, `${name.replaceAll("/", "-")}.png`) });
}

async function checkReadOnlySections(page, panel, prefix, width, layout) {
  const sections = panel.getByRole("navigation", { name: "表單區段" }).getByRole("button");
  const count = await sections.count();
  for (let index = 0; index < Math.max(count, 1); index++) {
    if (count) await sections.nth(index).click();
    const section = count ? await sections.nth(index).getAttribute("aria-label") : "主要內容";
    assert.ok(await panel.locator("fieldset:disabled").count(), `${prefix}-${section} 須維持唯讀`);
    assert.equal(await panel.locator('[data-care-field] :is(input, select, textarea):enabled').count(), 0, "唯讀欄位不得因版面修正變成可編輯");
    await check(panel, `${prefix}-${section}-唯讀選單收合`);
    if (width >= 768) {
      await page.getByRole("button", { name: "展開選單", exact: true }).click();
      await check(panel, `${prefix}-${section}-唯讀選單展開`);
      await page.getByRole("button", { name: "收合選單", exact: true }).click();
    }
    if (layout !== "平板窄幅") await capture(page, panel, `${prefix}-${section}-唯讀`);
  }
}

async function check(panel, name) {
  const result = await panel.evaluate((article) => {
    const defects = [];
    const fields = [...article.querySelectorAll('[data-care-field] input:not([type="checkbox"]):not([type="radio"]):not([type="file"]), [data-care-field] select')].filter((field) => field.getClientRects().length);
    for (const field of fields) {
      const rect = field.getBoundingClientRect(), owner = field.closest("[data-care-field]").getBoundingClientRect();
      const label = field.labels?.[0]?.textContent || field.id;
      if (Math.abs(rect.height - 48) > 1) defects.push(`${label} 高度 ${rect.height}`);
      if (parseFloat(getComputedStyle(field).fontSize) < 16) defects.push(`${label} 字體不足 16px`);
      if (rect.left < owner.left - 1 || rect.right > owner.right + 1) defects.push(`${label} 超出欄位`);
    }
    for (let i = 0; i < fields.length; i++) for (let j = i + 1; j < fields.length; j++) {
      const a = fields[i].getBoundingClientRect(), b = fields[j].getBoundingClientRect();
      if (Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1) defects.push(`${fields[i].id} 與 ${fields[j].id} 重疊`);
      const left = fields[i].closest("[data-care-field]"), right = fields[j].closest("[data-care-field]");
      if (left.parentElement === right.parentElement) {
        const x = left.getBoundingClientRect(), y = right.getBoundingClientRect();
        if (Math.min(x.bottom, y.bottom) - Math.max(x.top, y.top) > 1 && Math.abs(a.top - b.top) > 1) defects.push(`${fields[i].id} 與 ${fields[j].id} 同列未對齊`);
      }
    }
    const rect = article.getBoundingClientRect();
    if (Math.abs(rect.width - article.parentElement.clientWidth) > 2) defects.push("主表單未使用整列寬度");
    const context = article.parentElement.querySelector("aside");
    if (context && context.getBoundingClientRect().top < rect.bottom - 1) defects.push("輔助資訊仍占用主表單右側空間");
    if (document.documentElement.scrollWidth > innerWidth + 1) defects.push("整頁水平溢出");
    return { fields: fields.length, defects };
  });
  results.push({ name, ...result });
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
          localStorage.setItem("santino_current_role_v1", "護理師 陳護理師");
          localStorage.setItem("santino_sidebar_collapsed_v1", "0");
        });
        const errors = [];
        let page;
        const prefix = `${engine}-${layout}`;
        try {
          for (const [kind, labels] of Object.entries(forms)) {
            if (page) await page.close();
            page = await context.newPage();
            page.on("pageerror", (error) => errors.push(error.message));
            await page.goto(`${base}/${kind}/`);
            await page.waitForLoadState("networkidle");
            await page.getByRole("button", { name: "入住評估", exact: true }).first().waitFor();
            // 改開另一間寶寶，確認媽媽仍持有編輯鎖時先顯示唯讀，再從既有入口解鎖。
            await page.getByRole("button", { name: "入住評估", exact: true }).nth(kind === "baby" ? 1 : 0).click();
            for (const label of labels) {
              await formButton(page, label).click();
              const panel = page.getByRole("article", { name: `${label}表單`, exact: true });
              await panel.waitFor();
              const unlock = page.getByRole("button", { name: "解鎖此對象", exact: true });
              if (kind === "baby" && label === "入住評估") assert.equal(await unlock.count(), 1, "另一案件須先經解鎖才能編輯");
              if (await unlock.count()) {
                assert.ok(await panel.locator("fieldset:disabled").count(), "解鎖前須維持唯讀");
                await check(panel, `${prefix}-${kind}-${label}-唯讀`);
                await unlock.click();
                await page.getByLabel("頁內操作確認").getByRole("button", { name: "確認", exact: true }).click();
              }
              const sections = panel.getByRole("navigation", { name: "表單區段" }).getByRole("button");
              const count = await sections.count();
              for (let index = 0; index < Math.max(count, 1); index++) {
                if (count) await sections.nth(index).click();
                await check(panel, `${prefix}-${kind}-${label}-${index}-選單展開`);
                if (width >= 768) {
                  await page.getByRole("button", { name: "收合選單", exact: true }).click();
                  await check(panel, `${prefix}-${kind}-${label}-${index}-選單收合`);
                  await page.getByRole("button", { name: "展開選單", exact: true }).click();
                }
                const dates = panel.locator('[data-care-field] input[type="date"]:visible');
                if (await dates.count()) {
                  const before = await dates.first().inputValue();
                  await dates.first().fill("");
                  await check(panel, `${prefix}-${kind}-${label}-${index}-日期空白`);
                  await dates.first().fill(before || "2026-11-02");
                }
                if (screenshots && index === 0 && kind === "baby" && layout !== "平板窄幅") {
                  await capture(page, panel, `${prefix}-${label}`);
                }
              }
            }
            if (kind === "baby" && engine === "chromium" && layout === "iPad橫向") {
              await formButton(page, "寶寶身體照片").click();
              const png = await page.evaluate(() => {
                const canvas = document.createElement("canvas"); canvas.width = 32; canvas.height = 32;
                canvas.getContext("2d").fillRect(0, 0, 32, 32);
                return canvas.toDataURL().split(",")[1];
              });
              await page.locator('input[type="file"]').setInputFiles({ name: "匿名測試照片.png", mimeType: "image/png", buffer: Buffer.from(png, "base64") });
              await page.getByAltText("目前個案的本機照護照片", { exact: true }).waitFor();
            }
            await formButton(page, kind === "baby" ? "I/O" : "媽媽護理紀錄").click();
            await page.getByLabel("紀錄日期（必填）", { exact: true }).fill("2026-11-02");
            await page.getByLabel("紀錄時間（必填）", { exact: true }).fill("10:30");
            assert.equal(await page.getByLabel("紀錄時間（必填）", { exact: true }).inputValue(), "10:30", "時間欄位應可操作");
            await page.getByRole("button", { name: "暫存", exact: true }).click();
            // 既有規則：暫存時紀錄時間更新為實際暫存時間，日期保留自行選擇的值。
            const savedAt = await page.evaluate((kind) => {
              const care = JSON.parse(localStorage.getItem("santino_care_workspace_v1"));
              return care.documents[care.active[kind]].savedAt;
            }, kind);
            const savedTime = new Date(savedAt).toLocaleTimeString("en-GB", { timeZone: "Asia/Taipei", hour12: false }).slice(0, 5);
            // 以新分頁重開驗證持久化，避免 Windows WebKit 在文件替換時誤報預載入錯誤
            // （Playwright #43120）；既有 care_workspace／care_settings 仍驗證 reload。
            const reopened = await context.newPage();
            reopened.on("pageerror", (error) => errors.push(error.message));
            await reopened.goto(`${base}/${kind}/`);
            assert.equal(await reopened.getByLabel("紀錄日期（必填）", { exact: true }).inputValue(), "2026-11-02");
            assert.equal(await reopened.getByLabel("紀錄時間（必填）", { exact: true }).inputValue(), savedTime);
            await reopened.close();
          }
          // 重現客戶照片：同時開兩間媽媽的房間，解鎖第二間，再切回第一間檢查唯讀表單。
          await page.close();
          page = await context.newPage();
          page.on("pageerror", (error) => errors.push(error.message));
          await page.goto(`${base}/mama/`);
          await page.waitForLoadState("networkidle");
          await page.getByRole("button", { name: "回列表", exact: true }).click();
          await page.getByRole("button", { name: "入住評估", exact: true }).nth(1).click();
          const unlock = page.getByRole("button", { name: "解鎖此對象", exact: true });
          if (await unlock.count()) {
            await unlock.click();
            await page.getByLabel("頁內操作確認").getByRole("button", { name: "確認", exact: true }).click();
          }
          const rooms = page.getByRole("navigation", { name: "開啟中的照護對象", exact: true }).locator('button[title^="切換到"]');
          assert.equal(await rooms.count(), 2, "應保留兩間媽媽的房間");
          await rooms.first().click();
          assert.equal(await page.getByRole("button", { name: "解鎖此對象", exact: true }).count(), 1, "切回第一間應為唯讀");
          if (width >= 768) await page.getByRole("button", { name: "收合選單", exact: true }).click();
          for (const label of forms.mama) {
            await formButton(page, label).click();
            await checkReadOnlySections(page, page.getByRole("article", { name: `${label}表單`, exact: true }), `${prefix}-mama-${label}`, width, layout);
          }
          await page.close();
          page = await context.newPage();
          page.on("pageerror", (error) => errors.push(error.message));
          await page.goto(`${base}/baby/`);
          await page.waitForLoadState("networkidle");
          await page.getByRole("button", { name: "回列表", exact: true }).click();
          await page.getByRole("button", { name: "入住評估", exact: true }).first().click();
          if (width >= 768) await page.getByRole("button", { name: "收合選單", exact: true }).click();
          await checkReadOnlySections(page, page.getByRole("article", { name: "入住評估表單", exact: true }), `${prefix}-baby-入住評估`, width, layout);
          assert.deepEqual(errors, [], `${prefix} 不得有頁面錯誤`);
        } finally { await context.close(); }
      }
    } finally { await browser.close(); }
  }
  console.log(`照護表單版面驗收通過：${results.length} 次檢查，媽媽 6 張／寶寶 8 張及各區段，Chromium／WebKit × 5 種尺寸。`);
})().catch((error) => { console.error(error); process.exitCode = 1; }).finally(async () => {
  await fs.writeFile(path.join(output, "results.json"), JSON.stringify(results, null, 2));
});
