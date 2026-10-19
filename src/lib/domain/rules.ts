import type { CaseRecord, WindowRule } from "./types";

export function casePrice(record: Pick<CaseRecord, "roomType" | "days" | "hospital" | "priceClass" | "addOns">) {
  const base = { 精緻: 7500, VIP: 8500, VILLA: 9500 }[record.roomType];
  const hospital = record.hospital.includes("園內") || record.hospital === "園內" ? 0 : ["成大", "奇美", "成大／奇美"].includes(record.hospital) ? 150 : 300;
  const multiplier = record.priceClass === "員工價" ? 0.9 : record.priceClass === "特約企業" ? 0.95 : 1;
  const paid = Math.max(0, record.days - freeDays(record.days));
  const addOns = record.addOns ?? [];
  const upgrade = addOns.includes("升等房間") && record.roomType !== "VILLA";
  return Math.round((base + hospital) * paid * multiplier + (upgrade ? 1000 * paid : 0) + (upgrade && addOns.includes("餐點一併升等") ? 300 * paid : 0) + (addOns.includes("紅蟳火鍋") ? 1200 : 0));
}
export function casePriceBreakdown(record: Pick<CaseRecord, "roomType" | "days" | "hospital" | "priceClass" | "addOns">) {
  const baseDaily = { 精緻: 7500, VIP: 8500, VILLA: 9500 }[record.roomType];
  const hospitalDaily = record.hospital.includes("園內") || record.hospital === "園內" ? 0 : ["成大", "奇美", "成大／奇美"].includes(record.hospital) ? 150 : 300;
  const multiplier = record.priceClass === "員工價" ? 0.9 : record.priceClass === "特約企業" ? 0.95 : 1;
  const giftedDays = freeDays(record.days); const paidDays = Math.max(0, record.days - giftedDays);
  const upgradeDaily = (record.addOns ?? []).includes("升等房間") && record.roomType !== "VILLA" ? 1000 : 0;
  const mealUpgradeDaily = upgradeDaily && (record.addOns ?? []).includes("餐點一併升等") ? 300 : 0;
  const oneTime = (record.addOns ?? []).includes("紅蟳火鍋") ? 1200 : 0;
  return { baseDaily, hospitalDaily, multiplier, paidDays, giftedDays, upgradeDaily, mealUpgradeDaily, oneTime, total: casePrice(record) };
}
export function freeDays(days: number) { return days >= 29 ? 2 : days >= 24 ? 1 : 0; }
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
  if (record.stage === 6 && (!record.settlementDone || record.checkoutChecklist.length < 6)) errors.push("請完成尾款結算與全部返家點交項目。");
  if (record.stage === 6 && record.childcare && (!record.childcareCar.trim() || !record.childcareContact.trim() || record.childcareDays < 1)) errors.push("續留托嬰須填車號、接送人與天數。");
  return errors;
}
