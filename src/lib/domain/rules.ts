import type { CaseRecord, WindowRule } from "./types";
import { hospitalTier, type HospitalTier } from "./options";

/**
 * 房型 × 生產院所的每日房價 —— 取自客戶手冊第 39 頁「早鳥活動－退費試算.xlsx」。
 *
 * 精緻房與 VIP 房三欄都有明列；VILLA 只列了院內 9,600 與院外 10,000，
 * 中間的成大／奇美一欄原表沒有，先按其院內→院外加價 400 的一半估 9,800，**待客戶確認**。
 *
 * ⚠️ 不要再寫成「基價＋固定加價」：VILLA 的院外加價是 400，和精緻／VIP 的 300 不同，
 * 用單一加價算出來的 VIP／VILLA 會整欄少 100 元（原本就是這樣錯的）。
 */
export const ROOM_RATES: Record<CaseRecord["roomType"], Record<HospitalTier, number>> = {
  精緻: { 院內: 7500, 成大奇美: 7650, 院外: 7800 },
  VIP: { 院內: 8600, 成大奇美: 8750, 院外: 8900 },
  VILLA: { 院內: 9600, 成大奇美: 9800, 院外: 10000 },
};

/** 某房型在某院所級距的每日房價。 */
export function roomDailyRate(roomType: CaseRecord["roomType"], hospital: string) {
  return ROOM_RATES[roomType][hospitalTier(hospital)];
}

export function casePrice(record: Pick<CaseRecord, "roomType" | "days" | "hospital" | "priceClass" | "addOns">) {
  const base = ROOM_RATES[record.roomType].院內;
  const hospital = roomDailyRate(record.roomType, record.hospital) - base;
  const multiplier = record.priceClass === "員工價" ? 0.9 : record.priceClass === "特約企業" ? 0.95 : 1;
  const paid = Math.max(0, record.days - freeDays(record.days));
  const addOns = record.addOns ?? [];
  const upgrade = addOns.includes("升等房間") && record.roomType !== "VILLA";
  return Math.round((base + hospital) * paid * multiplier + (upgrade ? 1000 * paid : 0) + (upgrade && addOns.includes("餐點一併升等") ? 300 * paid : 0) + (addOns.includes("紅蟳火鍋") ? 1200 : 0));
}
export function casePriceBreakdown(record: Pick<CaseRecord, "roomType" | "days" | "hospital" | "priceClass" | "addOns">) {
  const baseDaily = ROOM_RATES[record.roomType].院內;
  const hospitalDaily = roomDailyRate(record.roomType, record.hospital) - baseDaily;
  const multiplier = record.priceClass === "員工價" ? 0.9 : record.priceClass === "特約企業" ? 0.95 : 1;
  const giftedDays = freeDays(record.days); const paidDays = Math.max(0, record.days - giftedDays);
  const upgradeDaily = (record.addOns ?? []).includes("升等房間") && record.roomType !== "VILLA" ? 1000 : 0;
  const mealUpgradeDaily = upgradeDaily && (record.addOns ?? []).includes("餐點一併升等") ? 300 : 0;
  const oneTime = (record.addOns ?? []).includes("紅蟳火鍋") ? 1200 : 0;
  return { baseDaily, hospitalDaily, multiplier, paidDays, giftedDays, upgradeDaily, mealUpgradeDaily, oneTime, total: casePrice(record) };
}
/**
 * 贈送天數：住 21 天贈 1 天、住 28 天贈 2 天。
 * 依客戶手冊第 47 頁月統計表的天數級距（0-14／15-21／**21+1**／**28+2**／30／其他）回推，
 * 原本寫的 24／29 門檻是錯的。
 */
