import type { CaseRecord } from "@/lib/domain/types";
import { caseBalance, casePriceBreakdown, gifts } from "@/lib/domain/rules";
import { ResultCard, SummaryRow } from "@/components/ui/Workspace";

const money = (amount: number) => `NT$ ${amount.toLocaleString("zh-TW")}`;

/** 直接讀取既有案件計價，不另存一份摘要或改寫帳務。 */
export default function CaseAmountSummary({ record }: { record: CaseRecord }) {
  const detail = casePriceBreakdown(record);
  const quoting = record.stage <= 1;
  return <ResultCard title={quoting ? "套餐試算" : "應收餘額"} value={money(quoting ? record.overrideAmount ?? detail.total : caseBalance(record))} description={`${record.roomType}・${record.days} 天（付費 ${detail.paidDays} 天）`}>
    {quoting ? <>
      <SummaryRow label={`日租 ${money(detail.baseDaily + detail.hospitalDaily)} × ${detail.paidDays} 天`} value={money((detail.baseDaily + detail.hospitalDaily) * detail.paidDays)} />
      {detail.upgradeDaily > 0 && <SummaryRow label="房間升等" value={money(detail.upgradeDaily * detail.paidDays)} />}
      {detail.mealUpgradeDaily > 0 && <SummaryRow label="餐點升等" value={money(detail.mealUpgradeDaily * detail.paidDays)} />}
      {detail.oneTime > 0 && <SummaryRow label="單次加購" value={money(detail.oneTime)} />}
      {detail.multiplier !== 1 && <SummaryRow label={record.priceClass} value={`× ${detail.multiplier}`} />}
      {record.overrideAmount !== null && <p className="mt-3 text-xs leading-5 text-amber-800">已保留覆寫金額；變更條件後請再次確認。</p>}
    </> : <>
      <SummaryRow label="原合約" value={money(record.overrideAmount ?? record.quotedAmount)} />
      <SummaryRow label="訂金" value={money(record.deposit)} />
      <SummaryRow label="後續付款" value={money(record.payments.reduce((sum, payment) => sum + payment.amount, 0))} />
      <SummaryRow label="試吃折抵" value={money(record.tasting ? 350 : 0)} muted />
    </>}
    {detail.giftedDays > 0 && <SummaryRow label="贈送天數" value={`${detail.giftedDays} 天`} muted />}
    {gifts(record.days).map((gift) => <SummaryRow key={gift} label={gift} value="贈" muted />)}
  </ResultCard>;
}
