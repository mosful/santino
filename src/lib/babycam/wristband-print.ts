import QRCode from "qrcode";
import { labelName, labelReady, rocDate, type LabelBaby } from "./wristband";

export const PRINT_SETTINGS_KEY = "babycam-wristband-print-v3";
export const LABEL_DOTS = { width: 320, height: 120, gap: 24, rowWidth: 664 };
export const DOTS_PER_MM = 8;
/** 自動縮放時文字至少要有的字級（點）；達不到就把 QR 縮一格換回可讀性。 */
export const AUTO_FIT_MIN_SIZE = 20;
/** 行與行之間至少要留的空白（點）。 */
const LINE_SPACING = 2;
/** 字級下限；再小就改用水平壓縮，不再縮字，否則現場根本看不到。 */
const MIN_SIZE = 12;
/** QR 距離標籤左緣的固定留白（點）。 */
const QR_LEFT = 4;
/** 文字區右側固定留白（點）。 */
const TEXT_RIGHT = 4;

export type PrintLine = { show: boolean; title: string; titleSize: number; valueSize: number };
export type PrintSettings = {
  font: "jhenghei" | "kai" | "ming"; bold: boolean;
  qrModule: number; qrQuiet: number; qrGap: number; textGap: number;
  left: number; gap: number; top: number; textLeft: number; textTop: number;
  unprintableTop: number; unprintableRight: number;
  lines: PrintLine[];
};
/**
 * 預設值＝ZD230t 現場實印校正過的滿版排版（2026-10-14）：不印標題、QR 自動吃滿
 * 可印高度、三行文字各自吃滿可印寬度。
 *
 * ⚠️ `qrModule` 維持自動。現場量到的是 3 點／格，但那是掃碼網址剛好落在 29 格
 * 的結果；位址一長就變 33 格，釘死 3 點會變成 105 點、超過 104 點的可印高度，
 * 列印鈕當場鎖死。自動會算出同樣的 3 點，又不會在換位址時卡住。
 *
 * 周圍留白只留 1 格——標籤本身的白邊與模切間隙已經是靜區，再往內多留就只剩
 * 每格 2 點（0.25 mm），那個尺寸印在熱感紙上掃起來很勉強。
 */
export const DEFAULT_PRINT_SETTINGS: PrintSettings = {
  font: "jhenghei", bold: true, qrModule: 0, qrQuiet: 1, qrGap: 8, textGap: 4,
  left: 0, gap: 3, top: 0, textLeft: 0, textTop: 0, unprintableTop: 2, unprintableRight: 5,
  lines: [29, 27, 29].map((size) => ({ show: true, title: "", titleSize: size, valueSize: size })),
};
export const QR_MODULE_OPTIONS = [2, 3, 4, 5, 6];

/** 只接受已知設定欄位，避免舊版或手動修改的 localStorage 破壞列印。 */
export function normalizePrintSettings(input: unknown): PrintSettings {
  const source = input && typeof input === "object" ? input as Partial<PrintSettings> : {};
  const bounded = (value: unknown, fallback: number, min: number, max: number) =>
    typeof value === "number" && Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
  return {
    font: ["jhenghei", "kai", "ming"].includes(String(source.font)) ? source.font! : "jhenghei",
    bold: typeof source.bold === "boolean" ? source.bold : true,
    qrModule: [0, ...QR_MODULE_OPTIONS].includes(Number(source.qrModule)) ? Number(source.qrModule) : 0,
    qrQuiet: Math.round(bounded(source.qrQuiet, 1, 0, 4)), qrGap: Math.round(bounded(source.qrGap, 8, 0, 40)),
    textGap: bounded(source.textGap, 4, 0, 30), left: bounded(source.left, 0, 0, 6),
    gap: bounded(source.gap, 3, 1, 6), top: bounded(source.top, 0, -3, 3),
    textLeft: bounded(source.textLeft, 0, -2, 4), textTop: bounded(source.textTop, 0, -2, 2),
    unprintableTop: bounded(source.unprintableTop, 2, 0, 8), unprintableRight: bounded(source.unprintableRight, 5, 0, 15),
    lines: DEFAULT_PRINT_SETTINGS.lines.map((fallback, i) => {
      const line = Array.isArray(source.lines) ? source.lines[i] : undefined;
      return { show: typeof line?.show === "boolean" ? line.show : fallback.show,
        title: typeof line?.title === "string" ? line.title.slice(0, 12) : fallback.title,
        titleSize: bounded(line?.titleSize, fallback.titleSize, MIN_SIZE, 80),
        valueSize: bounded(line?.valueSize, fallback.valueSize, MIN_SIZE, 80) };
    }),
  };
}

