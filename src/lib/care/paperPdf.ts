import { PDFDocument, PrintScaling, rgb, beginText, endText, setCharacterSpacing, setWordSpacing, setCharacterSqueeze, setTextRenderingMode, TextRenderingMode, type PDFFont, type PDFPage as PdfPage } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { babyDailySlots, babyDaySlots, calibratedSlots, mamaDailySlots, type PaperSlot } from "./paperTemplates";
import { buildPaperSheets, dailySharedValues, paperHeaderRecord, paperText, paperValue, type PaperRecord, type PaperRequest } from "./paperRecords";
import { PAPER_VERSION } from "./paperForms";
import { validatePaperValues } from "./paperValidation";

export type PaperAssetLoader = (path: string) => Promise<Uint8Array>;
// 字型的 locl 會替拉丁字母旁的數字換字形，造成 PDF 字寬表與文字映射缺漏。
export const PAPER_FONT_FEATURES = { locl: false };
export type PaperIssue = { field: string; message: string; page: number };
export class PaperPrintError extends Error {
  constructor(public issues: PaperIssue[]) { super(issues.map((item) => `第 ${item.page} 頁：${item.message}`).join("\n")); }
}

/** 組合欄位（$ 開頭）沒有對應表單欄名，錯誤訊息改用人看得懂的名稱。 */
const SLOT_LABELS: Record<string, string> = { $uri: "URI 症狀", $vitals: "生命徵象", $author: "護理人員", $room: "房號", $name: "姓名", $birth: "生產日期", $columnDate: "日期" };

function wrapped(value: string, font: PDFFont, size: number, width: number) {
  const lines: string[] = [];
  for (const paragraph of value.replace(/\r/g, "").split("\n")) {
    let line = "";
    for (const character of paragraph) {
      if (font.widthOfTextAtSize(line + character, size) > width && line) { lines.push(line); line = ""; }
      line += character;
    }
    lines.push(line);
  }
  return lines;
}

