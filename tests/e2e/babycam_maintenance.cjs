const path = require("node:path");
const base = process.env.SANTINO_PREVIEW_BASE_URL || "http://localhost:4310";
let activeBrowser;
const { chromium } = require("playwright"); const assert = require("node:assert/strict"); const fs = require("node:fs/promises");
(async () => {
  const output = path.join(process.env.SANTINO_QA_OUTPUT || path.resolve("test-results"), "babycam_maintenance"); await fs.mkdir(output, { recursive: true });
  const browser = await chromium.launch({ headless: true }); activeBrowser = browser; const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
  await context.addInitScript(() => { localStorage.setItem("santino_auth_v1", "1"); localStorage.setItem("santino_current_role_v1", "管理者"); });
  const page = await context.newPage(); const errors = []; const requests = []; page.on("pageerror", (error) => errors.push(error.message)); page.on("request", (request) => { if (/\/api\//.test(request.url()) || /^https?:/.test(request.url()) && !request.url().startsWith(base + "")) requests.push(request.url()); });
  await page.goto(base + "/babycam/"); await page.getByRole("link", { name: "設定與維運", exact: true }).click(); await page.getByRole("button", { name: "監視器狀態", exact: true }).click(); await page.getByRole("button", { name: "模擬離車", exact: true }).click(); await page.getByRole("button", { name: "模擬經過 5 秒", exact: true }).click();
  let data = await page.evaluate(() => JSON.parse(localStorage.getItem("santino_domain_v1"))); const first = data.bindings[0].babies[0]; assert.equal(data.demoScenarios[first.cameraId].phase, "care"); assert.equal(data.bindings[0].babies[0].careMode, true);
  await page.getByRole("button", { name: "模擬回到鏡頭", exact: true }).click(); await page.goto(`${base}/babycam/scan/?code=${first.identityCode}`); await page.getByRole("button", { name: "核對並歸位", exact: true }).click(); data = await page.evaluate(() => JSON.parse(localStorage.getItem("santino_domain_v1"))); assert.equal(data.demoScenarios[first.cameraId].phase, "restored");
  await page.getByRole("link", { name: "設定與維運", exact: true }).click(); await page.getByRole("button", { name: "房間清單", exact: true }).click(); await page.getByRole("button", { name: "維護房型", exact: true }).click(); await page.getByLabel("新增房型名稱", { exact: true }).fill("展示自訂房型"); await page.getByRole("button", { name: "新增房型", exact: true }).click(); data = await page.evaluate(() => JSON.parse(localStorage.getItem("santino_domain_v1"))); const type = data.roomTypes.find((item) => item.name === "展示自訂房型");
  await page.getByLabel("新增房號", { exact: true }).fill("901"); await page.getByLabel("新房號房型", { exact: true }).selectOption(type.id); await page.getByRole("button", { name: "新增房號", exact: true }).click();
  data = await page.evaluate(() => JSON.parse(localStorage.getItem("santino_domain_v1"))); assert.equal(data.rooms.find((item) => item.room === "901").typeId, type.id);
  /*
    繼電器板（系統設定群組）。
    原本是「燈號與點測模擬」頁：勾選解鎖 → 選監視器 → 選 RGB 燈色 → 套用。
    現在改成深色維運風的通道板：按一次「解鎖」後直接點通道格，
    洋紅＝R＋B，所以點 A07 的 R(Y1) 與 B(Y3) 兩格，G(Y2) 維持關閉。
  */
  await page.getByRole("link", { name: "設定與維運", exact: true }).click();
  await page.getByRole("button", { name: "繼電器板", exact: true }).click();
  const relayBefore = await page.evaluate(() => JSON.parse(localStorage.getItem("santino_domain_v1"))?.relayChannels ?? {});
  await page.getByRole("button", { name: "解鎖", exact: true }).click();
  for (const [channel, label] of [["A-Y1", "A07 R 通道 Y1"], ["A-Y3", "A07 B 通道 Y3"]]) {
    if (relayBefore[channel] !== true) await page.getByRole("button", { name: label, exact: true }).click();
  }
  if (relayBefore["A-Y2"] === true) await page.getByRole("button", { name: "A07 G 通道 Y2", exact: true }).click();
  data = await page.evaluate(() => JSON.parse(localStorage.getItem("santino_domain_v1")));
  assert.equal(data.relayChannels["A-Y1"], true); assert.ok(!data.relayChannels["A-Y2"], "G 通道不該亮"); assert.equal(data.relayChannels["A-Y3"], true);
  // 分區改成「A 區板／B 區板」兩顆按鈕；B 區板一樣是 48 個通道。
  await page.getByRole("button", { name: /^B 區板/ }).click();
  // 通道數跟著監視器主檔走（B 區目前 12 支），不要寫死數字——房號主檔換成
  // 現場 27 間版本時監視器數量就變過一次，寫死只會讓測試過期。
  const bChannels = data.cameras.filter((item) => item.code.startsWith("B")).length * 3;
  assert.equal(await page.getByRole("button", { name: /通道 Y\d+$/ }).count(), bChannels);
  await page.getByRole("link", { name: "入住登記", exact: true }).click(); await page.getByRole("button", { name: "紀錄與報表", exact: true }).click();
  // 「在鏡頭下」報表已依客戶要求下架（分支程式仍在），改驗預設的「照護」報表與其示範資料。
  assert.equal(await page.getByRole("button", { name: "在鏡頭下", exact: true }).count(), 0);
  await page.getByRole("button", { name: "照護", exact: true }).click(); await page.getByLabel("報表開始日期", { exact: true }).fill("2026-10-16"); await page.getByLabel("報表結束日期", { exact: true }).fill("2026-10-16");
  const summary = await page.getByText(/第 1 頁，共 \d+ 筆/).innerText(); const count = Number(summary.match(/共 (\d+) 筆/)[1]); assert.ok(count > 10);
  // 匯出 CSV 鈕已依客戶要求移除；改驗 Excel 下載，CSV 的跳脫規則仍由單元測試覆蓋。
  const downloadPromise = page.waitForEvent("download"); await page.getByRole("button", { name: "匯出 Excel", exact: true }).click(); const xlsxPath = `${output}/care-report.xlsx`; await (await downloadPromise).saveAs(xlsxPath); const xlsx = await fs.readFile(xlsxPath); assert.equal(xlsx.subarray(0, 2).toString("latin1"), "PK"); assert.ok(xlsx.length > 500);
  // 監視器主檔改在工作區的「監視器狀態」區段維護（原唯讀頁籤已移除）
  await page.goto(base + "/babycam/?section=cameras"); await page.getByLabel("監視器編號", { exact: true }).fill("A98"); await page.getByRole("button", { name: "儲存監視器主檔", exact: true }).click(); await page.getByText("已儲存主檔，不會連線匿名來源。", { exact: true }).waitFor(); await page.reload(); data = await page.evaluate(() => JSON.parse(localStorage.getItem("santino_domain_v1"))); assert.equal(data.cameras[0].code, "A98");
  await page.goto(base + "/babycam/?section=lights"); await page.getByRole("button", { name: "燈號狀態", exact: true }).click(); await page.getByLabel("新增燈號狀態名稱", { exact: true }).fill("自訂點測"); await page.getByRole("button", { name: "新增自訂燈號", exact: true }).click(); data = await page.evaluate(() => JSON.parse(localStorage.getItem("santino_domain_v1"))); assert.ok(Object.values(data.lightLabels).includes("自訂點測"));
  // 還原展示資料在「後臺管理 → 展示控制台」（僅管理者看得到）。
  await page.getByRole("link", { name: "設定與維運", exact: true }).click(); await page.getByRole("button", { name: "展示控制台", exact: true }).click();
  await page.getByRole("button", { name: "還原展示資料", exact: true }).click(); await page.getByRole("button", { name: "確認還原整合資料", exact: true }).click(); await page.getByText("展示資料已還原。", { exact: true }).waitFor(); data = await page.evaluate(() => JSON.parse(localStorage.getItem("santino_domain_v1"))); assert.equal(data.cameras[0].code, "A01"); assert.ok(!data.rooms.some((item) => item.room === "901")); assert.deepEqual(data.demoScenarios, {});
  assert.deepEqual(errors, []); assert.deepEqual(requests, []); const result = { checks: ["離車累計與人工掃碼復原", "房型房號維護", "RGB 混色與分區點測", "照護報表與全部資料匯出", "舊主檔受控寫入與重整", "自訂燈號與整合資料還原"], exportedRows: count, errors, requests }; await fs.writeFile(`${output}/result.json`, JSON.stringify(result, null, 2)); console.log(JSON.stringify(result)); await browser.close();
})().catch(async (error) => { console.error(error); await activeBrowser?.close(); process.exitCode = 1; });