export const LEGACY_PRINT_SETTINGS_KEYS = ["babycam-wristband-print-v2", "babycam-wristband-print-v1"];
/**
 * 升版時只帶**水平**方向的校正值。
 * v3 把「上方印不到」改成真的保留在上方（見 `renderWristband` 的 `safeTop`），
 * 垂直的三個值（整體上下微調、文字上下微調、上方印不到）語意變了，照搬會整張
 * 位移；新的預設本身就是現場實印校正過的值，重印一次校正框確認即可。
 */
export function migrateLegacySettings(input: unknown): PrintSettings {
  if (!input || typeof input !== "object") return DEFAULT_PRINT_SETTINGS;
  const legacy = input as Record<string, unknown>;
  const kept = ["font", "bold", "left", "gap", "textLeft", "unprintableRight"] as const;
  return normalizePrintSettings({ ...DEFAULT_PRINT_SETTINGS,
    ...Object.fromEntries(kept.flatMap((key) => legacy[key] === undefined ? [] : [[key, legacy[key]]])) });
}

const FONTS = {
  jhenghei: "'Microsoft JhengHei','PingFang TC','Noto Sans TC',sans-serif",
  kai: "DFKai-SB,BiauKai,'Kaiti TC',serif",
  ming: "PMingLiU,'Songti TC',serif",
};

export async function loadPrintFont(settings: PrintSettings): Promise<void> {
  await document.fonts.load(`${settings.bold ? "bold" : "normal"} 27px ${FONTS[settings.font]}`, "房號姓名生產日期");
  await document.fonts.ready;
}

/** 可印範圍（點）；印不到的邊緣不列入版面計算。 */
export function safeArea(settings: PrintSettings): { width: number; height: number } {
  return {
    width: LABEL_DOTS.width - Math.round(settings.unprintableRight * DOTS_PER_MM),
    height: LABEL_DOTS.height - Math.round(settings.unprintableTop * DOTS_PER_MM),
  };
}

/** QR 連同周圍留白佔掉的格數。 */
export function qrSpan(count: number, quiet: number): number { return count + 2 * quiet; }

/** 可印高度內塞得下的最大「點／格」；熱感紙必須整數點，否則格子寬窄不一就掃不到。 */
export function autoQrModule(count: number, quiet: number, budget: number, max = 6): number {
  return Math.max(1, Math.min(max, Math.floor(budget / qrSpan(count, quiet))));
}

/** 文字區左緣（點）。 */
export function textLeftDots(settings: PrintSettings, qrSize: number): number {
  return QR_LEFT + qrSize + settings.qrGap + Math.round(settings.textLeft * DOTS_PER_MM);
}

/** 中文字的基線約落在字高的 86%。 */
export const TEXT_ASCENT = .86;

/**
 * 一行文字的上緣與基線（點）。
 * ⚠️ 上緣是 `y`，不是 `baseline - 字高`——基線在字高的 86% 處，用整個字高回推會
 * 把上緣多算 14%，行距一窄就把正常的標籤誤判成超出紙緣、把列印鈕鎖住。
 */
export function lineBounds(y: number, height: number, textTopDots: number): { top: number; baseline: number } {
  return { top: y + textTopDots, baseline: y + height * TEXT_ASCENT + textTopDots };
}

export type FitLine = {
  show: boolean;
  /** 字級為 1 時這一行的高度；傳 1 代表「算出來的倍率本身就是字級」。 */
  height: number;
  /** 字級為 1 時這一行的文字寬度。 */
  widthAt1: number;
  /** 不隨字級縮放的寬度，例如標題與內容之間的固定間距。 */
  fixedWidth: number;
};

/**
 * 算出每一行的字級縮放倍率。
 * `grow` 為否時只縮不放（排版用，保證長姓名不會爆版）；
 * 為是時可以放大到吃滿可印高度（「自動縮放」按鈕用）。
 */
