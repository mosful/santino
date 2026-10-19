/** 手圈的結構化資料；識別碼只辨識寶寶，不授予觀看權限。 */
export type LabelFields = {
  birthDate: string | null;
  sex: "male" | "female" | null;
  birthOrder: number | null;
};

export type LabelBaby = LabelFields & {
  cameraId: number;
  cameraCode: string;
  babyName: string;
  cartNo: string | null;
  identityCode: string;
  scanUrl: string;
};

export type LabelData = { bindingId: number; roomNo: string; motherLabel: string; babies: LabelBaby[] };

export function taipeiToday(now = new Date()): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Taipei" }).format(now);
}

export function isBirthDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.valueOf()) && date.toISOString().slice(0, 10) === value
    && value > "1911-12-31" && value <= taipeiToday();
}

export function labelFieldsError(fields: LabelFields): string | null {
  if (fields.birthDate !== null && !isBirthDate(fields.birthDate)) return "生產日期須為有效日期，且不可晚於今天。";
  if (fields.sex !== null && fields.sex !== "male" && fields.sex !== "female") return "請選擇有效的性別。";
  if (fields.birthOrder !== null && (!Number.isInteger(fields.birthOrder) || fields.birthOrder < 0 || fields.birthOrder > 99)) return "胎序須為單胞胎或 1 至 99。";
  return null;
}

export function labelReady(fields: LabelFields): boolean {
  return !labelFieldsError(fields) && !!fields.birthDate && !!fields.sex && fields.birthOrder !== null;
}

export function labelOrdersError(babies: Array<Partial<LabelFields>>): string | null {
  if (babies.length < 2) return null;
  const orders = babies.flatMap((baby) => baby.birthOrder == null ? [] : [baby.birthOrder]);
  if (orders.includes(0)) return "多胞胎請選擇各自的胎序，不可選單胞胎。";
  if (new Set(orders).size !== orders.length) return "同一筆入住的寶寶胎序不可重複。";
  return null;
}

export function chineseOrdinal(value: number): string {
  const digits = "零一二三四五六七八九";
  if (value < 10) return digits[value] ?? String(value);
  return `${value >= 20 ? digits[Math.floor(value / 10)] : ""}十${value % 10 ? digits[value % 10] : ""}`;
}

export function labelName(motherLabel: string, fields: LabelFields): string {
  return `${motherLabel}之${fields.sex === "female" ? "女" : "子"}${fields.birthOrder ? `(${chineseOrdinal(fields.birthOrder)})` : ""}`;
}

export function rocDate(value: string): string {
  const [year, month, day] = value.split("-");
  return `${Number(year) - 1911}/${month}/${day}`;
}
