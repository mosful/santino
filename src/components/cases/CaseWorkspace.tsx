"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { caseActions, useDomainStore } from "@/lib/demo/domainStore";
import { CASE_STAGES, type CaseRecord, type ReservationInput } from "@/lib/domain/types";
import { caseBalance, caseNextAction, casePrice, casePriceBreakdown, gifts } from "@/lib/domain/rules";
import { CORPORATE_COMPANIES, COMMON_STAY_DAYS, HOSPITALS } from "@/lib/domain/options";
import { DEFAULT_SALE_ITEMS, SALE_CATEGORIES, ledgerByCategory, saleItemsOf } from "@/lib/domain/sales";
import { useCurrentRole } from "@/lib/roleStore";
import { taipeiTimestamp } from "@/lib/care/rules";
import CareSignature from "@/components/care/CareSignature";
import PageHeader from "@/components/ui/PageHeader";
import CollapsibleSection from "@/components/ui/CollapsibleSection";
import ContractSteps from "./ContractSteps";
import RoomServicePanel from "./RoomServicePanel";
import { DailyLedger, AdmissionMeal, ReturnPhotos, ReturnInspection, ReturnGuide, RefundCalculator } from "./CaseDetails";
import CaseDocs from "./CaseDocs";
import { buttonStyles } from "@/components/ui/buttonStyles";
import { CASE_FLOW_ROLE_HINT, canUseCaseFlow } from "@/lib/permissions";

const input = "min-h-12 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm disabled:bg-stone-100";
// 按鈕樣式一律取自 components/ui/Button，不在此另開複本（見該檔開頭說明）。
const button = buttonStyles();
const money = (amount: number) => `NT$ ${amount.toLocaleString("zh-TW")}`;
// 選項清單一律取自 lib/domain/options.ts（以前散在五個檔案，醫院與特約企業都寫錯）。
const corporateCompanies = [...CORPORATE_COMPANIES];
const emptyReservation = (): ReservationInput => ({ category: "懷孕", name: "", phone: "", dueDate: "", parity: "第 1 胎", deliveryMethod: "未定", hospital: HOSPITALS[0], visitDate: "", visitTime: "14:00", source: "網路推薦", receptionist: "林小姐", note: "" });
type QuotePreset = Pick<CaseRecord, "roomType" | "days" | "hospital" | "priceClass" | "corporateCompany">;

// required 會在標題右邊加紅色 *：客戶回報按下儲存才跳「請完成必填欄位」，卻看不出哪幾欄要填。
function Field({ label, value, type = "text", options, onChange, required = false }: { label: string; value: string | number; type?: string; options?: string[]; onChange: (value: string) => void; required?: boolean }) {
  return <label className="block space-y-2 text-sm"><span>{label}{required && <em className="ml-0.5 not-italic font-semibold text-rose-600" aria-hidden="true">*</em>}</span>{options ? <select aria-label={label} className={input} value={value} onChange={(event) => onChange(event.target.value)}>{options.map((option) => <option key={option}>{option}</option>)}</select> : <input aria-label={label} className={input} type={type} value={value} onChange={(event) => onChange(event.target.value)} />}</label>;
}