export function fitTextScales(lines: FitLine[], opts: { safeH: number; textWidth: number; grow?: boolean }): number[] {
  const scales = lines.map(() => 1);
  const shown = lines.map((line, i) => ({ line, i })).filter((item) => item.line.show);
  if (!shown.length) return scales;
  const budget = Math.max(1, opts.safeH - (shown.length + 1) * LINE_SPACING);
  const cap = opts.grow ? budget / shown.length : Number.POSITIVE_INFINITY;
  for (const { line, i } of shown) {
    const room = Math.max(0, opts.textWidth - line.fixedWidth);
    const byWidth = line.widthAt1 > 0 ? room / line.widthAt1 : Number.POSITIVE_INFINITY;
    const byHeight = line.height > 0 ? cap / line.height : Number.POSITIVE_INFINITY;
    scales[i] = Math.min(opts.grow ? byWidth : Math.min(1, byWidth), byHeight);
  }
  const total = shown.reduce((sum, { line, i }) => sum + line.height * scales[i], 0);
  if (total > opts.safeH) for (const { i } of shown) scales[i] *= opts.safeH / total;
  return scales;
}

/**
 * 依實際要印的文字寬度，一次決定 QR 的點／格與每行字級。
 * `lineWidths` 是各行「字級為 1 時」的文字寬度（標題＋最長的那筆內容）。
 * 先挑最大的 QR；若因此把文字擠到看不清楚，再一格一格把 QR 縮回來。
 */
export function fitPrintSettings(settings: PrintSettings, qrCount: number, lineWidths: number[]): PrintSettings {
  const { width: safeW, height: safeH } = safeArea(settings);
  const largest = Math.max(2, autoQrModule(qrCount, settings.qrQuiet, safeH));
  let fallback: PrintSettings | null = null;
  for (let mod = largest; mod >= 2; mod -= 1) {
    const qrSize = qrSpan(qrCount, settings.qrQuiet) * mod;
    if (qrSize > safeH) continue;
    const textWidth = safeW - textLeftDots(settings, qrSize) - TEXT_RIGHT;
    const scales = fitTextScales(settings.lines.map((line, i) => ({
      show: line.show, height: 1, widthAt1: lineWidths[i] ?? 0, fixedWidth: line.title ? settings.textGap : 0,
    })), { safeH, textWidth, grow: true });
    const lines = settings.lines.map((line, i) => {
      const size = Math.max(MIN_SIZE, Math.min(80, Math.floor(scales[i])));
      return { ...line, titleSize: size, valueSize: size };
    });
    const shown = lines.filter((_, i) => settings.lines[i].show);
    const next = normalizePrintSettings({ ...settings, qrModule: mod, lines });
    if (!shown.length || Math.min(...shown.map((line) => line.valueSize)) >= AUTO_FIT_MIN_SIZE) return next;
    fallback = next;
  }
  return fallback ?? settings;
}

/** 量測文字在字級 1 時的寬度；自動縮放與排版共用同一組字型設定。 */
export function createTextMeasurer(settings: PrintSettings): (text: string) => number {
  const ctx = document.createElement("canvas").getContext("2d")!;
  return (text: string) => {
    if (!text) return 0;
    ctx.font = `${settings.bold ? "bold" : "normal"} 100px ${FONTS[settings.font]}`;
    return ctx.measureText(text).width / 100;
  };
}

export function qrModuleCount(url: string): number {
  return QRCode.create(url, { errorCorrectionLevel: "M" }).modules.size;
}

/**
 * 標籤上三行的內容，順序與 `settings.lines` 一致。
 * 第二行以**寶寶名稱欄位**為準：它預設就是「媽媽姓名＋之子／之女＋胎序」，但護理
 * 人員改過之後，印出來的要跟畫面上看到的一樣——否則左右兩邊永遠對不起來。
 */
export function labelValues(roomNo: string, motherLabel: string, baby: LabelBaby): string[] {
  return [roomNo, baby.babyName.trim() || labelName(motherLabel, baby), baby.birthDate ? rocDate(baby.birthDate) : ""];
}

export type WristbandMetrics = { qrModule: number; qrDots: number; sizes: number[] };
export type WristbandRender = { canvas: HTMLCanvasElement; overflow: boolean; reasons: string[]; metrics: WristbandMetrics };

