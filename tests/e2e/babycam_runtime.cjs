const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const base = process.env.SANTINO_PREVIEW_BASE_URL || "http://localhost:4310";
let browser;

(async () => {
  const output = path.join(process.env.SANTINO_QA_OUTPUT || path.resolve("test-results"), "babycam_runtime");
  await fs.mkdir(output, { recursive: true });
  browser = await chromium.launch({ headless: true });
  const errors = [];
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await context.addInitScript(() => { localStorage.setItem("santino_auth_v1", "1"); localStorage.setItem("santino_current_role_v1", "管理者"); });
  const page = await context.newPage(); page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(base + "/babycam/");
  assert.equal(await page.getByRole("heading", { name: "本筆入住的時段覆寫", exact: true }).count(), 0);
  await page.getByLabel("選擇待登記合約", { exact: true }).selectOption("case-demo-contract");
  await page.getByRole("button", { name: "帶入合約資料", exact: true }).click();
  assert.equal(await page.getByLabel("入住媽媽姓名", { exact: true }).inputValue(), "許○心");
  await page.getByLabel("入住媽媽姓名", { exact: true }).fill("視訊修改展示媽媽");
  await page.getByLabel("入住登記房號", { exact: true }).selectOption("303");
  await page.getByRole("button", { name: "儲存入住基本資料", exact: true }).click();
  const data = await page.evaluate(() => JSON.parse(localStorage.getItem("santino_domain_v1")));
  const created = data.bindings.find((item) => item.caseId === "case-demo-contract");
  assert.equal(created.motherName, "視訊修改展示媽媽"); assert.equal(created.validFrom, "2027-01-08");
  assert.equal(data.cases.find((item) => item.id === created.caseId).room, "303");
  await page.goto(`${base}/babycam/?binding=${encodeURIComponent(created.id)}`);
  assert.equal(await page.getByLabel("入住媽媽姓名", { exact: true }).inputValue(), "視訊修改展示媽媽");

  await page.getByRole("link", { name: "設定與維運", exact: true }).click();
  await page.getByRole("button", { name: "開放時段", exact: true }).click();
  assert.equal(await page.getByText("院內受眾時段", { exact: true }).count(), 0);
  await page.getByRole("button", { name: "套用範例：媽媽全天、親友 10:00–20:00", exact: true }).click();
  assert.equal(await page.getByLabel("院內開放時段模式", { exact: true }).inputValue(), "always");
  assert.equal(await page.getByLabel("親友開放時段模式", { exact: true }).inputValue(), "scheduled");
  await page.screenshot({ path: `${output}/schedule-desktop.png`, fullPage: true });

  await page.goto(base + "/babycam/?section=assign");
  assert.equal(await page.getByRole("heading", { name: "監視器歷程", exact: true }).count(), 0);
  assert.equal(await page.getByRole("heading", { name: "手圈與嬰兒車標籤", exact: true }).count(), 0);
  for (const [name, width, height] of [["desktop", 1440, 1000], ["ipad", 834, 1194], ["mobile", 390, 844]]) {
    await page.setViewportSize({ width, height });
    const editor = await page.getByRole("heading", { name: "護理指派寶寶與監視器", exact: true }).boundingBox();
    assert.ok(editor.width > 200);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    await page.getByRole("button", { name: "儲存這 1 位的資料", exact: true }).scrollIntoViewIfNeeded();
    await page.getByRole("button", { name: "儲存這 1 位的資料", exact: true }).click();
    await page.getByRole("heading", { name: "護理指派寶寶與監視器", exact: true }).scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${output}/assign-${name}.png`, fullPage: true });
    await page.getByRole("button", { name: "標籤預覽與列印", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "手圈與嬰兒車標籤", exact: true });
    await dialog.getByRole("button", { name: "產生標籤預覽", exact: true }).click();
    await dialog.getByAltText("寶寶 1 標籤預覽", { exact: true }).waitFor();
    await page.screenshot({ path: `${output}/labels-${name}.png`, fullPage: true });
    await dialog.getByRole("button", { name: "關閉", exact: true }).click();
    await page.getByRole("button", { name: "標籤列印設定", exact: true }).click();
    const settings = page.getByRole("dialog", { name: "標籤列印設定", exact: true });
    await settings.getByLabel("標籤字體", { exact: true }).waitFor();
    await settings.getByRole("button", { name: "關閉", exact: true }).click();
  }

  const fixture = structuredClone(data);
  fixture.demoAt = "2026-10-16T09:59:58+08:00"; delete fixture.demoClockStartedAt;
  fixture.familyLimit = 2; fixture.concurrencyEnforced = true; fixture.viewScenario = "normal";
  fixture.enforceInternal = true; fixture.enforceFamily = true; fixture.detection.enabled = false;
  fixture.houseWindow = fixture.internalWindow = fixture.familyWindow = { mode: "always", start: "00:00", end: "23:59" };
  fixture.disinfections = []; fixture.demoScenarios = {};
  const target = fixture.bindings.find((item) => !item.ended && item.babies.length);
  Object.assign(target, { familyEnabled: true, familyFrom: "", familyTo: "", validFrom: "2026-10-01", validTo: "2027-12-31", sessions: [] });
  target.babies.forEach((baby) => { baby.careMode = false; baby.state = "normal"; const camera = fixture.cameras.find((item) => item.id === baby.cameraId); camera.enabled = true; camera.health = "正常"; });
  const runtime = await browser.newContext();
  await runtime.addInitScript((seed) => { if (!localStorage.getItem("santino_domain_v1")) localStorage.setItem("santino_domain_v1", JSON.stringify(seed)); }, fixture);
  async function viewer() {
    const item = await runtime.newPage(); item.on("pageerror", (error) => errors.push(error.message));
    await item.clock.install({ time: new Date("2026-11-02T00:00:00Z") });
    await item.clock.pauseAt(new Date("2026-11-02T00:00:01Z"));
    await item.goto(`${base}/view/family/?ticket=${encodeURIComponent(target.familyTicket)}`);
    return item;
  }
  async function login(item) {
    await item.getByLabel("手機號碼", { exact: true }).fill(target.phone);
    await item.getByLabel("密碼", { exact: true }).fill(target.passcode);
    await item.getByRole("button", { name: "進入觀看", exact: true }).click();
    await item.getByRole("button", { name: "登出", exact: true }).waitFor();
  }
  const first = await viewer(); await login(first);
  const second = await viewer(); await login(second);
  const third = await viewer();
  await third.getByRole("alert").filter({ hasText: "親友同時觀看人數已滿" }).waitFor();
  assert.equal(await third.locator("[data-camera-mode]").count(), 0);
  assert.equal(await third.getByRole("button", { name: "進入觀看", exact: true }).isDisabled(), true);
  assert.equal(await first.locator('[data-camera-mode="snapshot"]').count(), 1);
  await third.screenshot({ path: `${output}/family-capacity.png`, fullPage: true });
  await second.getByRole("button", { name: "登出", exact: true }).click();
  await third.getByRole("button", { name: "進入觀看", exact: true }).waitFor({ state: "visible" });
  await login(third);
  await third.getByRole("button", { name: "登出", exact: true }).click();

  await first.evaluate(() => {
    const value = JSON.parse(localStorage.getItem("santino_domain_v1"));
    value.disinfections = [{ id: "runtime", label: "自動遮蔽測試", kind: "環境", weekday: null, date: "2026-10-16", start: "10:00", end: "10:01", rooms: [], enabled: true }];
    localStorage.setItem("santino_domain_v1", JSON.stringify(value));
    dispatchEvent(new StorageEvent("storage", { key: "santino_domain_v1" }));
  });
  const preserved = await first.evaluate(() => { const value = JSON.parse(localStorage.getItem("santino_domain_v1")); return { babies: value.bindings[0].babies, windows: [value.houseWindow, value.internalWindow, value.familyWindow], relays: value.relayChannels }; });
  await first.clock.runFor(3000);
  await first.getByText(/自動遮蔽測試中/).waitFor();
  assert.equal(await first.locator('[data-camera-mode="snapshot"]').count(), 0);
  await first.screenshot({ path: `${output}/disinfection-active.png`, fullPage: true });
  await first.clock.runFor(59_000);
  await first.locator('[data-camera-mode="snapshot"]').waitFor();
  assert.equal(await first.getByText(/自動遮蔽測試中/).count(), 0);
  const restored = await first.evaluate(() => { const value = JSON.parse(localStorage.getItem("santino_domain_v1")); return { babies: value.bindings[0].babies, windows: [value.houseWindow, value.internalWindow, value.familyWindow], relays: value.relayChannels }; });
  assert.deepEqual(restored, preserved);
  await first.screenshot({ path: `${output}/disinfection-restored.png`, fullPage: true });
  assert.deepEqual(errors, []);
  const result = { checks: ["合約帶入與修改同步", "隱藏入住覆寫", "開放時段說明與範例", "滿寬指派及三裝置標籤彈窗", "第三位掃碼自動額滿且不開影像", "登出釋出名額", "消毒自動開始及結束並保留原設定"], errors };
  await fs.writeFile(`${output}/result.json`, JSON.stringify(result, null, 2)); console.log(JSON.stringify(result));
  await browser.close();
})().catch(async (error) => { console.error(error); await browser?.close(); process.exitCode = 1; });