/** 僅在原頁上疊加填值，保留原標誌、固定文字、格線及分頁。 */
export async function createPaperPdf(request: PaperRequest, load: PaperAssetLoader) {
  const sheets = buildPaperSheets(request);
  if (!request.blank) {
    const errors=sheets.flatMap((sheet,index)=>[sheet.record,...(sheet.columns??[])].filter((record):record is PaperRecord=>!!record).flatMap((record)=>validatePaperValues(request.form,record.values).map((message)=>({field:"values",message,page:index+1}))));
    if(errors.length) throw new PaperPrintError(errors);
  }
  const pdf = await PDFDocument.create();
  pdf.setTitle(request.form.printTitle ?? request.form.label);
  pdf.setSubject(`紙本母版 ${PAPER_VERSION}`);
  pdf.setProducer("聖帝諾院務系統");
  pdf.catalog.getOrCreateViewerPreferences().setPrintScaling(PrintScaling.None);
  const sources = new Map<string, PDFDocument>();
  const issues: PaperIssue[] = [];
  let font: PDFFont | undefined;
  let characters = new Set<number>();
  const needsText = !request.blank;
  if (needsText) {
    pdf.registerFontkit(fontkit);
    // 此中文字型在 fontkit 子集輸出會漏字；完整內嵌並以實際渲染驗證。
    font = await pdf.embedFont(await load("fonts/noto-sans-tc/NotoSansTC.ttf"), { subset: false, features: PAPER_FONT_FEATURES });
    characters = new Set(font.getCharacterSet());
  }
  for (let index = 0; index < sheets.length; index++) {
    const sheet = sheets[index];
    if (!sources.has(sheet.template.source)) sources.set(sheet.template.source, await PDFDocument.load(await load(`care-paper/templates/${sheet.template.source}.pdf`)));
    const original = sources.get(sheet.template.source)!;
    const [page] = await pdf.copyPages(original, [sheet.template.page]);
    pdf.addPage(page);
    // 掃描 PDF 可能留有 OCR 的字距或水平縮放，填值不得繼承。
    page.pushOperators(beginText(), setCharacterSpacing(0), setWordSpacing(0), setCharacterSqueeze(100), setTextRenderingMode(TextRenderingMode.Fill), endText());
    const sx = page.getWidth() / 954; const sy = page.getHeight() / 1361;
    const issue = (slot: PaperSlot, message: string) => issues.push({ field: slot.key, message, page: index + 1 });
    async function draw(rawSlot: PaperSlot, record?: PaperRecord, columnDate?: string) {
      const slot = calibratedSlots([rawSlot], sheet.template.source, sheet.template.page)[0];
      if (request.blank) return;
      const value = slot.key === "$sheetNumber" ? String(index + 1) : paperValue(slot.key, record, request.subject, columnDate);
      if (slot.kind === "signature") {
        if (!record?.signature) return;
        try {
          const image = await pdf.embedPng(record.signature);
          const scale = Math.min(slot.w * sx / image.width, slot.h * sy / image.height);
          page.drawImage(image, { x: slot.x * sx, y: page.getHeight() - (slot.y + slot.h) * sy, width: image.width * scale, height: image.height * scale });
        } catch { issue(slot, "簽名圖片無法讀取，請重新確認簽名。"); }
        return;
      }
      if (slot.kind === "check") {
        const options = (Array.isArray(value) ? value : [value]).flatMap((item) => item === "NSD" ? [item, "NSD 自然產"] : item === "NSD 自然產" ? [item, "NSD"] : item === "C/S" ? [item, "C/S 剖腹產"] : item === "C/S 剖腹產" ? [item, "C/S"] : [item]);
        if (!slot.option || !options.includes(slot.option)) return;
        const x = slot.x * sx; const y = page.getHeight() - slot.y * sy; const width = slot.w * sx; const height = slot.h * sy;
        page.drawLine({ start: { x: x + width * .17, y: y - height * .48 }, end: { x: x + width * .43, y: y - height * .78 }, thickness: .8 });
        page.drawLine({ start: { x: x + width * .43, y: y - height * .78 }, end: { x: x + width * .88, y: y - height * .12 }, thickness: .8 });
        return;
      }
      let text = paperText(value);
      if (!text || !font) return;
      if (slot.format === "weeks" || slot.format === "days") {
        const parts = /^(\d{1,2})(?:\s*(?:[+＋/／]|週)\s*([0-6])\s*天?)?(?:\s*週)?$/.exec(text);
        if (!parts) { issue(slot, "出生週數請以週＋天記錄，例如 39＋2；原值已保留，請核對後列印。"); return; }
        text = slot.format === "weeks" ? parts[1] : parts[2] ?? "";
        if (!text) return;
      } else if (slot.format && /^\d{4}-\d{2}-\d{2}$/.test(text)) {
        const parts = text.split("-");
        text = slot.format === "shortDate" ? `${parts[1]}/${parts[2]}` : parts[{ year: 0, month: 1, day: 2 }[slot.format]];
      }
      if (["$activity", "$sucking"].includes(slot.key)) {
        if (!["強", "適中", "弱"].includes(text)) { issue(slot, "活動力／吸吮力的舊值需依原紀錄核對，不自動轉換。"); return; }
        const color = text === "強" ? rgb(0, 0, 0) : text === "適中" ? rgb(0, 0, 1) : rgb(1, 0, 0);
        const x = (slot.x + slot.w / 2) * sx; const y = page.getHeight() - (slot.y + slot.h / 2) * sy;
        if (slot.key === "$sucking") page.drawCircle({ x, y, size: 3.2, borderColor: color, borderWidth: 1 });
        else {
          for (const [a, b] of [[[-4, -3], [4, -3]], [[4, -3], [0, 4]], [[0, 4], [-4, -3]]]) page.drawLine({ start: { x: x + a[0], y: y + a[1] }, end: { x: x + b[0], y: y + b[1] }, thickness: 1, color });
        }
        return;
      }
      const size = slot.size ?? 10; const width = slot.w * sx; const height = slot.h * sy;
      const missing = [...text].filter((char) => char !== "\n" && char !== "\t" && !characters.has(char.codePointAt(0)!));
      if (missing.length) { issue(slot, `有字型不支援的字元「${[...new Set(missing)].join("")}」，請核對原文。`); return; }
      const lines = wrapped(text.replace(/\t/g, " "), font, size, width);
      const lineHeight = size * 1.25;
      if (lines.length * lineHeight > height + .1 || lines.some((line) => font!.widthOfTextAtSize(line, size) > width + .1)) {
        issue(slot, `「${request.form.sections.flatMap((section) => section.fields).find((field) => field.key === slot.key)?.label ?? SLOT_LABELS[slot.key] ?? slot.key}」超出紙本原框，完整內容仍保留；請使用對應護理紀錄或核定補頁，不截字輸出。`); return;
      }
      lines.forEach((line, i) => page.drawText(line, { x: slot.x * sx, y: page.getHeight() - slot.y * sy - size - i * lineHeight, font, size, color: rgb(0, 0, 0) }));
    }
    const header = paperHeaderRecord(request,sheet);
    for (const slot of sheet.template.slots) await draw(slot, header);
    if (request.form.paperTemplate === "mama-daily" && !request.blank) {
      for (let i = 0; i < 4; i++) if (sheet.columns?.[i]) for (const slot of mamaDailySlots(i)) await draw(slot, sheet.columns[i]);
    }
    if (request.form.paperTemplate === "baby-daily" && !request.blank) {
      for (let day = 0; day < 5; day++) {
        const records = sheet.columns?.slice(day * 3, day * 3 + 3) ?? [];
        const shared = dailySharedValues(records);
        for (const slot of babyDaySlots(day)) await draw(slot, { id: "shared", values: shared }, sheet.dates?.[day]);
        for (let shift = 0; shift < 3; shift++) {
          const record = records[shift];
          if (!record) continue;
          if (paperText(record.values.redBottom) && !/^([0-3])\s/.test(paperText(record.values.redBottom))) issue({ key: "redBottom", x: 0, y: 0, w: 0, h: 0 }, "紅臀舊分級無法直接對應 0～3，請先核對原紀錄。");
          for (const slot of babyDailySlots(day, shift)) await draw(slot, record);
        }
      }
    }
  }
  if (issues.length) throw new PaperPrintError(issues);
  if (request.paperSize === "a4") return toA4(pdf);
  return pdf.save();
}

async function toA4(original: PDFDocument) {
  // 跨文件嵌頁前先完成字型與簽名資源，否則新文件會取得尚未寫入的參照。
  await original.flush();
  const output = await PDFDocument.create();
  output.catalog.getOrCreateViewerPreferences().setPrintScaling(PrintScaling.None);
  for (const source of original.getPages()) {
    const page = output.addPage([595.276, 841.89]);
    const embedded = await output.embedPage(source);
    const scale = Math.min(page.getWidth() / source.getWidth(), page.getHeight() / source.getHeight());
    drawCentered(page, embedded, source.getWidth() * scale, source.getHeight() * scale);
  }
  return output.save();
}

function drawCentered(page: PdfPage, embedded: Awaited<ReturnType<PDFDocument["embedPage"]>>, width: number, height: number) {
  page.drawPage(embedded, { x: (page.getWidth() - width) / 2, y: (page.getHeight() - height) / 2, width, height });
}
