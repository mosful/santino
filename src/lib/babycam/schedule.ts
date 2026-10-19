/**
 * 觀看開放時段的判定規則。
 *
 * 刻意與資料庫解耦：原本整段邏輯埋在 `isScheduleOpen` 裡，和三次 DB 查詢混在
 * 一起，**跨午夜的分支完全沒有測試**。抽成純函式後可以逐條驗證邊界。
 */

export type ScheduleMode = "global" | "always" | "closed" | "scheduled";

export type ScheduleWindow = {
  mode: ScheduleMode | string;
  /** HH:MM，24 小時制。 */
  start: string | null;
  end: string | null;
};

/** 取台北時間的 HH:MM。院方以當地時間設定時段，伺服器時區不一定一致。 */
export function taipeiHhmm(at: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Taipei",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(at);
}

/** 取台北時間的 YYYY-MM-DD。每筆入住的開放日期區間以當地日期判定。 */
export function taipeiDate(at: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(at);
}

/**
 * 台北某一天的起訖瞬間，轉成 UTC 的 ISO 字串。
 *
 * ⚠️ 報表的日期區間一定要經過這裡。院方在畫面上選的是**台北日期**，而事件
 * 時間戳存的是 UTC：台北 10/13 凌晨發生的事，`at` 會是 `2026-10-12T16:xx:xxZ`。
 * 直接拿 `2026-10-13T00:00:00Z` 當下界，那一整段就查不到——而且不會報錯，
 * 只會「報表少了幾筆」，最難發現的那種。
 *
 * 台北固定 UTC+8、無日光節約，所以可以直接用固定位移。
 */
const TAIPEI_OFFSET = "+08:00";

export function taipeiStartOfDay(date: string): string {
  return new Date(`${date}T00:00:00.000${TAIPEI_OFFSET}`).toISOString();
}

export function taipeiEndOfDay(date: string): string {
  return new Date(`${date}T23:59:59.999${TAIPEI_OFFSET}`).toISOString();
}

/**
 * 判斷某個時刻是否落在開放時段內。
 *
 * `start > end` 代表**跨午夜**（例如 22:00–06:00），此時條件要改成「或」。
 * 這個分支是整段邏輯最容易寫錯、也最難靠人工測出來的地方。
 */
export function isWithinSchedule(window: ScheduleWindow, hhmm: string): boolean {
  if (window.mode === "always") return true;
  if (window.mode === "closed") return false;
  // 設定不完整時採放行，與既有行為一致——寧可看得到，也不要無聲關閉。
  if (!window.start || !window.end) return true;
  return window.start <= window.end
    ? hhmm >= window.start && hhmm <= window.end
    : hhmm >= window.start || hhmm <= window.end;
}

/**
 * 時段的受眾。
 *
 * 院內（媽媽在病房掃 QR Code、護理站）與親友（院外遠端）適用不同時段——院方
 * 常見的做法是院內開得比親友晚關。字彙刻意對齊 `access_tokens.kind`，
 * 兩邊才不需要再做一次映射。
 *
 * 同一組時段**同時**決定「誰此刻能看」與「環狀燈要不要揭露有人在看」，
 * 不再像舊版那樣分成兩套各設一次。
 */
export type ScheduleAudience = "internal" | "family";

export const SCHEDULE_AUDIENCES: readonly ScheduleAudience[] = ["internal", "family"];

/** 一台鏡頭上各受眾**已解析完成**（含每機覆寫）的時段。 */
export type AudienceWindows = Record<ScheduleAudience, ScheduleWindow>;

/** 設定不完整時的放行視窗，語意與 `isWithinSchedule` 的 fail-open 一致。 */
export const ALWAYS_OPEN: ScheduleWindow = { mode: "always", start: null, end: null };

/**
 * 解析每機覆寫與全院預設。
 *
 * `mode === "global"` 時**整組**換成全院設定，而不是逐欄位 merge——
 * 一台鏡頭設了 `scheduled` 卻留空 start/end，不該去借全院的時間，
 * 那會變成「我明明設了個別時段，怎麼跑出別的時間」。留空就走 fail-open。
 */
export function resolveWindow(camera: ScheduleWindow, global: ScheduleWindow): ScheduleWindow {
  return camera.mode === "global" ? global : camera;
}

/**
 * 時段的人類可讀描述，供管理端顯示。
 * 全天開放回 null（畫面上不必佔位），全天關閉另給文字而非空區間。
 */
export function describeWindow(window: ScheduleWindow): string | null {
  if (window.mode === "always") return null;
  if (window.mode === "closed") return "全天關閉";
  if (!window.start || !window.end) return null;
  return `${window.start}–${window.end}`;
}

/**
 * ── 時段的交集 ──────────────────────────────────────────────────
 *
 * 院方要的是三層：**全院總開放時段**（最上層限制）→ 院內／親友各自的時段 →
 * 每機覆寫。往下只會更嚴，不會更鬆——上層關掉的時間，下層再怎麼設也打不開。
 *
 * 用「交集」而不是「覆寫」是刻意的：覆寫會讓 04 的全院設定被下層各自蓋掉，
 * 三個月後沒有人能回答「為什麼這一房現在還看得到」。
 */

/** 一天之內的閉區間，單位是分鐘（0 = 00:00，1439 = 23:59）。 */
type WindowSegment = { startMinute: number; endMinute: number };

const DAY_MINUTES = 1440;
const LAST_MINUTE = DAY_MINUTES - 1;

function toMinutes(hhmm: string): number {
  const [hour, minute] = hhmm.split(":").map(Number);
  return hour * 60 + minute;
}

