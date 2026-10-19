const fs = require("node:fs/promises");
const path = require("node:path");

const root = path.resolve(__dirname, "../out");

/** Windows 的 Next.js 匯出會將部分 segment 名稱保留為目錄，補上瀏覽器請求的點分隔檔名。 */
async function collect(directory) {
  const files = [];
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await collect(target)); else if (entry.isFile()) files.push(target);
  }
  return files;
}
(async () => {
  let count = 0;
  for (const file of await collect(root)) {
    const parts = path.relative(root, file).split(path.sep); const marker = parts.findIndex((part) => part.startsWith("__next."));
    if (marker < 0 || marker === parts.length - 1 || !file.endsWith(".txt")) continue;
    const alias = path.join(root, ...parts.slice(0, marker), parts.slice(marker).join("."));
    const content = await fs.readFile(file);
    try { const existing = await fs.readFile(alias); if (!existing.equals(content)) throw new Error("靜態 segment 別名與既有檔案衝突。"); }
    catch (error) { if (error.code !== "ENOENT") throw error; await fs.writeFile(alias, content); count++; }
  }
  // basePath 判斷邏輯須與 src/lib/basePath.ts 一致（此處為 .cjs 無法直接引用 TS 常數）。
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? (process.env.DEPLOY_TARGET === "gh-pages" ? "/santino" : "");
  await fs.writeFile(path.join(root, "static-site.json"), JSON.stringify({ basePath, nextVersion: require("next/package.json").version, generatedAt: new Date().toISOString() }, null, 2));
  console.log(`靜態匯出整理完成，補齊 ${count} 個路由預載檔案。`);
})().catch((error) => { console.error(error.message); process.exitCode = 1; });
