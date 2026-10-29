/*
  iPad (A16) 全站版面稽核 —— `npm run audit:ipad`（要先 npm run build，驗的是 out/）。

  院方的護理師與護理長都用 iPad 作業（客戶 2026-10-29），所以雙平台是驗收項目，
  不是加分項。這支腳本以 iPad 11" A16 的實際 CSS 視窗（直向 820×1180、
  橫向 1180×820、觸控、無 hover）走遍每個路由 × 每個角色，檢查四件事：

    ① 整頁水平捲動（body 比視窗寬）
    ② 元素右緣超出視窗，且祖先沒有任何一層可橫捲 —— 真的看不到也捲不到
    ③ 觸控目標小於 40px（v24 §2 要求 48px，容差到 40）
    ④ 主控台錯誤

  ⚠️ 會先展開所有收合區塊再量。只看初始畫面會漏掉一半內容——第一版就是這樣
  才只抓到 1 個問題，展開後才量得準。

  ⑤ 側邊選單的可達性：收合與展開兩種狀態下，選單列出的連結數是否相同。
     2026-10-29 客戶回報 iPad 上選不到「案件清單」——平板當時走另一條唯讀圖示軌，
     SidebarNav 在 collapsed 時把第 2 層清空，子項只剩打網址才到得了。
     前四項全綠卻完全沒抓到：它們量的是「畫面有沒有壞」，不是「功能還到不到得了」。

  已知限制：不會開啟 Modal、不會逐一點過頁內頁籤（頁籤多以 ?tab=／?section= 直達，
  已列在 ROUTES 裡）。新增帶頁籤的頁面時記得補進 ROUTES。
*/
const path = require("node:path"), fs = require("node:fs");
const { createStaticServer } = require("./static-server.cjs");
const { chromium } = require("playwright");

const ROUTES = [
  "/", "/todo/", "/quote/", "/cases/", "/cases/detail/?id=case-demo-contract", "/cases/detail/?id=case-demo-preadmission",
  "/customer/", "/mama/", "/baby/", "/rooms/", "/doctor/", "/care/", "/kpi/", "/meal/", "/hr/", "/course/", "/line/", "/login/", "/forgot-password/",
  "/contract/", "/contract/?tab=clauses", "/contract/?tab=childcare",
  "/babycam/?section=registration", "/babycam/?section=assign", "/babycam/?section=schedule",
  "/admin/", "/admin/?tab=master", "/admin/?tab=staff", "/admin/?tab=system", "/admin/?tab=phrases", "/admin/?tab=backfill", "/admin/?tab=kpi",
  "/view/mama/", "/view/family/",
];
const ROLES = ["櫃台", "衛教師 琳雅", "護理師 陳護理師", "護理長 婉真", "管理者"];

const PROBE = (vw) => {
  const out = { scrollW: document.documentElement.scrollWidth, overflow: [], small: [] };
  const seen = new Set();
  for (const el of document.querySelectorAll("body *")) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    const style = getComputedStyle(el);
    if (style.visibility === "hidden" || style.display === "none") continue;
    if (r.right > vw + 1) {
      let scrollable = false;
      for (let p = el.parentElement; p; p = p.parentElement) {
        const ov = getComputedStyle(p).overflowX;
        if ((ov === "auto" || ov === "scroll") && p.scrollWidth > p.clientWidth + 1) { scrollable = true; break; }
      }
      if (!scrollable) {
        const key = el.tagName + (typeof el.className === "string" && el.className ? "." + el.className.split(" ").slice(0, 2).join(".") : "");
        if (!seen.has(key)) { seen.add(key); out.overflow.push({ key, right: Math.round(r.right), text: (el.textContent || "").trim().slice(0, 36) }); }
      }
    }
    if (/^(BUTTON|A|SELECT)$/.test(el.tagName) || (el.tagName === "INPUT" && el.type !== "hidden" && el.type !== "checkbox" && el.type !== "radio")) {
      if (r.height > 0 && r.height < 40 && (el.textContent || "").trim()) {
        const key = el.tagName + ":" + (el.textContent || "").trim().slice(0, 20);
        if (!seen.has("s" + key)) { seen.add("s" + key); out.small.push({ key, h: Math.round(r.height) }); }
      }
    }
  }
  return out;
};

