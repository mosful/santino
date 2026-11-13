import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { PDFDocument, PDFName } from "pdf-lib";

type Template = { id: string; sha256: string; version: string; pages: { page: number; width: number; height: number }[] };

async function main() {
  const root = path.resolve("public/care-paper/templates");
  const manifest = JSON.parse(await readFile(path.join(root, "manifest.json"), "utf8")) as Template[];
  const ids = ["scales", "baby-admission", "baby-daily", "mama-admission", "mama-daily"];
  if (manifest.length !== ids.length || ids.some(id => manifest.filter(item => item.id === id).length !== 1)) throw new Error("紙本母版清冊缺件或重複。");
  let pages = 0;
  for (const item of manifest) {
    const bytes = await readFile(path.join(root, `${item.id}.pdf`));
    if (createHash("sha256").update(bytes).digest("hex") !== item.sha256) throw new Error(`${item.id} 母版雜湊不符。`);
    const document = await PDFDocument.load(bytes);
    if (document.getAuthor() || document.catalog.has(PDFName.of("Names"))) throw new Error(`${item.id} 含非預期作者或附加資料。`);
    if (document.getPageCount() !== item.pages.length) throw new Error(`${item.id} 頁數不符。`);
    for (const [index, page] of document.getPages().entries()) {
      if (page.node.has(PDFName.of("Annots")) || Math.abs(page.getWidth() - item.pages[index].width) > .001 || Math.abs(page.getHeight() - item.pages[index].height) > .001) throw new Error(`${item.id} 含註記或頁框不符。`);
      await readFile(path.join(root, `${item.id}-${index + 1}.png`));
      pages++;
    }
  }
  if (pages !== 8) throw new Error("紙本母版必須完整八頁。");
  console.log("紙本發布資源核對通過：五份母版、八頁及預覽，雜湊與頁框一致。");
}

main().catch(error => { console.error(error); process.exitCode = 1; });
