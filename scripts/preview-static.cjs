const fs = require("node:fs/promises");
const path = require("node:path");
const { createStaticServer } = require("./static-server.cjs");

(async () => {
  const root = path.resolve(__dirname, "../out"); await fs.access(path.join(root, "index.html"));
  const manifest = JSON.parse(await fs.readFile(path.join(root, "static-site.json"), "utf8"));
  const server = createStaticServer(root, manifest.basePath); const port = Number(process.env.SANTINO_PREVIEW_PORT || 4310);
  server.on("error", (error) => { console.error(error.code === "EADDRINUSE" ? "預覽埠號已使用，請設定 SANTINO_PREVIEW_PORT 後重試。" : error.message); process.exitCode = 1; });
  server.listen(port, "127.0.0.1", () => console.log(`靜態預覽：http://localhost:${port}${manifest.basePath}/（Ctrl+C 結束）`));
})().catch((error) => { console.error(`請先執行 npm run build。${error.message}`); process.exitCode = 1; });
