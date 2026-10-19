/**
 * CSV 匯出。
 *
 * 純字串組，不引入套件——需要的只有 RFC 4180 的轉義規則與兩個現場必踩的坑：
 * Excel 的編碼判斷，以及公式注入。
 */

/**
 * UTF-8 BOM。
 *
 * ⚠️ 少了它，Excel 會用系統預設編碼（在台灣是 cp950）開啟，中文全變亂碼——
 * 而院方只會回報「報表打不開」，不會想到是編碼問題。
 */
export const UTF8_BOM = "﻿";

/**
 * 以 `=` `+` `-` `@` 或控制字元開頭的值，在 Excel／Sheets 裡會被當成**公式**執行。
 *
 * 這不是理論問題：媽媽姓名、寶寶名、車號都是使用者自由輸入的，只要有人填進
 * `=HYPERLINK(...)` 之類的東西，開啟報表的人就會被攻擊。前綴一個單引號讓它
 * 強制以文字呈現——單引號本身在 Excel 顯示時會被吃掉，不影響閱讀。
 */
const FORMULA_PREFIX = /^[=+\-@\t\r]/;

export function csvCell(value: unknown): string {
  if (value === null || value === undefined) return "";

  const text = String(value);
  const guarded = FORMULA_PREFIX.test(text) ? `'${text}` : text;

  // 含逗號、雙引號或換行時要用雙引號包起來，內部的雙引號加倍。
  return /[",\r\n]/.test(guarded) ? `"${guarded.replaceAll('"', '""')}"` : guarded;
}

/** 組出完整的 CSV 內容（含 BOM）。換行用 \r\n，這是 RFC 4180 的規定。 */
export function toCsv(headers: string[], rows: ReadonlyArray<ReadonlyArray<unknown>>): string {
  const lines = [headers.map(csvCell).join(","), ...rows.map((row) => row.map(csvCell).join(","))];
  return UTF8_BOM + lines.join("\r\n") + "\r\n";
}

/** 秒數轉成「X 小時 Y 分」。格式化一律在 JS 做，SQL 只回秒數。 */
export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0 分";
  const totalMinutes = Math.round(seconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes} 分`;
  return minutes === 0 ? `${hours} 小時` : `${hours} 小時 ${minutes} 分`;
}
