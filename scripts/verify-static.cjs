const { createStaticServer } = require("./static-server.cjs");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const readline = require("node:readline");
const { spawn } = require("node:child_process");

const webRoot = path.resolve(__dirname, "..");
const outRoot = path.resolve(process.env.SANTINO_STATIC_OUT || path.join(webRoot, "out"));
const basePath = (process.env.SANTINO_STATIC_BASE_PATH || "").replace(/\/$/, "");
const reportRoot = path.resolve(process.env.SANTINO_QA_OUTPUT || path.join(webRoot, "test-results", `${basePath ? "subpath" : "root"}-${new Date().toISOString().replace(/[:.]/g, "-")}`));
const scripts = process.env.SANTINO_E2E_SCENARIOS?.split(",") || ["integration", "case_followup", "case_form_layout", "care_form_layout", "babycam_form_layout", "babycam_followup", "babycam_maintenance", "babycam_runtime", "babycam_scan", "babycam_registration", "care_workspace", "care_settings", "contract_settings", "static_smoke"];

/*
  平行執行（2026-11-20）：原本 14 個情境逐一跑要 15 分鐘，其中三支版面驗收佔 12 分鐘
  （Chromium／WebKit × 5 種尺寸逐格跑）。版面驗收依「瀏覽器 × 尺寸」拆成獨立分片，
  每格各開瀏覽器與 context、互不共用狀態，檢查內容與門檻完全不變，只是同時跑。
  SANTINO_E2E_JOBS 可調同時執行數（預設 4）；設 1 即回到逐一執行，方便排查不穩定的情境。
*/
const SHARDED = new Set(["care_form_layout", "case_form_layout", "babycam_form_layout"]);
const ENGINES = ["chromium", "webkit"];
const LAYOUTS = ["桌機", "iPad橫向", "iPad直向", "平板窄幅", "手機"];
const jobs = scripts.flatMap((name) => SHARDED.has(name)
  ? ENGINES.flatMap((engine) => LAYOUTS.map((layout) => ({ name, label: `${name}:${engine}:${layout}`, env: { SANTINO_E2E_ENGINE: engine, SANTINO_E2E_LAYOUT: layout, SANTINO_E2E_SHARD: `${engine}-${layout}` } })))
  : [{ name, label: name, env: {} }]);
// 耗時長的先跑，避免最後只剩一支大的在單獨跑。
jobs.sort((a, b) => Number(SHARDED.has(b.name)) - Number(SHARDED.has(a.name)));
const concurrency = Math.max(1, Number(process.env.SANTINO_E2E_JOBS) || Math.min(4, os.cpus().length));

const server = createStaticServer(outRoot, basePath);

function run(job, origin) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [path.join(webRoot, "tests", "e2e", `${job.name}.cjs`)], { cwd: webRoot, env: { ...process.env, ...job.env, SANTINO_PREVIEW_BASE_URL: origin, SANTINO_QA_OUTPUT: reportRoot }, stdio: ["ignore", "pipe", "pipe"], windowsHide: true });
    // 同時跑時輸出會交錯，每行加上分片名稱才看得出是誰的訊息。
    const prefix = concurrency > 1 ? `[${job.label}] ` : "";
    readline.createInterface({ input: child.stdout }).on("line", (line) => console.log(prefix + line));
    readline.createInterface({ input: child.stderr }).on("line", (line) => console.error(prefix + line));
    child.once("error", reject); child.once("close", resolve);
  });
}

(async () => {
  await fs.access(path.join(outRoot, "index.html")); await fs.mkdir(reportRoot, { recursive: true });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const origin = `http://127.0.0.1:${server.address().port}${basePath}`;
  const results = [];
  const queue = [...jobs];
  let failed = null;
  const started = Date.now();
  try {
    // 第一個失敗後不再派新工作，已在跑的跑完再一起回報。
    await Promise.all(Array.from({ length: Math.min(concurrency, jobs.length) }, async () => {
      while (queue.length && !failed) {
        const job = queue.shift();
        const at = Date.now();
        const code = await run(job, origin);
        results.push({ scenario: job.label, passed: code === 0, durationMs: Date.now() - at });
        if (code !== 0) failed ??= job.label;
      }
    }));
    if (failed) throw new Error(`瀏覽器驗收失敗：${results.filter((item) => !item.passed).map((item) => item.scenario).join("、")}`);
    console.log(`靜態網站驗收通過（${jobs.length} 項、同時 ${concurrency} 項、${Math.round((Date.now() - started) / 1000)} 秒），結果：${reportRoot}`);
  } finally { await fs.writeFile(path.join(reportRoot, "summary.json"), JSON.stringify({ basePath, concurrency, results }, null, 2)); await new Promise((resolve) => server.close(resolve)); }
})().catch((error) => { console.error(error.message); process.exitCode = 1; });