(async () => {
  const root = path.resolve(__dirname, "../out");
  const manifest = JSON.parse(fs.readFileSync(path.join(root, "static-site.json"), "utf8"));
  const server = createStaticServer(root, manifest.basePath);
  // 埠號交給系統挑（0），前一次還沒收掉的伺服器才不會讓這次整支掛掉。
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const base = `http://localhost:${server.address().port}${manifest.basePath}`;
  const browser = await chromium.launch();
  const findings = [];
  let pages = 0;

  for (const [orientation, width, height] of [["直向", 820, 1180], ["橫向", 1180, 820]]) {
    for (const role of ROLES) {
      const ctx = await browser.newContext({ viewport: { width, height }, hasTouch: true, deviceScaleFactor: 2 });
      await ctx.addInitScript((r) => { try { localStorage.setItem("santino_current_role_v1", r); } catch {} }, r = role);
      const page = await ctx.newPage();
      const errors = [];
      page.on("console", (m) => { if (m.type() === "error") errors.push(m.text().slice(0, 150)); });
      page.on("pageerror", (e) => errors.push(String(e).slice(0, 150)));
      for (const route of ROUTES) {
        errors.length = 0;
        try { await page.goto(base + route, { waitUntil: "domcontentloaded", timeout: 15000 }); } catch { findings.push({ orientation, role, route, kind: "載入逾時" }); continue; }
        await page.waitForTimeout(150);
        // 展開所有收合區塊，否則一半內容量不到
        try { await page.evaluate(() => document.querySelectorAll('button[aria-expanded="false"][aria-controls^="section-"]').forEach((b) => b.click())); await page.waitForTimeout(120); } catch {}
        pages += 1;
        const res = await page.evaluate(PROBE, width);
        if (res.scrollW > width + 1) findings.push({ orientation, role, route, kind: "整頁水平捲動", detail: `scrollWidth ${res.scrollW} > ${width}` });
        for (const o of res.overflow.slice(0, 4)) findings.push({ orientation, role, route, kind: "元素超出畫面", detail: `${o.key} right=${o.right}「${o.text}」` });
        for (const s of res.small.slice(0, 4)) findings.push({ orientation, role, route, kind: "觸控目標過小", detail: `${s.key} 高 ${s.h}px` });
        for (const e of errors.slice(0, 2)) findings.push({ orientation, role, route, kind: "主控台錯誤", detail: e });

        // 選單可達性只在首頁量一次，每個路由都量是重複的。
        if (route === "/") {
          const countLinks = () => page.locator("aside:visible nav a").count();
          const collapsedLinks = await countLinks();
          const toggle = page.getByRole("button", { name: /展開選單|收合選單/ });
          if (await toggle.count()) {
            await toggle.first().click();
            await page.waitForTimeout(150);
            const expandedLinks = await countLinks();
            if (Math.max(collapsedLinks, expandedLinks) > Math.min(collapsedLinks, expandedLinks)) {
              // 收合時少列連結是正常的（圖示軌只放第 1 層），但展開後必須拿得回來。
              if (expandedLinks <= collapsedLinks) findings.push({ orientation, role, route, kind: "選單可達性", detail: `展開後連結沒有變多（${collapsedLinks} → ${expandedLinks}）` });
            }
            if (expandedLinks === 0) findings.push({ orientation, role, route, kind: "選單可達性", detail: "展開後側邊選單沒有任何連結" });
            await toggle.first().click();
            await page.waitForTimeout(120);
          } else {
            /* 沒有展開按鈕就是問題，不必管現在列了幾條：收合軌一定會少掉第 2 層，
               沒有展開的辦法，那些子項就只剩打網址才到得了——2026-10-29 回報的正是這個。 */
            findings.push({ orientation, role, route, kind: "選單可達性", detail: collapsedLinks ? `側邊選單沒有展開按鈕，第 2 層子項無法從選單到達（目前列 ${collapsedLinks} 條）` : "側邊選單沒有任何連結，也沒有展開按鈕" });
          }
        }
      }
      await ctx.close();
    }
  }
  await browser.close(); server.close();
  fs.writeFileSync(path.resolve(__dirname, "../test-results/ipad-audit.json"), JSON.stringify(findings, null, 2));
  const byKind = {};
  for (const f of findings) byKind[f.kind] = (byKind[f.kind] || 0) + 1;
  console.log("掃描頁面次數:", pages, "／問題數:", findings.length, JSON.stringify(byKind));
  const uniq = new Map();
  for (const f of findings) { const k = `${f.kind}|${f.detail || ""}`; if (!uniq.has(k)) uniq.set(k, { ...f, where: new Set() }); uniq.get(k).where.add(`${f.orientation}${f.route}`); }
  for (const [, v] of [...uniq]) console.log(`[${v.kind}] ${v.detail || ""} ← ${[...v.where].slice(0, 2).join(", ")}${v.where.size > 2 ? ` 等 ${v.where.size} 處` : ""}`);
})();