function PaymentRecords({ record, editable }: { record: CaseRecord; editable: boolean }) {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("轉帳");
  const [date, setDate] = useState(new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Taipei" }));
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");
  // 收款科目、發票／收據與卡號末四碼：舊系統收款記錄本來就有這幾欄（手冊第 25 頁）。
  const [subject, setSubject] = useState("尾款");
  const [invoice, setInvoice] = useState("");
  const [cardLast4, setCardLast4] = useState("");
  /*
    既有付款可以改、可以刪（客戶 2026-10-22：清單都要能再次編輯儲存），
    但帳務異動一律要填原因，原值與新值都會寫進案件歷程，帳面才追得回來。
  */
  const [editingId, setEditingId] = useState("");
  const [removingId, setRemovingId] = useState("");
  const [reason, setReason] = useState("");
  const today = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Taipei" });
  function resetForm() { setEditingId(""); setRemovingId(""); setReason(""); setAmount(""); setNote(""); setMethod("轉帳"); setDate(today()); setSubject("尾款"); setInvoice(""); setCardLast4(""); }
  function run(action: () => void, success: string) {
    try { action(); resetForm(); setMessage(success); }
    catch (error) { setMessage(error instanceof Error ? error.message : "操作失敗。"); }
  }
  function startEdit(item: CaseRecord["payments"][number]) {
    setEditingId(item.id); setRemovingId(""); setReason("");
    setAmount(String(item.amount)); setMethod(item.method); setDate(item.date); setNote(item.note);
    setSubject(item.subject ?? "尾款"); setInvoice(item.invoice ?? ""); setCardLast4(item.cardLast4 ?? "");
  }
  return <CollapsibleSection id="case-payments" title="付款紀錄" summary={`${record.payments.length} 筆`} bodyClassName="space-y-4">
    <p className="text-sm text-stone-500">訂金另列於下訂階段；此處記錄後續分次付款並保留經手人。每一筆都可再次編輯或刪除，異動需填原因並寫入案件歷程。</p>
    {editable && <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Field label="付款金額" type="number" value={amount} onChange={setAmount} />
      <Field label="付款方式" value={method} options={["現金", "轉帳", "刷卡", "其他"]} onChange={setMethod} />
      <Field label="付款日期" type="date" value={date} onChange={setDate} />
      <Field label="收款科目" value={subject} options={["訂金", "尾款", "自費", "托嬰費", "其他"]} onChange={setSubject} />
      <Field label="發票／收據號碼" value={invoice} onChange={setInvoice} />
      {method === "刷卡" && <Field label="信用卡末四碼" value={cardLast4} onChange={setCardLast4} />}
      <Field label="備註" value={note} onChange={setNote} />
      {editingId && <div className="xl:col-span-4"><Field label="修改原因（必填）" value={reason} onChange={setReason} /></div>}
      <div className="flex flex-wrap gap-2 xl:col-span-4 xl:justify-self-end">
        {editingId && <button type="button" className={button} onClick={resetForm}>取消修改</button>}
        <button type="button" className={buttonStyles({ variant: "primary" })} onClick={() => run(() => {
          const extra = { subject, invoice, cardLast4: method === "刷卡" ? cardLast4 : "" };
          if (editingId) caseActions.updatePayment(record.id, editingId, Number(amount), method, date, note, reason, extra);
          else caseActions.payment(record.id, Number(amount), method, date, note, extra);
        }, editingId ? "付款紀錄已更新，異動寫入案件歷程。" : "付款紀錄已新增。")}>{editingId ? "儲存修改" : "新增付款"}</button>
      </div>
    </div>}
    <div className="overflow-x-auto">
      <table className="w-full min-w-[620px] text-left text-sm">
        <thead><tr className="border-b border-stone-200"><th className="p-2">日期</th><th className="p-2">科目</th><th className="p-2">方式</th><th className="p-2 text-right">金額</th><th className="p-2">發票／收據</th><th className="p-2">經手／備註</th>{editable && <th className="p-2">操作</th>}</tr></thead>
        <tbody>{record.payments.map((item) => <tr key={item.id} className="border-b border-stone-100">
          <td className="p-2">{item.date}</td>
          <td className="p-2">{item.subject ?? "—"}</td>
          <td className="p-2">{item.method}{item.cardLast4 ? `（****${item.cardLast4}）` : ""}</td>
          <td className="p-2 text-right">{money(item.amount)}</td>
          <td className="p-2">{item.invoice || "—"}</td>
          <td className="p-2">{item.actor}{item.note ? `｜${item.note}` : ""}</td>
          {editable && <td className="p-2"><div className="flex flex-wrap gap-2"><button type="button" className={buttonStyles({ size: "sm" })} onClick={() => startEdit(item)}>編輯</button><button type="button" className={buttonStyles({ size: "sm" })} onClick={() => { setRemovingId(item.id); setEditingId(""); setReason(""); }}>刪除</button></div></td>}
        </tr>)}</tbody>
      </table>
      {!record.payments.length && <p className="py-4 text-center text-sm text-stone-400">尚無後續付款紀錄</p>}
    </div>
    {removingId && editable && <div className="space-y-3 rounded-xl border border-amber-300 bg-amber-50 p-4">
      <h3 className="font-semibold">刪除付款紀錄</h3>
      <p className="text-sm">刪除後金額不再計入收款，原紀錄與原因會保留在案件歷程。</p>
      <Field label="刪除原因（必填）" value={reason} onChange={setReason} />
      <div className="flex flex-wrap gap-2">
        <button type="button" className={button} onClick={resetForm}>取消</button>
        <button type="button" className={buttonStyles({ variant: "danger" })} onClick={() => run(() => caseActions.removePayment(record.id, removingId, reason), "付款紀錄已刪除，異動寫入案件歷程。")}>確認刪除</button>
      </div>
    </div>}
    <div className="flex flex-wrap items-center justify-between gap-2">
      <p role="status" className="text-sm">{message}</p>
      <button type="button" className={button} onClick={() => window.print()}>列印付款通知單</button>
    </div>
  </CollapsibleSection>;
}

export default function CaseWorkspace() {
  const params = useSearchParams();
  const { data, storageError } = useDomainStore();
  const role = useCurrentRole();
  const [selected, setSelected] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("入住前");
  const [creating, setCreating] = useState(false);
  const [quotePreset, setQuotePreset] = useState<QuotePreset | null>(null);
  const [reservation, setReservation] = useState<ReservationInput>(emptyReservation);
  const [message, setMessage] = useState("");
  const [expanded, setExpanded] = useState<number[]>([]);
  const [reason, setReason] = useState("");

  /*
    從「套餐快速試算」按「帶入新預約」過來：/cases/?new=1&name=…&roomType=…
    只在第一次渲染帶入；之後使用者改了表單不要被網址蓋回去。
  */
  const [quoteApplied, setQuoteApplied] = useState(false);
  if (!quoteApplied && params.get("new") === "1") {
    setQuoteApplied(true);
    setCreating(true);
    setReservation({ ...emptyReservation(), name: params.get("name") ?? "", phone: params.get("phone") ?? "", hospital: params.get("hospital") ?? HOSPITALS[0] });
    setQuotePreset({
      roomType: (params.get("roomType") ?? "精緻") as CaseRecord["roomType"],
      days: Number(params.get("days")) || 24,
      hospital: params.get("hospital") ?? HOSPITALS[0],
      priceClass: params.get("priceClass") ?? "一般",
      corporateCompany: params.get("corporateCompany") ?? "",
    });
  }
  const [operation, setOperation] = useState<"force" | "reopen" | "override" | "change" | "charge" | "sign" | "sign-staff" | "end-childcare" | null>(null);
  const operationPanel = useRef<HTMLElement>(null);
  useEffect(() => { if (operation) operationPanel.current?.scrollIntoView({ block: "start", behavior: "instant" }); }, [operation]);
  const [amount, setAmount] = useState("");
  const [changeDays, setChangeDays] = useState("24");
  const [changeType, setChangeType] = useState<CaseRecord["roomType"]>("精緻");
  const [chargeDate, setChargeDate] = useState(data.demoAt.slice(0, 10));
  // 合約變更單（手冊第 24 頁 S-F-010）本來就有托嬰天數與期間兩欄，寫進變更原因一起留存。
  const [changeChildcareDays, setChangeChildcareDays] = useState("");
  const [changeChildcareRange, setChangeChildcareRange] = useState("");
  /*
    自費改為「分類＋品項 × 數量」計價（手冊第 36、37 頁的統合計價）。
    品項單價取自後台主檔；選了品項就自動算金額，臨時項目把品項留白、直接打名稱與金額即可。
  */
  const saleItems = data.saleItems ?? DEFAULT_SALE_ITEMS;
  const [chargeCategory, setChargeCategory] = useState<string>(SALE_CATEGORIES[0]);
  const [chargeItemName, setChargeItemName] = useState("");
  const [chargeQty, setChargeQty] = useState("1");
  const chargeItem = saleItems.find((item) => item.category === chargeCategory && item.name === chargeItemName);
  function pickSaleItem(name: string) {
    setChargeItemName(name);
    const item = saleItems.find((row) => row.category === chargeCategory && row.name === name);
    if (!item) return;
    setReason(item.name);
    setAmount(String(item.price * (Number(chargeQty) || 1)));
  }
  function changeChargeQty(value: string) {
    setChargeQty(value);
    if (chargeItem) setAmount(String(chargeItem.price * (Number(value) || 0)));
  }
  const [changeRoom, setChangeRoom] = useState("");
  const [exceptionReason, setExceptionReason] = useState("");
  const selectedId = selected ?? params.get("id");
  const record = data.cases.find((item) => item.id === selectedId);
  const permitted = canUseCaseFlow(role);
  const edit = permitted && !!record && !record.closed;
  function run(action: () => void, feedback = "已儲存並更新案件資料。") {
    try { action(); setMessage(feedback); setOperation(null); setReason(""); return true; }
    catch (error) { setMessage(error instanceof Error ? error.message : "操作失敗。"); return false; }
  }
  const patch = (change: Partial<CaseRecord>) => record && run(() => caseActions.update(record.id, change), "共通資料與後續階段已同步；已簽合約快照保留。");
  const patchReservation = (change: Partial<ReservationInput>) => setReservation((current) => ({ ...current, ...change }));
  const createReservation = (asDraft: boolean) => run(() => {
    const id = caseActions.createReservation(reservation, asDraft);
    if (quotePreset) caseActions.update(id, quotePreset);
    setReservation(emptyReservation()); setQuotePreset(null); setCreating(false); setSelected(id);
  }, asDraft ? "已暫存預約案件，可稍後繼續。" : "已建立完整預約案件。");
  // ⚠️ 分頁鈕上的筆數與清單必須用同一支判定，不要各寫一次 filter。
  const inTab = (item: typeof data.cases[number], label: string) =>
    label === "已結案" ? item.closed : !item.closed && (label === "入住前" ? item.stage <= 4 : item.stage >= 5);
  // 筆數不套搜尋條件：那是「這個分頁總共有幾件」，搜尋後數字跟著跳反而看不出全貌。
  const tabCount = (label: string) => data.cases.filter((item) => inTab(item, label)).length;
  const matches = data.cases.filter((item) => inTab(item, tab)).filter((item) => [item.name, item.phone, item.contractNo, item.room].join(" ").includes(query));

  if (!permitted) return <div className="p-8"><h1 className="text-xl font-semibold">櫃台案件流程</h1><p className="mt-4 text-sm text-stone-600">目前身分「{role}」沒有櫃台案件作業權限，可操作的角色為 {CASE_FLOW_ROLE_HINT}。</p></div>;
  return <div className="w-full space-y-5 px-4 py-4 sm:px-6">
    {/* 頁首只放「這一頁自己的動作」。
        ⚠️ 原本還並排著待辦事項／客戶資料／寶寶視訊三顆外連鈕，三者在側邊欄或
        首頁常用功能列都進得去，放在這裡只是讓櫃台在辦案件時多三個岔路。 */}
    {/*
      ⚠️ 開啟案件後不再放「回案件列表」：左側選單的「案件清單」就是回列表的入口（客戶 2026-10-22），
      同一件事兩個入口只會讓頁首多一列。套餐快速試算也已搬到選單的獨立頁（/quote）。
    */}
    <PageHeader title="案件清單" />
    {(message || storageError) && <p role="status" className="whitespace-pre-line rounded-lg border border-stone-300 bg-stone-50 p-3 text-sm">{storageError ?? message}</p>}
    {!record ? <>
      {creating && <section className="rounded-xl border border-stone-300 bg-white p-4" aria-label="新增預約"><div className="mb-4 flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-lg font-semibold">新增預約</h2><p className="mt-1 text-sm text-stone-500">登記諮詢與參觀預約；標<em className="not-italic font-semibold text-rose-600">*</em> 為必填，全部填完才能建立案件；只填姓名與電話可先暫存。</p></div><button type="button" className={button} onClick={() => { setCreating(false); setReservation(emptyReservation()); }}>取消新增</button></div><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"><Field required label="類別" value={reservation.category} options={["懷孕", "小產", "婦科術後"]} onChange={(category) => patchReservation({ category })} /><Field required label="媽媽姓名" value={reservation.name} onChange={(name) => patchReservation({ name })} /><Field required label="聯絡電話（展示資料）" value={reservation.phone} type="tel" onChange={(phone) => patchReservation({ phone })} /><Field required label="預產期" value={reservation.dueDate} type="date" onChange={(dueDate) => patchReservation({ dueDate })} /><Field required label="胎次" value={reservation.parity} options={["第 1 胎", "第 2 胎", "第 3 胎以上"]} onChange={(parity) => patchReservation({ parity })} /><Field required label="生產方式" value={reservation.deliveryMethod} options={["自然產", "剖腹產", "未定"]} onChange={(deliveryMethod) => patchReservation({ deliveryMethod })} /><Field required label="生產醫院" value={reservation.hospital} options={[...HOSPITALS]} onChange={(hospital) => patchReservation({ hospital })} /><Field required label="參觀日期" value={reservation.visitDate} type="date" onChange={(visitDate) => patchReservation({ visitDate })} /><Field required label="參觀時段" value={reservation.visitTime} options={["10:00", "11:00", "14:00", "15:00", "16:00"]} onChange={(visitTime) => patchReservation({ visitTime })} /><Field required label="訊息來源" value={reservation.source} options={["親友介紹", "網路推薦", "媽媽教室", "有入住經驗", "其他"]} onChange={(source) => patchReservation({ source })} /><Field required label="接待人員" value={reservation.receptionist} options={["林小姐", "陳小姐"]} onChange={(receptionist) => patchReservation({ receptionist })} /><label className="block space-y-2 text-sm sm:col-span-2 xl:col-span-3"><span>備註（諮詢問題、待回覆事項）</span><textarea aria-label="備註（諮詢問題、待回覆事項）" className={input} value={reservation.note} onChange={(event) => patchReservation({ note: event.target.value })} placeholder="例：詢問 VIP 房 24 天價格、是否可帶大寶同住" /></label></div><div className="mt-4 flex flex-wrap justify-end gap-2"><button type="button" className={button} onClick={() => window.print()}>列印空白預約單</button><button type="button" className={button} onClick={() => createReservation(true)}>暫存</button><button type="button" className={buttonStyles({ variant: "primary" })} onClick={() => createReservation(false)}>儲存預約</button></div></section>}
      {/* 分頁、說明與表格收成同一個可收合區塊；標題列的 action 放搜尋框。 */}
      <CollapsibleSection
        id="case-list"
        title="案件清單"
        summary={`${tab} ${matches.length} 件`}
        bodyClassName="space-y-3"
        action={
          <div className="flex flex-wrap items-center gap-2">
            <input aria-label="搜尋案件" placeholder="搜尋姓名、電話、收字號、房號" value={query} onChange={(event) => setQuery(event.target.value)} className={`${input} sm:w-72`} />
            {!creating && <button type="button" className={buttonStyles({ variant: "primary" })} onClick={() => setCreating(true)}>＋ 新增預約</button>}
          </div>
        }
      >
      <div className="flex flex-wrap gap-2">{([["入住前", "預約～入住前階段"], ["入住後", "入住中～退房階段"], ["已結案", "媽媽已退房（含寶寶續留托嬰）"]] as const).map(([label, hint]) => { const count = tabCount(label); return <button type="button" key={label} title={`${label}：${hint}，共 ${count} 件`} aria-label={`${label}，共 ${count} 件`} aria-pressed={tab === label} className={buttonStyles({ selected: tab === label, className: "relative overflow-visible" })} onClick={() => setTab(label)}>{label}<span aria-hidden="true" className={"absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold tabular-nums ring-2 ring-surface " + (tab === label ? "bg-stone-800 text-white" : "bg-stone-200 text-stone-700")}>{count}</span></button>; })}</div>
      {/* 「入住前」同時是分頁名與階段名（v24 §4.2／§4.3 皆如此用字），
          iPad 上沒有滑鼠提示，所以把涵蓋範圍直接寫出來，避免被讀成只有該階段。 */}
      <p className="text-xs text-stone-500">由預約開始，沿案件流程的七個階段追蹤。入住前＝預約～入住前階段　·　入住後＝入住中～退房階段　·　已結案＝媽媽已退房（含寶寶續留托嬰）</p>
      <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white"><table className="w-full min-w-[960px] text-left text-sm"><thead className="bg-stone-50"><tr>{["媽媽／聯絡方式", tab === "入住前" ? "預產期／房型" : "房號／房型", "目前階段", "下一步", "負責人", ""].map((label) => <th key={label} className="p-3 font-medium">{label}</th>)}</tr></thead><tbody>{matches.map((item) => <tr key={item.id} className="border-t border-stone-200"><td className="p-3">{item.name}<br /><span className="text-stone-500">{item.phone}｜{item.contractNo || "尚未下訂"}</span></td><td className="p-3">{item.room || item.dueDate || "尚未排房"}<br />{item.roomType} {item.days} 天</td><td className="p-3"><span className="inline-flex rounded-full bg-stone-100 px-2 py-1 text-xs font-medium">{item.closed ? "已結案" : CASE_STAGES[item.stage]}</span><div className="mt-2 flex gap-1" aria-label={`案件流程進度 ${item.stage + 1}／7`}>{CASE_STAGES.map((stageName, index) => <span key={stageName} title={stageName} className={`h-2.5 w-2.5 rounded-full border ${index < item.stage || item.closed ? "border-emerald-600 bg-emerald-500" : index === item.stage ? "border-brand-600 bg-brand-600" : "border-stone-300 bg-white"}`} />)}</div>{item.draftAt && <span className="mt-2 inline-flex rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-800">草稿</span>}</td><td className="p-3 text-stone-600">{caseNextAction(item)}</td><td className="p-3">{item.owner}</td><td className="p-3"><button type="button" className={button} onClick={() => { setSelected(item.id); setExpanded([]); setMessage(""); }}>開啟案件</button></td></tr>)}</tbody></table>{!matches.length && <p className="p-6 text-sm">沒有符合條件的案件。</p>}</div>
      </CollapsibleSection>
    </> : <>
      <CollapsibleSection id="case-common" title={`${record.name}・共通資料`} summary={record.closed ? "已結案" : CASE_STAGES[record.stage]} action={record.closed ? <button type="button" className={button} onClick={() => setOperation("reopen")}>重新開啟案件</button> : <button type="button" className={button} onClick={() => setOperation("force")}>強制結案</button>}><fieldset disabled={!edit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Field label="媽媽姓名" value={record.name} onChange={(name) => patch({ name })} /><Field label="聯絡電話" value={record.phone} onChange={(phone) => patch({ phone })} /><Field label="預產期" type="date" value={record.dueDate} onChange={(dueDate) => patch({ dueDate })} /><Field label="身分證字號（展示）" value={record.idNo} onChange={(idNo) => patch({ idNo })} /><Field label="醫院病歷號" value={record.hospitalChartNo ?? ""} onChange={(hospitalChartNo) => patch({ hospitalChartNo })} /></fieldset>{record.closed && <p className="mt-3 text-sm text-stone-600">案件已結案，所有階段唯讀。{record.forced ? "行政強制結案不代表實際退房。" : ""}</p>}</CollapsibleSection>
      {operation && <section ref={operationPanel} className="space-y-3 rounded-xl border border-amber-300 bg-amber-50 p-4" aria-label="案件操作確認"><h2 className="font-semibold">{({ force: "強制結案", reopen: "重新開啟", override: "覆寫報價", change: "合約變更單（主管授權）", charge: "新增費用", sign: "合約簽名", "sign-staff": "經辦人員簽名", "end-childcare": "確認寶寶已接回" })[operation]}</h2>
        {operation === "sign-staff" ? <CareSignature identity={`經辦人員｜合約 ${record.contractNo}`} onCancel={() => setOperation(null)} onConfirm={(image) => run(() => caseActions.signStaff(record.id, image), "經辦人員簽名已保存。")} /> : operation === "sign" ? <CareSignature identity={`${record.name}｜合約 ${record.contractNo}`} onCancel={() => setOperation(null)} onConfirm={(image) => run(() => caseActions.sign(record.id, image), "已簽署 v1，原合約快照已保留。")} /> : <>
          {operation !== "end-childcare" && <Field label={operation === "charge" ? "項目／原因" : "原因（必填）"} value={reason} onChange={setReason} />}
          {["override", "charge"].includes(operation) && <Field label="金額" type="number" value={amount} onChange={setAmount} />}
          {operation === "charge" && <><Field label="分類" value={chargeCategory} options={[...SALE_CATEGORIES]} onChange={(value) => { setChargeCategory(value); setChargeItemName(""); }} /><Field label="品項（留白則自訂）" value={chargeItemName} options={["", ...saleItemsOf(saleItems, chargeCategory).map((item) => item.name)]} onChange={pickSaleItem} /><Field label="數量" type="number" value={chargeQty} onChange={changeChargeQty} />{chargeItem && <p className="text-sm text-stone-600">單價 {money(chargeItem.price)} × {Number(chargeQty) || 0} ＝ {money(chargeItem.price * (Number(chargeQty) || 0))}</p>}<Field label="記帳日期" type="date" value={chargeDate} onChange={setChargeDate} />{chargeDate < data.demoAt.slice(0, 10) && <Field label="主管急診例外原因" value={exceptionReason} onChange={setExceptionReason} />}</>}
          {operation === "change" && <div className="grid gap-3 sm:grid-cols-2"><Field label="變更後天數" type="number" value={changeDays} onChange={setChangeDays} /><Field label="變更後房型" value={changeType} options={["精緻", "VIP", "VILLA"]} onChange={(value) => setChangeType(value as CaseRecord["roomType"])} /><Field label="換房至（選填）" value={changeRoom} options={["", ...data.rooms.filter((room) => room.enabled).map((room) => room.room)]} onChange={setChangeRoom} /><Field label="托嬰天數（選填）" type="number" value={changeChildcareDays} onChange={setChangeChildcareDays} /><Field label="托嬰期間（選填）" value={changeChildcareRange} onChange={setChangeChildcareRange} /><p className="text-sm">原金額 {money(casePrice(record))} → 變更後 {money(casePrice({ ...record, days: Number(changeDays) || record.days, roomType: changeType }))}<br />差額 {money(casePrice({ ...record, days: Number(changeDays) || record.days, roomType: changeType }) - casePrice(record))}<br />預估尾款 {money(caseBalance(record) + casePrice({ ...record, days: Number(changeDays) || record.days, roomType: changeType }) - casePrice(record))}</p></div>}
          <div className="flex gap-2"><button type="button" className={button} onClick={() => setOperation(null)}>取消</button><button type="button" className={button} onClick={() => run(() => {
            if (operation === "force") caseActions.forceClose(record.id, reason);
            if (operation === "reopen") caseActions.reopen(record.id, reason);
            if (operation === "override") caseActions.override(record.id, Number(amount), reason);
            if (operation === "charge") caseActions.charge(record.id, reason, Number(amount), chargeDate, exceptionReason, { category: chargeCategory, qty: Number(chargeQty) || 1, unitPrice: chargeItem?.price });
            if (operation === "change") caseActions.change(record.id, Number(changeDays), changeType, `${reason}${changeChildcareDays ? `；托嬰 ${changeChildcareDays} 天` : ""}${changeChildcareRange ? `（${changeChildcareRange}）` : ""}`, changeRoom || undefined);
            if (operation === "end-childcare") caseActions.endChildcare(record.id);
          })}>確認</button></div>
        </>}
      </section>}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="min-w-0 space-y-4">{CASE_STAGES.map((stage, index) => {
          const opened = index === record.stage || expanded.includes(index);
          return <section id={`case-stage-${index}`} key={stage} className="rounded-xl border border-stone-200 bg-white"><button type="button" className="flex min-h-16 w-full flex-wrap items-center gap-3 p-4 text-left" aria-expanded={opened} onClick={() => setExpanded((items) => items.includes(index) ? items.filter((item) => item !== index) : [...items, index])}><span className="font-semibold">{index + 1}. {stage}</span><span className="ml-auto text-xs text-stone-500">{record.closed ? "已結案・唯讀" : index < record.stage ? "已完成・唯讀" : index === record.stage ? "進行中" : "尚未開始・預覽"}</span></button>
            {opened && <div className="space-y-4 border-t border-stone-200 p-4"><fieldset disabled={index !== 3 && (!edit || index !== record.stage)} className="grid gap-4 sm:grid-cols-2">
              {index === 0 && <><Field label="類別" value={record.category} options={["懷孕", "小產", "婦科術後"]} onChange={(category) => patch({ category })} /><Field label="胎次" value={record.parity} options={["第 1 胎", "第 2 胎", "第 3 胎以上"]} onChange={(parity) => patch({ parity })} /><Field label="生產方式" value={record.deliveryMethod} options={["自然產", "剖腹產", "未定"]} onChange={(deliveryMethod) => patch({ deliveryMethod })} /><Field label="生產醫院" value={record.hospital} options={[...HOSPITALS]} onChange={(hospital) => patch({ hospital })} /><Field label="參觀日期" value={record.visitDate} type="date" onChange={(visitDate) => patch({ visitDate })} /><Field label="參觀時段" value={record.visitTime} options={["10:00", "11:00", "14:00", "15:00", "16:00"]} onChange={(visitTime) => patch({ visitTime })} /><Field label="訊息來源" value={record.source} options={["親友介紹", "網路推薦", "媽媽教室", "有入住經驗", "其他"]} onChange={(source) => patch({ source })} /><Field label="接待人員" value={record.receptionist} onChange={(receptionist) => patch({ receptionist, owner: receptionist })} /></>}
              {index === 1 && <><Field label="參觀日期" value={record.visitDate} type="date" onChange={(visitDate) => patch({ visitDate })} /><Field label="參觀時段" value={record.visitTime} onChange={(visitTime) => patch({ visitTime })} /><Field label="接待人員" value={record.receptionist} onChange={(receptionist) => patch({ receptionist, owner: receptionist })} /><Field label="參觀出席" value={record.visitStatus} options={["未出席", "已出席", "改期"]} onChange={(visitStatus) => patch({ visitStatus })} /><Field label="參觀後意向" value={record.visitIntent} options={["當場下訂", "考慮中", "不考慮"]} onChange={(visitIntent) => patch({ visitIntent })} /><Field label="合約影本攜回審閱日" value={record.reviewStart} type="date" onChange={(reviewStart) => patch({ reviewStart })} /><label className="sm:col-span-2 block space-y-2 text-sm">參觀紀錄<textarea className={input} value={record.visitNote} onChange={(event) => patch({ visitNote: event.target.value })} /></label><Field label="價格身分" value={record.priceClass} options={["一般", "特約企業", "員工價"]} onChange={(priceClass) => patch({ priceClass, ...(priceClass !== "特約企業" ? { corporateCompany: "" } : {}) })} />{record.priceClass === "特約企業" && <Field label="特約企業" value={record.corporateCompany} options={["", ...corporateCompanies]} onChange={(corporateCompany) => patch({ corporateCompany })} />}<Field label="房型" value={record.roomType} options={["精緻", "VIP", "VILLA"]} onChange={(roomType) => patch({ roomType: roomType as CaseRecord["roomType"] })} /><div className="space-y-2 text-sm"><Field label="入住天數" value={record.days} type="number" onChange={(days) => patch({ days: Number(days) })} /><div className="flex flex-wrap gap-2">{COMMON_STAY_DAYS.map((days) => <button type="button" key={days} aria-pressed={record.days === days} className={buttonStyles({ size: "sm", selected: record.days === days })} onClick={() => patch({ days })}>{days} 天</button>)}</div></div><label className="flex min-h-12 items-center gap-2 text-sm"><input type="checkbox" checked={record.tasting} onChange={(event) => patch({ tasting: event.target.checked })} />試吃已收 350 元，尾款折抵一次</label><div className="rounded-lg bg-stone-50 p-3 text-sm">{(() => { const detail = casePriceBreakdown(record); return <><p>房型日價 {money(detail.baseDaily)} ＋ 院所日加價 {money(detail.hospitalDaily)}</p><p className="mt-1">付費 {detail.paidDays} 天／贈送 {detail.giftedDays} 天｜價格係數 {detail.multiplier === 1 ? "一般價" : `${detail.multiplier * 100}%`}</p><p className="mt-2 font-semibold">試算 {money(detail.total)}</p></>; })()}<p className="mt-1">贈品：{gifts(record.days).join("、") || "無"}{record.overrideAmount !== null && <><br />覆寫：{money(record.overrideAmount)}（選項變更仍保留，請確認）</>}</p></div><button type="button" className={button} onClick={() => setOperation("override")}>覆寫金額（需原因）</button></>}
              {index === 2 && <><Field label="下訂日期" value={record.orderDate} type="date" onChange={(orderDate) => patch({ orderDate })} /><Field label="收字第○號（合約編號）" value={record.contractNo} onChange={(contractNo) => patch({ contractNo })} /><Field label="訂金" value={record.deposit} type="number" onChange={(deposit) => patch({ deposit: Number(deposit) })} /><Field label="付款方式" value={record.paymentMethod} options={["現金", "轉帳", "刷卡", "其他"]} onChange={(paymentMethod) => patch({ paymentMethod })} /><label className="sm:col-span-2 block space-y-2 text-sm">下訂備註<textarea className={input} value={record.orderNote} onChange={(event) => patch({ orderNote: event.target.value })} /></label><p className="text-sm">{record.roomType} {record.days} 天｜報價 {money(record.overrideAmount ?? record.quotedAmount)}</p></>}
              {index === 3 && <ContractSteps readOnly={!edit || index !== record.stage} key={record.id} record={record} onChange={patch} onSign={() => setOperation("sign")} onSignStaff={() => setOperation("sign-staff")} onStampMilk={() => run(() => caseActions.stampMilkConsent(record.id), "已帶入護理人員印章。")} />}
              {index === 4 && <><div className="sm:col-span-2 space-y-2"><h3 className="font-medium">入住前時間軸</h3>{([['prenatalContactDone','預產期前 1 個月｜產前關懷電話'],['hospitalizationNoticeDone','住院當日｜住院與生產方式通知'],['dischargeNoticeDone','出院前 1 天｜確認實際入住日'],['preAdmissionPapersDone','入住前 1 天｜餐飲單、嬰兒室通知單、保全資訊'],['admissionGuidanceDone','入住當天｜入住指導單（紙本）'],['admissionPaymentNoticeDone','入住當天｜繳款通知單（紙本）']] as const).map(([key,label]) => <label key={key} className="flex min-h-12 items-center gap-3 rounded-lg border border-stone-200 px-3 text-sm"><input type="checkbox" checked={record[key]} onChange={(event) => run(() => caseActions.timeline(record.id, key, event.target.checked), `${label}狀態已更新。`)} /><span>{label}</span><span className="ml-auto text-xs text-stone-500">{record[key] ? "已完成" : "待辦"}</span></label>)}</div><Field label="實際入住日" type="date" value={record.actualAdmission} onChange={(actualAdmission) => patch({ actualAdmission })} /><Field label="入住房號" value={record.room} onChange={(room) => patch({ room })} /><div className="sm:col-span-2 flex flex-wrap gap-2"><button type="button" className={button} onClick={() => window.print()}>列印入住指導單（紙本）</button></div><div className="sm:col-span-2"><CaseDocs key={`docs-${record.id}`} record={record} editable={edit} /></div><p className="sm:col-span-2 text-sm">完成階段後產生合約 v2，建立視訊待指派登記；護理端再指派寶寶、車號與監視器。</p></>}
              {index === 5 && <><p className="sm:col-span-2 text-sm">每日房費以套餐計入，額外自費以下方明細加列。已簽合約原文保留，條件變動請開變更單。</p><button type="button" className={button} onClick={() => setOperation("charge")}>新增自費／費用調整</button><button type="button" className={button} onClick={() => { setChangeDays(String(record.days)); setChangeType(record.roomType); setChangeRoom(""); setOperation("change"); }}>合約變更單</button><AdmissionMeal key={record.id} record={record} editable={edit} /><div className="sm:col-span-2"><RoomServicePanel room={record.room} /></div></>}
              {index === 6 && <><p className="sm:col-span-2 text-sm">應收餘額 {money(caseBalance(record))}（含訂金、試吃折抵、返家應收及付款紀錄）。</p><label className="flex min-h-12 items-center gap-2 text-sm"><input type="checkbox" checked={record.settlementDone} onChange={(event) => patch({ settlementDone: event.target.checked })} />已完成尾款結算</label><div className="sm:col-span-2 space-y-4"><ReturnGuide key={`guide-${record.id}`} record={record} editable={edit} /><ReturnInspection key={`inspect-${record.id}`} record={record} editable={edit} /><RefundCalculator key={`refund-${record.id}`} record={record} editable={edit} /></div><label className="sm:col-span-2 flex min-h-12 items-center gap-2 text-sm"><input type="checkbox" checked={record.childcare} onChange={(event) => patch({ childcare: event.target.checked })} />寶寶需要續留托嬰（選填）</label>{record.childcare && <><Field label="托嬰車號" value={record.childcareCar} onChange={(childcareCar) => patch({ childcareCar })} /><Field label="托嬰天數" type="number" value={record.childcareDays} onChange={(value) => patch({ childcareDays: Number(value) })} /><Field label="每日托嬰費" type="number" value={record.childcareFee} onChange={(value) => patch({ childcareFee: Number(value) })} /><Field label="接送人／聯絡方式" value={record.childcareContact} onChange={(childcareContact) => patch({ childcareContact })} /></>}</>}
              <label className="sm:col-span-2 block space-y-2 text-sm">階段備註<textarea disabled={!edit || index !== record.stage} className={input} value={record.note} onChange={(event) => patch({ note: event.target.value })} /></label>
            </fieldset>
              {index === record.stage && !record.closed && <div className="flex flex-wrap gap-2"><button type="button" className={button} onClick={() => run(() => caseActions.save(record.id), "整張案件單已暫存。")}>暫存整張單</button><button type="button" className={buttonStyles({ variant: "primary" })} onClick={() => run(() => caseActions.advance(record.id), "階段已完成，相關入住及授權資料已同步。")}>{stage}完成 → {CASE_STAGES[index + 1] ?? "結案"}</button></div>}
            </div>}
          </section>;
        })}
        {record.actualAdmission && <DailyLedger key={record.id} record={record} editable={edit} />}
        {record.stage >= 5 && <PaymentRecords key={`payments-${record.id}`} record={record} editable={edit} />}
        {record.stage === 6 && <ReturnPhotos key={record.id} record={record} editable={edit} />}
        {record.childcare && !record.childcareEnded && record.dischargedAt && <section className="space-y-3 rounded-xl border border-violet-300 bg-violet-50 p-4"><h2 className="font-semibold">托嬰進行中・車 {record.childcareCar}</h2><p className="text-sm">媽媽已退房，寶寶照護與觀看授權依托嬰狀態獨立維持。</p><Link href={`/contract/?tab=childcare&case=${encodeURIComponent(record.id)}`} className={button}>修改托嬰車號／期限</Link><button type="button" className={button} onClick={() => setOperation("end-childcare")}>確認已接回，結束托嬰</button></section>}
        </div>
        <aside className="space-y-4"><CollapsibleSection id="case-stage-nav" title="案件階段" summary={`第 ${record.stage + 1}／7 階段`}><nav className="grid gap-2">{CASE_STAGES.map((stage, index) => <a key={stage} href={`#case-stage-${index}`} onClick={() => setExpanded((items) => [...new Set([...items, index])])} className="min-h-12 rounded-lg border border-stone-200 p-3 text-sm">{index + 1}. {stage}{index < record.stage ? " ✓" : ""}</a>)}</nav></CollapsibleSection><CollapsibleSection id="case-ledger" title="帳務摘要" summary={`應收 ${money(caseBalance(record))}`}><p className="text-sm leading-7">原合約 {money(record.overrideAmount ?? record.quotedAmount)}<br />訂金 {money(record.deposit)}<br />試吃折抵 {money(record.tasting ? 350 : 0)}<br />應收餘額 {money(caseBalance(record))}</p>{ledgerByCategory(record).length > 0 && <div className="mt-3 rounded-lg bg-stone-50 p-3 text-xs"><p className="font-medium">自費分類小計</p>{ledgerByCategory(record).map((group) => <p key={group.category} className="mt-1 flex justify-between gap-3"><span>{group.category}</span><span className="tabular-nums">{money(group.amount)}</span></p>)}</div>}{record.ledger.map((entry) => <p key={entry.id} className="mt-3 break-words text-xs">{entry.date} {entry.label}{entry.qty && entry.qty > 1 ? ` ×${entry.qty}` : ""}：{money(entry.amount)}</p>)}</CollapsibleSection><CollapsibleSection id="case-log" title="案件歷程" summary={`${record.log.length} 筆`}><ol className="space-y-4">{record.log.map((entry) => <li key={entry.id} className="text-sm"><p>{entry.text}</p><p className="mt-1 text-xs text-stone-500">{taipeiTimestamp(entry.at)}<br />{entry.actor}</p></li>)}</ol></CollapsibleSection></aside>
      </div>
    </>}
    <p className="text-xs text-stone-500">純靜態展示；價格與正式欄位待院方確認，資料僅保留於本機瀏覽器。</p>
  </div>;
}
