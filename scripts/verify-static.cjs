const { createStaticServer } = require("./static-server.cjs");
const fs = require("node:fs/promises");
const path = require("node:path");
const { spawn } = require("node:child_process");

const webRoot = path.resolve(__dirname, "..");
const outRoot = path.resolve(process.env.SANTINO_STATIC_OUT || path.join(webRoot, "out"));
const basePath = (process.env.SANTINO_STATIC_BASE_PATH || "").replace(/\/$/, "");
const reportRoot = path.resolve(process.env.SANTINO_QA_OUTPUT || path.join(webRoot, "test-results", `${basePath ? "subpath" : "root"}-${new Date().toISOString().replace(/[:.]/g, "-")}`));
const scripts = process.env.SANTINO_E2E_SCENARIOS?.split(",") || ["integration", "case_followup", "babycam_followup", "babycam_maintenance", "care_workspace", "care_settings", "contract_settings", "static_smoke"];

const server = createStaticServer(outRoot, basePath);

(async () => {
  await fs.access(path.join(outRoot, "index.html")); await fs.mkdir(reportRoot, { recursive: true });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const origin = `http://127.0.0.1:${server.address().port}${basePath}`;
  const results = [];
  try {
    for (const name of scripts) {
      const started = Date.now();
      const code = await new Promise((resolve, reject) => { const child = spawn(process.execPath, [path.join(webRoot, "tests", "e2e", `${name}.cjs`)], { cwd: webRoot, env: { ...process.env, SANTINO_PREVIEW_BASE_URL: origin, SANTINO_QA_OUTPUT: reportRoot }, stdio: "inherit", windowsHide: true }); child.once("error", reject); child.once("close", resolve); });
      results.push({ scenario: name, passed: code === 0, durationMs: Date.now() - started }); if (code !== 0) throw new Error(`瀏覽器驗收失敗：${name}`);
    }
    console.log(`靜態網站驗收通過，結果：${reportRoot}`);
  } finally { await fs.writeFile(path.join(reportRoot, "summary.json"), JSON.stringify({ basePath, results }, null, 2)); await new Promise((resolve) => server.close(resolve)); }
})().catch((error) => { console.error(error.message); process.exitCode = 1; });
