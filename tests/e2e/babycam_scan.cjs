const { chromium, webkit } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const QRCode = require("qrcode");
const base = process.env.SANTINO_PREVIEW_BASE_URL || "http://localhost:4310";
const output = path.join(process.env.SANTINO_QA_OUTPUT || path.resolve("test-results"), "babycam_scan");
let browser;

(async () => {
  await fs.mkdir(output, { recursive: true });
  const errors = [];
  const layouts = [];
  for (const [engine, launcher] of [["chromium", chromium], ["webkit", webkit]]) {
    browser = await launcher.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, hasTouch: true });
    await context.addInitScript(() => { localStorage.setItem("santino_auth_v1", "1"); localStorage.setItem("santino_current_role_v1", "護理師 陳護理師"); });
    const page = await context.newPage();
    page.on("pageerror", (error) => errors.push(`${engine}: ${error.message}`));
    await page.goto(`${base}/babycam/?section=scan`);
    const cases = page.getByLabel("選擇入住案件", { exact: true });
    await cases.waitFor();
    const data = await page.evaluate(() => JSON.parse(localStorage.getItem("santino_domain_v1")));
    const single = data.bindings.find((binding) => !binding.ended && binding.babies.length === 1);
    const twins = data.bindings.find((binding) => !binding.ended && binding.babies.length > 1);
    assert.ok(single && twins);
    const code = page.getByLabel("掃碼結果／手動輸入識別碼", { exact: true });
    const verify = page.getByRole("button", { name: "核對並歸位", exact: true });
    const scan = page.getByRole("button", { name: "掃碼", exact: true });
    const dialog = page.getByRole("dialog");
    async function confirmScan() {
      await scan.click();
      await dialog.waitFor();
      assert.equal(await code.inputValue(), "");
      await dialog.getByRole("button", { name: "確認", exact: true }).click();
      assert.equal(await dialog.count(), 0);
    }
    await cases.selectOption(single.id);
    assert.equal(await page.locator('select[aria-label="應歸位的寶寶"]').count(), 0);
    const baby = page.getByRole("group", { name: "應歸位的寶寶", exact: true });
    assert.equal(await baby.getByRole("radio").count(), 1);
    assert.ok(await baby.getByRole("radio").isChecked());
    assert.equal(await page.getByRole("link", { name: "開啟同一筆案件流程", exact: true }).count(), 0);
    await page.getByRole("button", { name: "寶寶登錄與標籤", exact: true }).click();
    assert.equal(await page.getByRole("link", { name: "開啟同一筆案件流程", exact: true }).count(), 0);
    await page.getByRole("button", { name: "掃碼歸位核對", exact: true }).click();
    assert.ok(await verify.isDisabled());
    for (const name of ["QR 掃描", "媽媽端畫面", "親友端畫面"]) assert.equal(await page.getByRole("link", { name, exact: true }).count(), 0);
    const beforeDemo = await page.evaluate(() => JSON.parse(localStorage.getItem("santino_domain_v1")).audit.length);
    await page.evaluate(() => {
      window.__demoCameraRequests = 0;
      if (!navigator.mediaDevices) Object.defineProperty(navigator, "mediaDevices", { configurable: true, value: {} });
      navigator.mediaDevices.getUserMedia = async () => { window.__demoCameraRequests++; throw new DOMException("denied", "NotAllowedError"); };
    });
    await confirmScan();
    assert.equal(await code.inputValue(), single.babies[0].identityCode);
    assert.equal(await page.getByRole("dialog").count(), 0);
    assert.equal(await page.evaluate(() => window.__demoCameraRequests), 1);
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem("santino_domain_v1")).audit.length), beforeDemo);
    await verify.click();
    await page.getByRole("status").filter({ hasText: "身分核對通過" }).waitFor();
    await cases.selectOption(twins.id);
    assert.equal(await code.inputValue(), "");
    assert.equal(await baby.locator("input:checked").count(), 0);
    assert.ok(await scan.isDisabled());
    await baby.getByRole("radio").first().check();
    await confirmScan();
    assert.equal(await code.inputValue(), twins.babies[0].identityCode);
    await baby.locator("label").nth(1).click();
    assert.ok(await baby.getByRole("radio").nth(1).isChecked());
    assert.equal(await baby.locator("input:checked").count(), 1);
    assert.equal(await code.inputValue(), "");
    await code.fill(single.babies[0].identityCode);
    await verify.click();
    await page.getByRole("alert").filter({ hasText: "識別不符" }).waitFor();
    await confirmScan();
    assert.equal(await code.inputValue(), twins.babies[1].identityCode);
    await verify.click();
    await page.getByRole("status").filter({ hasText: "身分核對通過" }).waitFor();

    for (const [name, width, height] of [["desktop", 1440, 1000], ["ipad-portrait", 820, 1180], ["ipad-landscape", 1180, 820], ["mobile", 390, 844]]) {
      await page.setViewportSize({ width, height });
      const bounds = await page.evaluate(() => {
        const targets = [...document.querySelectorAll('select[aria-label="選擇入住案件"], label:has(input[name="expected-return-baby"]), input[aria-label="掃碼結果／手動輸入識別碼"], .btn-lg')];
        return { width: window.innerWidth, scrollWidth: document.documentElement.scrollWidth, heights: targets.map((el) => el.getBoundingClientRect().height) };
      });
      assert.ok(bounds.scrollWidth <= width + 1, `${engine} ${name} 水平溢出`);
      assert.ok(bounds.heights.every((height) => height >= 48), `${engine} ${name} 觸控目標過小`);
      await page.screenshot({ path: path.join(output, `${engine}-${name}.png`), fullPage: true });
      await scan.click();
      await dialog.getByRole("alert").filter({ hasText: "相機權限未開啟" }).waitFor();
      const confirmBounds = await dialog.getByRole("button", { name: "確認", exact: true }).boundingBox();
      assert.ok(confirmBounds && confirmBounds.y >= 0 && confirmBounds.y + confirmBounds.height <= height, `${engine} ${name} 確認按鈕不可見`);
      await page.screenshot({ path: path.join(output, `${engine}-${name}-scanner.png`), fullPage: true });
      await dialog.getByRole("button", { name: "確認", exact: true }).click();
      assert.equal(await code.inputValue(), twins.babies[1].identityCode);
      layouts.push({ engine, name, ...bounds });
    }

    if (engine === "chromium") {
      await page.setViewportSize({ width: 820, height: 1180 });
      await cases.selectOption(single.id);
      const qr = await QRCode.toDataURL(`${base}/babycam/scan/?code=${single.babies[0].identityCode}`, { width: 480, margin: 4 });
      // 以 QR 圖產生真正的本機 MediaStream，走完整 video → canvas → jsQR 流程。
      await page.evaluate((source) => {
        window.__cameraMode = "denied";
        window.__tracks = [];
        navigator.mediaDevices.getUserMedia = async () => {
          if (window.__cameraMode === "denied") throw new DOMException("denied", "NotAllowedError");
          const canvas = document.createElement("canvas"); canvas.width = 640; canvas.height = 640;
          const ctx = canvas.getContext("2d"); ctx.fillStyle = "white"; ctx.fillRect(0, 0, 640, 640);
          if (window.__cameraMode === "qr") {
            const image = new Image(); image.src = source; await image.decode(); ctx.drawImage(image, 80, 80, 480, 480);
          }
          const stream = canvas.captureStream(10); window.__tracks.push(...stream.getTracks());
          return stream;
        };
      }, qr);
      await scan.click();
      await page.getByRole("dialog").getByRole("alert").filter({ hasText: "相機權限未開啟" }).waitFor();
      await page.screenshot({ path: path.join(output, "camera-denied-ipad.png"), fullPage: true });
      await page.getByRole("button", { name: "改用手動輸入", exact: true }).click();
      await page.waitForFunction(() => document.activeElement?.getAttribute("aria-label") === "掃碼結果／手動輸入識別碼");
      await page.evaluate(() => { window.__cameraMode = "blank"; });
      await scan.click();
      await page.getByRole("status").filter({ hasText: "相機已開啟" }).waitFor();
      for (const [name, width, height] of [["desktop", 1440, 1000], ["ipad-portrait", 820, 1180], ["ipad-landscape", 1180, 820], ["compact-tablet", 564, 860], ["mobile", 390, 844]]) {
        await page.setViewportSize({ width, height });
        const preview = await page.getByLabel("掃碼相機預覽", { exact: true }).boundingBox();
        const confirm = await dialog.getByRole("button", { name: "確認", exact: true }).boundingBox();
        assert.ok(preview && preview.height >= 200, `${name} 相機預覽過小`);
        if (name.startsWith("ipad")) assert.ok(preview.width > 600 && preview.height > 300, `${name} 平板預覽未放大`);
        assert.ok(confirm && confirm.y + confirm.height <= height, `${name} 確認按鈕超出畫面`);
        await page.screenshot({ path: path.join(output, `camera-open-${name}.png`), fullPage: true });
        layouts.push({ engine, name: `camera-open-${name}`, preview, confirm });
      }
      await page.getByRole("button", { name: "關閉掃碼", exact: true }).click();
      assert.ok(await page.evaluate(() => window.__tracks.every((track) => track.readyState === "ended")));
      const before = await page.evaluate(() => JSON.parse(localStorage.getItem("santino_domain_v1")).audit.length);
      await page.evaluate(() => { window.__cameraMode = "qr"; });
      await scan.click();
      await dialog.getByRole("status").filter({ hasText: "已讀取識別碼" }).waitFor();
      assert.equal(await code.inputValue(), "");
      await dialog.getByRole("button", { name: "確認", exact: true }).click();
      assert.equal(await code.inputValue(), single.babies[0].identityCode);
      assert.equal(await page.getByRole("dialog").count(), 0);
      assert.ok(await page.evaluate(() => window.__tracks.every((track) => track.readyState === "ended")));
      assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem("santino_domain_v1")).audit.length), before);
      await verify.click();
      await page.getByRole("status").filter({ hasText: "身分核對通過" }).waitFor();
    }

    // 既有深連結仍直接帶入正確案件與同胞寶寶。
    await page.goto(`${base}/babycam/scan/?code=${twins.babies[1].identityCode}`);
    assert.equal(await cases.inputValue(), twins.id);
    assert.equal(await baby.locator("input:checked").inputValue(), twins.babies[1].babyId);
    await browser.close(); browser = undefined;
  }
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  await context.addInitScript(() => { localStorage.setItem("santino_auth_v1", "1"); localStorage.setItem("santino_current_role_v1", "櫃台"); });
  const page = await context.newPage();
  await page.goto(`${base}/babycam/?section=scan`);
  await page.getByLabel("選擇入住案件", { exact: true }).waitFor();
  assert.equal(await page.getByRole("button", { name: "掃碼歸位核對", exact: true }).count(), 0);
  assert.equal(await page.getByRole("button", { name: "核對並歸位", exact: true }).count(), 0);
  assert.deepEqual(errors, []);
  await fs.writeFile(path.join(output, "result.json"), JSON.stringify({ layouts, errors, demo: "掃碼開啟相機視窗，按確認後才帶入所選寶寶的識別碼，再人工核對歸位", camera: "已驗證拒絕權限、關閉釋放相機、QR 實際解碼與人工確認", permissions: "護理師／櫃台" }, null, 2));
  console.log(JSON.stringify({ scenario: "babycam_scan", layouts: layouts.length, errors }));
  await browser.close();
})().catch(async (error) => { console.error(error); await browser?.close(); process.exitCode = 1; });