function toHhmm(minute: number): string {
  return `${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`;
}

/**
 * 把一個視窗攤成當天的分鐘區間。
 *
 * 跨午夜（start > end）會攤成**兩段**：`[start, 23:59]` 與 `[00:00, end]`。
 * 設定不完整時視為全天開放，與 `isWithinSchedule` 的 fail-open 一致。
 */
function toSegments(window: ScheduleWindow): WindowSegment[] {
  if (window.mode === "closed") return [];
  if (window.mode === "always" || !window.start || !window.end) {
    return [{ startMinute: 0, endMinute: LAST_MINUTE }];
  }
  const start = toMinutes(window.start);
  const end = toMinutes(window.end);
  if (start <= end) return [{ startMinute: start, endMinute: end }];
  return [
    { startMinute: start, endMinute: LAST_MINUTE },
    { startMinute: 0, endMinute: end },
  ];
}

/** 合併重疊或**相鄰**的區間。相鄰也要併：10:00–12:00 與 12:01–14:00 其實是一段。 */
function mergeSegments(segments: WindowSegment[]): WindowSegment[] {
  const sorted = [...segments].sort((a, b) => a.startMinute - b.startMinute);
  const merged: WindowSegment[] = [];
  for (const segment of sorted) {
    const last = merged[merged.length - 1];
    if (last && segment.startMinute <= last.endMinute + 1) {
      last.endMinute = Math.max(last.endMinute, segment.endMinute);
    } else {
      merged.push({ ...segment });
    }
  }
  return merged;
}

function segmentLength(segment: WindowSegment): number {
  return segment.endMinute - segment.startMinute + 1;
}

export type IntersectionResult = {
  /**
   * 交集的結果。無法用單一連續區間表達時，取**涵蓋分鐘數最多**的那一段。
   * 丟掉的一定是較短的那段，所以結果必然是真交集的子集——只會少開，不會多開。
   */
  window: ScheduleWindow;
  /** 交集的完整段數。`length > 1` 代表有一段被捨棄了，UI 要據此提示。 */
  segments: ScheduleWindow[];
  truncated: boolean;
};

function segmentsToWindows(segments: WindowSegment[]): ScheduleWindow[] {
  return segments.map((segment) =>
    segment.startMinute === 0 && segment.endMinute === LAST_MINUTE
      ? { mode: "always", start: null, end: null }
      : { mode: "scheduled", start: toHhmm(segment.startMinute), end: toHhmm(segment.endMinute) },
  );
}

/**
 * 兩個視窗取交集。
 *
 * `always` 是單位元素（`always ∩ X = X`），`closed` 是吸收元素（`closed ∩ X = closed`）
 * ——全院總時段的預設值就是 `always`，所以升級後的行為與原本完全相同。
 */
export function intersectWindows(outer: ScheduleWindow, inner: ScheduleWindow): IntersectionResult {
  const overlaps: WindowSegment[] = [];
  for (const a of toSegments(outer)) {
    for (const b of toSegments(inner)) {
      const startMinute = Math.max(a.startMinute, b.startMinute);
      const endMinute = Math.min(a.endMinute, b.endMinute);
      if (startMinute <= endMinute) overlaps.push({ startMinute, endMinute });
    }
  }

  const merged = mergeSegments(overlaps);

  if (merged.length === 0) {
    return { window: { mode: "closed", start: null, end: null }, segments: [], truncated: false };
  }

  // ⚠️ 繞行合併不可省。兩個跨午夜的視窗取交集後，結果會是「00:00 開頭」與
  // 「23:59 結尾」兩段，但那其實是**同一段跨午夜區間**被午夜切開而已。
  // 少了這一步，22:00–06:00 ∩ 全天 會被判成「不連續的兩段」而發出假警告。
  const first = merged[0];
  const last = merged[merged.length - 1];
  if (merged.length >= 2 && first.startMinute === 0 && last.endMinute === LAST_MINUTE) {
    merged.shift();
    merged.pop();
    merged.unshift({ startMinute: last.startMinute, endMinute: first.endMinute + DAY_MINUTES });
  }

  if (merged.length === 1) {
    const only = merged[0];
    if (only.startMinute === 0 && only.endMinute === LAST_MINUTE) {
      return { window: { mode: "always", start: null, end: null }, segments: [{ mode: "always", start: null, end: null }], truncated: false };
    }
    const window: ScheduleWindow = {
      mode: "scheduled",
      start: toHhmm(only.startMinute),
      end: toHhmm(only.endMinute % DAY_MINUTES),
    };
    return { window, segments: [window], truncated: false };
  }

  // 真的無法用單一區間表達：取較長的那一段，較短的捨棄並讓 UI 提示。
  const longest = merged.reduce((best, segment) =>
    segmentLength(segment) > segmentLength(best) ? segment : best,
  );
  const window: ScheduleWindow = {
    mode: "scheduled",
    start: toHhmm(longest.startMinute % DAY_MINUTES),
    end: toHhmm(longest.endMinute % DAY_MINUTES),
  };
  return { window, segments: segmentsToWindows(merged), truncated: true };
}

/**
 * 三層解析的唯一定義：**全院總時段 ∩（每機覆寫 ?? 全院受眾時段）**。
 *
 * 每機覆寫與全院受眾時段之間仍是既有的「整組替換」語意（`resolveWindow`），
 * 全院總時段則是套在最外層的硬限制。
 */
export function effectiveWindow(
  house: ScheduleWindow,
  global: ScheduleWindow,
  camera: ScheduleWindow,
): IntersectionResult {
  return intersectWindows(house, resolveWindow(camera, global));
}
