const assert = require("node:assert/strict");
const { chromium, webkit } = require("playwright");

const base = process.env.SANTINO_PREVIEW_BASE_URL;

(async () => {
  assert.ok(base, "請透過 npm run test:e2e 啟動靜態站台");
  for (const [engine, browserType] of [["chromium", chromium], ["webkit", webkit]]) {
    const browser = await browserType.launch();
    try {
      for (const [width, height] of [[820, 1180], [1180, 820]]) {
        const context = await browser.newContext({ viewport: { width, height }, hasTouch: true });
        try {
          await context.addInitScript(() => {
            localStorage.setItem("santino_auth_v1", "1");
            localStorage.setItem("santino_current_role_v1", "管理者");
          });
          const page = await context.newPage();
          await page.goto(`${base}/customer/`);
          await page.getByRole("button", { name: /管理者/ }).waitFor();
          await page.getByRole("button", { name: "＋ 新增客戶", exact: true }).waitFor();
          await page.locator("tbody tr[role=button]").first().click();
          await page.getByRole("button", { name: "刪除客戶", exact: true }).click();
          const confirmation = page.getByRole("dialog", { name: "確認刪除", exact: true });
          await confirmation.waitFor();
          const ids = await page.locator("[role=dialog]").evaluateAll((dialogs) => dialogs.map((dialog) => dialog.getAttribute("aria-labelledby")));
          assert.equal(ids.length, 2);
          assert.equal(new Set(ids).size, 2, "同時開啟的對話框應各有標題識別碼");
          const bounds = await confirmation.boundingBox();
          assert.ok(bounds && bounds.x >= 0 && bounds.x + bounds.width <= width + 1, `${engine} 對話框超出畫面`);
          await confirmation.getByRole("button", { name: "取消", exact: true }).click();
          assert.equal(await confirmation.count(), 0);
        } finally { await context.close(); }
      }
    } finally { await browser.close(); }
  }
  console.log("客戶巢狀對話框：Chromium／WebKit、iPad 直橫向均通過。");
})().catch((error) => { console.error(error); process.exitCode = 1; });