export function freeDays(days: number) { return days >= 28 ? 2 : days >= 21 ? 1 : 0; }
export function gifts(days: number) { return days >= 30 ? ["胸腺疏通", "維納斯身體雕塑"] : days >= 21 ? ["胸腺疏通"] : []; }
export function caseNextAction(record: CaseRecord) {
  if (record.closed) return "案件已結案";
  if (record.stage === 0) return record.visitDate ? `${record.visitDate} ${record.visitTime || ""} 等待參觀` : "安排參觀日期與時段";
  if (record.stage === 1) return record.visitStatus === "已出席" ? "確認方案並完成下訂" : "確認參觀出席或改期";
  if (record.stage === 2) return record.contractNo ? "確認訂金並進入合約" : "建立收字號與訂金";
  if (record.stage === 3) return record.signed ? "追蹤入住前聯絡" : "完成審閱與合約簽署";
  if (record.stage === 4) return record.actualAdmission ? "確認房間並辦理入住" : "產前聯絡與待產通知";
  if (record.stage === 5) return "每日照護、費用與變更追蹤";
  return "尾款、返家點交與托嬰確認";
}
export function caseBalance(record: CaseRecord) {
  return (record.overrideAmount ?? record.quotedAmount) + record.ledger.reduce((sum, item) => sum + item.amount, 0) - record.deposit - (record.tasting ? 350 : 0) - (record.payments ?? []).reduce((sum, item) => sum + item.amount, 0);
}
export function dailyCharges(record: CaseRecord) {
  const original = record.contractSnapshot ? JSON.parse(record.contractSnapshot) as { days?: number; amount?: number } : {};
  const days = original.days ?? record.days;
  const total = original.amount ?? record.overrideAmount ?? record.quotedAmount;
  const paid = Math.max(1, days - freeDays(days)); const daily = Math.floor(total / paid);
  const rows: { date: string; label: string; amount: number }[] = [];
  if (record.actualAdmission) for (let index = 0; index < days; index++) rows.push({ date: new Date(Date.parse(`${record.actualAdmission}T00:00:00+08:00`) + index * 86_400_000).toLocaleDateString("en-CA", { timeZone: "Asia/Taipei" }), label: index >= paid ? "原合約贈送日" : "原合約房租／套餐分攤", amount: index >= paid ? 0 : daily + (index === paid - 1 ? total - daily * paid : 0) });
  return [...rows, ...record.ledger.map((entry) => ({ date: entry.date, label: entry.label, amount: entry.amount }))].sort((a, b) => a.date.localeCompare(b.date));
}
export function validTime(value: string) { return /^([01]\d|2[0-3]):[0-5]\d$/.test(value); }
export function withinWindow(rule: WindowRule, at: Date) {
  if (rule.mode === "closed") return false;
  if (rule.mode !== "scheduled") return true;
  if (!validTime(rule.start) || !validTime(rule.end)) return false;
  const current = at.toLocaleTimeString("en-GB", { timeZone: "Asia/Taipei", hour12: false }).slice(0, 5);
  return rule.start <= rule.end ? current >= rule.start && current <= rule.end : current >= rule.start || current <= rule.end;
}
export function caseTransitionErrors(record: CaseRecord, reviewDays = 5): string[] {
  const errors: string[] = [];
  if (record.closed) return ["已結案，請先由主管重新開啟。"];
  if (!record.name.trim() || !record.phone.trim()) errors.push("請填寫媽媽姓名與聯絡電話。");
  if (record.stage === 0 && !record.visitDate) errors.push("請安排參觀日期。");
  if (record.stage === 1 && record.visitStatus !== "已出席") errors.push("請確認參觀出席，未出席或改期案件先留在參觀階段。");
  if (record.stage === 2 && (!record.contractNo.trim() || record.deposit <= 0 || record.days <= 0)) errors.push("請填寫收字號、正確天數及訂金。");
  if (record.stage === 3 && (!record.signed || !record.signature || !record.reviewStart || !record.signedDate)) errors.push("請完成審閱期、簽約日與本案簽名。");
  if (record.stage === 3 && (!record.milkConsent || !record.milkChoice)) errors.push("請完成母乳哺育意願書與哺餵方式選擇。");
  if (record.reviewStart && record.signedDate && record.reviewStart > record.signedDate) errors.push("攜回審閱日不能晚於簽約日。");
  if (record.stage === 3 && record.reviewStart && record.signedDate && Date.parse(record.signedDate) - Date.parse(record.reviewStart) < reviewDays * 86_400_000) errors.push(`示範審閱期為 ${reviewDays} 天，攜回審閱日須再往前調整。`);
  if (record.stage === 4 && (!record.actualAdmission || !record.room)) errors.push("請填寫實際入住日並選擇房間。");
  if (record.stage === 6 && !record.settlementDone) errors.push("請完成尾款結算。");
  if (record.stage === 6 && !record.checkoutCompletedAt) errors.push("請完成返家檢查表（29 項逐項確認）。");
  if (record.stage === 6 && record.childcare && (!record.childcareCar.trim() || !record.childcareContact.trim() || record.childcareDays < 1)) errors.push("續留托嬰須填車號、接送人與天數。");
  return errors;
}