/** 1px = 1 印點；預覽與列印使用同一張點陣圖。 */
export function renderWristband(roomNo: string, motherLabel: string, baby: LabelBaby | null, settings: PrintSettings, calibration = false): WristbandRender {
  const { width: W, height: H } = LABEL_DOTS;
  const gap = Math.round(settings.gap * DOTS_PER_MM), rowWidth = 2 * W + gap;
  const { width: safeW, height: safeH } = safeArea(settings);
  // 「上方印不到」就是印不到**上方**：可印區要從那裡往下開始，不是從紙頭開始再把
  // 空白留到紙尾。原本留錯邊，現場只好用「整體上下微調」硬推 2 mm 補回來，預覽
  // 因此一直把正常的內容畫進粉紅色的印不到區，和實際印出來的結果對不上。
  const safeTop = Math.round(settings.unprintableTop * DOTS_PER_MM);
  const canvas = document.createElement("canvas"); canvas.width = rowWidth; canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "white"; ctx.fillRect(0, 0, rowWidth, H);
  // 超出範圍時要能指出是「哪一項設定」造成的——只說一句「超出可列印範圍」
  // 會讓人找不到該調哪裡，而列印鈕又正好是停用的，等於沒有任何線索。
  const reasons = new Set<string>();
  const mark = (condition: boolean, reason: string) => { if (condition) reasons.add(reason); };
  const metrics: WristbandMetrics = { qrModule: 0, qrDots: 0, sizes: settings.lines.map(() => 0) };
  for (let copy = 0; copy < 2; copy += 1) {
    const left = copy * (W + gap) + Math.round(settings.left * DOTS_PER_MM);
    const top = safeTop + Math.round(settings.top * DOTS_PER_MM);
    let minContentY = 0, maxContentY = safeH;
    ctx.save(); ctx.translate(left, top); ctx.fillStyle = "black";
    if (calibration) {
      ctx.fillRect(0, 0, safeW, 2); ctx.fillRect(0, safeH - 2, safeW, 2);
      ctx.fillRect(0, 0, 2, safeH); ctx.fillRect(safeW - 2, 0, 2, safeH);
      ctx.fillRect(safeW / 2, safeH / 2 - 12, 1, 24); ctx.fillRect(safeW / 2 - 12, safeH / 2, 24, 1);
      ctx.font = `bold 18px ${FONTS.jhenghei}`; ctx.fillText(copy ? "R" : "L", 8, 22);
      for (let x = 40; x < safeW; x += 40) ctx.fillRect(x, 2, 1, 7);
      for (let y = 40; y < safeH; y += 40) ctx.fillRect(2, y, 7, 1);
    } else if (baby && labelReady(baby)) {
      const qr = QRCode.create(baby.scanUrl, { errorCorrectionLevel: "M" });
      const count = qr.modules.size, quiet = settings.qrQuiet;
      const mod = settings.qrModule || autoQrModule(count, quiet, safeH);
      const qrSize = qrSpan(count, quiet) * mod, qy = Math.floor((safeH - qrSize) / 2);
      metrics.qrModule = mod; metrics.qrDots = qrSize;
      mark(mod < 2 || qrSize > safeH, "QR 放不下：把「QR 大小」改回自動、把「QR 周圍留白」調小，或把「上方印不到」調小");
      for (let y = 0; y < count; y += 1) for (let x = 0; x < count; x += 1) {
        if (qr.modules.get(y, x)) ctx.fillRect(QR_LEFT + (x + quiet) * mod, qy + (y + quiet) * mod, mod, mod);
      }
      const values = labelValues(roomNo, motherLabel, baby);
      const measure = (text: string) => {
        if (!text) return 0;
        ctx.font = `${settings.bold ? "bold" : "normal"} 100px ${FONTS[settings.font]}`;
        return ctx.measureText(text).width / 100;
      };
      const tx = textLeftDots(settings, qrSize), tw = safeW - tx - TEXT_RIGHT;
      mark(settings.lines.every((line) => !line.show), "沒有任何一行要印：請至少勾選一行「顯示」");
      mark(tx < QR_LEFT + qrSize || tw < 40, "文字區太窄：把「右側印不到」、「QR 與文字間距」或「文字水平微調」調小");
      // 字級只當上限：姓名一長就自動縮到放得下為止，不讓它壓扁或爆版。
      const scales = fitTextScales(settings.lines.map((line, i) => ({
        show: line.show, height: Math.max(line.title ? line.titleSize : 0, line.valueSize),
        widthAt1: measure(line.title) * line.titleSize + measure(values[i]) * line.valueSize,
        fixedWidth: line.title ? settings.textGap : 0,
      })), { safeH, textWidth: tw });
      const sized = (i: number, size: number) => Math.max(MIN_SIZE, Math.round(size * scales[i]));
      const lines = settings.lines.flatMap((line, i) => line.show ? [{
        title: line.title, value: values[i], titleSize: sized(i, line.titleSize), valueSize: sized(i, line.valueSize),
      }] : []);
      settings.lines.forEach((line, i) => { metrics.sizes[i] = line.show ? sized(i, line.valueSize) : 0; });
      const heights = lines.map((line) => Math.max(line.title ? line.titleSize : 0, line.valueSize));
      const total = heights.reduce((sum, value) => sum + value, 0);
      const spacing = Math.max(0, (safeH - total) / (lines.length + 1));
      minContentY = Math.min(qy, spacing);
      maxContentY = Math.max(qy + qrSize, safeH - spacing);
      let y = spacing;
      lines.forEach((line, i) => {
        const font = (size: number) => `${settings.bold ? "bold" : "normal"} ${size}px ${FONTS[settings.font]}`;
        ctx.font = font(line.titleSize); const titleW = line.title ? ctx.measureText(line.title).width : 0;
        ctx.font = font(line.valueSize); const valueW = ctx.measureText(line.value).width;
        const textGap = line.title ? settings.textGap : 0, scale = Math.min(1, tw / Math.max(1, titleW + textGap + valueW));
        mark(tw < 40 || scale < .25, "文字擠得太扁：按「自動縮放字級與 QR」，或把「右側印不到」調小");
        const { top: lineTop, baseline } = lineBounds(y, heights[i], Math.round(settings.textTop * DOTS_PER_MM));
        mark(top + lineTop < 0 || top + baseline > H, "文字超出紙張上下緣：把「文字上下微調」或「整體上下微調」調回 0 附近");
        ctx.save(); ctx.translate(tx, baseline); ctx.scale(Math.max(.01, scale), 1);
        ctx.font = font(line.titleSize); ctx.fillText(line.title, 0, 0);
        ctx.font = font(line.valueSize); ctx.fillText(line.value, titleW + textGap, 0); ctx.restore();
        y += heights[i] + spacing;
      });
    }
    mark(top + minContentY < 0 || top + maxContentY > H, "內容超出紙張上下緣：把「整體上下微調」調回 0 附近");
    mark(left + safeW > copy * (W + gap) + W, "內容超出單張寬度：把「網頁列印左側留白」調小");
    ctx.restore();
  }
  const image = ctx.getImageData(0, 0, rowWidth, H);
  for (let i = 0; i < image.data.length; i += 4) {
    const value = image.data[i] < 150 ? 0 : 255;
    image.data[i] = value; image.data[i + 1] = value; image.data[i + 2] = value;
  }
  ctx.putImageData(image, 0, 0);
  return { canvas, overflow: reasons.size > 0, reasons: [...reasons], metrics };
}

