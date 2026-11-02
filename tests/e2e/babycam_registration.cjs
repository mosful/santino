const { chromium, webkit } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const base = process.env.SANTINO_PREVIEW_BASE_URL || "http://localhost:4310";
const output = path.join(process.env.SANTINO_QA_OUTPUT || path.resolve("test-results"), "babycam_registration");
let browser;

(async () => {
  await fs.mkdir(output, { recursive: true });
  const errors = [];
  async function contextFor(launcher, role) {
    const context = await launcher.newContext({ viewport: { width: 1440, height: 1000 }, hasTouch: true });
    await context.addInitScript((current) => { localStorage.setItem("santino_auth_v1", "1"); localStorage.setItem("santino_current_role_v1", current); }, role);
    return context;
  }
  async function visit(page, url) { await page.goto(url); await page.waitForLoadState("networkidle"); }

  for (const [engine, launcher] of [["chromium", chromium], ["webkit", webkit]]) {
    browser = await launcher.launch({ headless: true });
    const context = await contextFor(browser, "管理者");
    const page = await context.newPage();
    page.on("pageerror", (error) => errors.push(`${engine}: ${error.message}`));
    await visit(page, `${base}/babycam/`);
    const before = await page.evaluate(() => JSON.parse(localStorage.getItem("santino_domain_v1")));
    const target = before.bindings.find((binding) => !binding.ended && binding.babies.length);
    await page.getByRole("button", { name: "入住狀態", exact: true }).click();
    await page.getByRole("button", { name: `編輯 ${target.motherName} 的入住登記`, exact: true }).click();
    assert.equal(await page.getByLabel("選擇入住案件", { exact: true }).inputValue(), target.id);
    const name = `入住編輯測試媽媽-${engine}`;
    await page.getByLabel("入住媽媽姓名", { exact: true }).fill(name);
    await page.getByRole("button", { name: "儲存入住基本資料", exact: true }).click();
    await page.getByRole("status").filter({ hasText: "入住基本資料已儲存" }).waitFor();
    const edited = await page.evaluate(() => JSON.parse(localStorage.getItem("santino_domain_v1")));
    assert.equal(edited.cases.find((record) => record.id === target.caseId).name, name);
    assert.equal(edited.cases.find((record) => record.id === target.caseId).contractSnapshot, before.cases.find((record) => record.id === target.caseId).contractSnapshot);
    await page.getByRole("button", { name: "入住狀態", exact: true }).click();
    const remove = page.getByRole("button", { name: `刪除 ${name} 的入住登記`, exact: true });
    const dialog = page.getByRole("dialog", { name: "刪除入住登記", exact: true });
    const auditBefore = edited.audit.length;
    for (const [device, width, height] of [["desktop",1440,1000],["ipad-portrait",820,1180],["ipad-landscape",1180,820],["mobile",390,844]]) {
      await page.setViewportSize({ width, height });
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
      await page.screenshot({ path: path.join(output, `${engine}-${device}.png`), animations: "disabled" });
      await remove.click();
      assert.ok(await dialog.getByText(`${target.room || "托嬰"}｜${name}`, { exact: true }).isVisible());
      await page.screenshot({ path: path.join(output, `${engine}-${device}-delete.png`), animations: "disabled" });
      await dialog.getByRole("button", { name: "取消", exact: true }).click();
      assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem("santino_domain_v1")).audit.length), auditBefore);
    }

    const viewer = await context.newPage();
    viewer.on("pageerror", (error) => errors.push(`${engine}-viewer: ${error.message}`));
    await visit(viewer, `${base}/view/family/?ticket=${encodeURIComponent(target.familyTicket)}`);
    await viewer.getByRole("button", { name: "進入觀看", exact: true }).click();
    await viewer.locator('[data-camera-mode="snapshot"]').waitFor();
    await remove.click();
    await dialog.getByRole("button", { name: "確認刪除", exact: true }).click();
    await page.getByRole("status").filter({ hasText: "入住登記已刪除" }).waitFor();
    assert.equal(await remove.count(), 0);
    await viewer.locator('[data-camera-mode="masked"]').waitFor();
    assert.equal(await viewer.locator('[data-camera-mode="snapshot"]').count(), 0);
    const after = await page.evaluate(() => JSON.parse(localStorage.getItem("santino_domain_v1")));
    assert.ok(after.bindings.find((binding) => binding.id === target.id).deletedAt);
    assert.deepEqual(after.cases, edited.cases);
    assert.deepEqual(after.subjects, edited.subjects);
    await page.reload();
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: "入住狀態", exact: true }).click();
    assert.equal(await remove.count(), 0);
    await page.getByRole("button", { name: "入住登記", exact: true }).click();
    await page.getByLabel("選擇待登記合約", { exact: true }).selectOption(target.caseId);
    await page.getByRole("button", { name: "帶入合約資料", exact: true }).click();
    const restored = await page.evaluate(() => JSON.parse(localStorage.getItem("santino_domain_v1")));
    const active = restored.bindings.filter((binding) => binding.caseId === target.caseId && !binding.ended);
    assert.equal(active.length, 1);
    assert.notEqual(active[0].id, target.id);
    await context.close();

    for (const role of ["櫃台", "護理師 陳護理師"]) {
      const current = await contextFor(browser, role);
      const rolePage = await current.newPage();
      await visit(rolePage, `${base}/babycam/`);
      if (role === "櫃台") await rolePage.getByRole("button", { name: "入住狀態", exact: true }).click();
      const buttons = rolePage.getByRole("button", { name: /^刪除 .+ 的入住登記$/ });
      assert.equal(await buttons.count() > 0, role === "櫃台");
      assert.equal(await rolePage.getByRole("button", { name: /^編輯 .+ 的入住登記$/ }).count() > 0, role === "櫃台");
      await current.close();
    }
    await browser.close(); browser = undefined;
  }
  assert.deepEqual(errors, []);
  const result = { checks: ["清單編輯帶入正確案件", "姓名同步與合約快照保留", "取消刪除不改資料", "刪除停止正在觀看的畫面", "重整後不復活", "刪除後可重新登記", "櫃台可操作、護理師隱藏", "桌機與平板直橫向及手機"], engines: ["chromium", "webkit"], errors };
  await fs.writeFile(path.join(output, "result.json"), JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result));
})().catch(async (error) => { console.error(error); await browser?.close(); process.exitCode = 1; });