/** iframe 隔離列印 CSS；不將姓名、密碼或觀看連結放進頁面標題。 */
export async function printWristbands(images: string[], gapMm = 3): Promise<void> {
  const frame = document.createElement("iframe");
  frame.title = "寶寶標籤列印";
  frame.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0";
  document.body.appendChild(frame);
  try {
    await new Promise<void>((resolve) => {
      frame.onload = () => resolve();
      const pageWidth = 80 + Math.round(gapMm * DOTS_PER_MM) / DOTS_PER_MM;
      frame.srcdoc = `<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8"><title>寶寶標籤</title><style>@page{size:${pageWidth}mm 15mm;margin:0}html,body{margin:0;padding:0}img{display:block;width:${pageWidth}mm;height:15mm;image-rendering:pixelated;break-after:page;page-break-after:always}img:last-child{break-after:auto;page-break-after:auto}</style></head><body></body></html>`;
    });
    const doc = frame.contentDocument!;
    await Promise.all(images.map(async (src) => {
      const img = doc.createElement("img"); img.src = src; img.alt = "寶寶標籤"; doc.body.appendChild(img); await img.decode();
    }));
    await doc.fonts.ready;
    frame.contentWindow!.focus(); frame.contentWindow!.print();
    window.setTimeout(() => frame.remove(), 60_000);
  } catch (reason) { frame.remove(); throw reason; }
}
