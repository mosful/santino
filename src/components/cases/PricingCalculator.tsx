"use client";

import { useState } from "react";
import Choice from "@/components/ui/ChoiceField";
import { useDomainStore } from "@/lib/demo/domainStore";
import { SummaryRow as DetailRow } from "@/components/ui/Workspace";
import { buttonStyles } from "@/components/ui/buttonStyles";
import { casePriceBreakdown, gifts } from "@/lib/domain/rules";
import { CORPORATE_COMPANIES, COMMON_STAY_DAYS, HOSPITALS, hospitalOptions } from "@/lib/domain/options";
import { DEMO_MOTHER_NAME, DEMO_PHONE } from "@/lib/demo/demoDefaults";
import { quoteActions, useSavedQuotes } from "@/lib/quoteStore";
import type { CaseRecord } from "@/lib/domain/types";

/**
 * 套餐速算（櫃台服務第一個子項，/quote）。
 *
 * 版面是「左邊選條件、右邊出金額」：諮詢時客戶問的永遠是「那這樣多少錢」，
 * 金額要一直在視線裡，不能埋在表單最後一行。
 *
 * ⚠️ 選項一律用 `buttonStyles({ selected })` 的膠囊，不要自己寫 bg／text 類別，
 * 也不要改回下拉——下拉在諮詢現場要點兩次才看得到有哪些方案。
 * ⚠️ 加購品項的字串要與 `rules.ts` 的 `casePrice` 完全一致，那支是比字串算錢的。
 */

const input = "min-h-12 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm";
const money = (value: number) => `NT$ ${value.toLocaleString("zh-TW")}`;
const corporateCompanies = [...CORPORATE_COMPANIES];

export type QuotePreset = Pick<CaseRecord, "roomType" | "days" | "hospital" | "priceClass" | "corporateCompany"> & {
  addOns: string[];
  tasting: boolean;
  bossGift: string;
};

/** 升等與加購：字串與 rules.ts 的計價判斷共用，改字要兩邊一起改。 */
const ADD_ONS = [
  { key: "升等房間", label: "升 VIP／VILLA 房", hint: "+1,000／天" },
  { key: "餐點一併升等", label: "餐點一併升等", hint: "+300／天" },
  { key: "紅蟳火鍋", label: "升級紅蟳火鍋", hint: "+1,200" },
  { key: "蒙娜麗莎之吻（當天下訂且需訂位）", label: "蒙娜麗莎之吻", hint: "當天下訂・需訂位" },
];

const star = <em className="ml-0.5 not-italic font-semibold text-rose-600" aria-hidden="true">*</em>;

export default function PricingCalculator({ onUse }: { onUse: (name: string, phone: string, preset: QuotePreset) => void }) {
  const [name, setName] = useState(DEMO_MOTHER_NAME);
  const [phone, setPhone] = useState(DEMO_PHONE);
  const [roomType, setRoomType] = useState<CaseRecord["roomType"]>("精緻");
  const [days, setDays] = useState(30);
  const [hospital, setHospital] = useState<string>(HOSPITALS[0]);
  const [priceClass, setPriceClass] = useState("一般");
  const [corporateCompany, setCorporateCompany] = useState("");
  const [addOns, setAddOns] = useState<string[]>([]);
  const [tasting, setTasting] = useState(false);
  const [bossGift, setBossGift] = useState("");
  const [message, setMessage] = useState("");
  const { data } = useDomainStore();
  const saved = useSavedQuotes();

  const quote = { roomType, days, hospital, priceClass, addOns };
  const detail = casePriceBreakdown(quote);
  const autoGifts = gifts(days);
  const dailyRate = detail.baseDaily + detail.hospitalDaily;
  const payable = detail.total - (tasting ? 350 : 0);

  function toggleAddOn(key: string) {
    setAddOns((current) => (current.includes(key) ? current.filter((item) => item !== key) : [...current, key]));
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-stone-600">選房型與天數，價格與贈品自動帶出；正式金額仍以院方核定為準，覆寫報價請於案件流程操作（需填原因）。</p>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(280px,1fr)]">
        {/* 左欄：條件 */}
        <section className="space-y-5 rounded-2xl border border-border-subtle bg-surface-raised p-4 shadow-xs sm:p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-2 text-sm">
              <span className="font-medium text-stone-700">試算對象姓名（選填）</span>
              <input aria-label="試算對象姓名" className={input} value={name} onChange={(event) => setName(event.target.value)} placeholder="尚未指定，可直接輸入" />
            </label>
            <label className="block space-y-2 text-sm">
              <span className="font-medium text-stone-700">聯絡電話（選填）</span>
              <input aria-label="試算對象聯絡電話" className={input} value={phone} onChange={(event) => setPhone(event.target.value)} />
            </label>
          </div>

          <Choice label="房型" required value={roomType} options={["精緻", "VIP", "VILLA"]} onChange={(value) => setRoomType(value as CaseRecord["roomType"])} />

          <div className="space-y-2 text-sm">
            <span className="block font-medium text-stone-700">天數{star}</span>
            <div className="flex flex-wrap items-center gap-2">
              <input aria-label="試算天數" type="number" min={1} max={365} className={`${input} !w-24`} value={days} onChange={(event) => setDays(Math.max(1, Number(event.target.value) || 1))} />
              {COMMON_STAY_DAYS.map((value) => (
                <button key={value} type="button" aria-pressed={days === value} className={buttonStyles({ size: "sm", selected: days === value })} onClick={() => setDays(value)}>
                  {value}
                </button>
              ))}
            </div>
          </div>

          <Choice label="生產院所" required value={hospital} options={hospitalOptions(data.hospitals)} onChange={setHospital} hint="院內最優惠，院外每日加價" />

          <div className="space-y-2">
            <Choice label="價格類別" value={priceClass} options={["一般", "特約企業", "員工價"]} onChange={(value) => { setPriceClass(value); if (value !== "特約企業") setCorporateCompany(""); }} hint="特約 95 折、員工 9 折" />
            {priceClass === "特約企業" && (
              <Choice label="特約企業" value={corporateCompany} options={corporateCompanies} onChange={setCorporateCompany} />
            )}
          </div>

          <div className="space-y-2 text-sm">
            <span className="block font-medium text-stone-700">自動搭配贈品<span className="ml-2 text-xs font-normal text-stone-500">依天數自動帶入，不需勾選</span></span>
            <div className="flex flex-wrap gap-2">
              {autoGifts.map((gift) => (
                <span key={gift} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 text-sm text-emerald-800">✓ {gift} 1 堂</span>
              ))}
              {detail.giftedDays > 0 && <span className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 text-sm text-emerald-800">✓ 贈 {detail.giftedDays} 天</span>}
              {!autoGifts.length && detail.giftedDays === 0 && <span className="text-sm text-stone-500">未達 21 天門檻，無自動贈品。</span>}
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <span className="block font-medium text-stone-700">個別選購<span className="ml-2 text-xs font-normal text-stone-500">不自動帶入，需逐項勾選</span></span>
            <div className="flex flex-wrap gap-2">
              {ADD_ONS.map((item) => (
                <button key={item.key} type="button" aria-pressed={addOns.includes(item.key)} className={buttonStyles({ size: "sm", selected: addOns.includes(item.key) })} onClick={() => toggleAddOn(item.key)}>
                  {item.label}
                  <span className="text-xs opacity-70">{item.hint}</span>
                </button>
              ))}
              <button type="button" aria-pressed={tasting} className={buttonStyles({ size: "sm", selected: tasting })} onClick={() => setTasting((value) => !value)}>
                試吃已收 350・折抵尾款
              </button>
            </div>
          </div>

          <label className="block space-y-2 text-sm">
            <span className="font-medium text-stone-700">老闆加送（自訂名稱）</span>
            <input aria-label="老闆加送品項" className={input} value={bossGift} onChange={(event) => setBossGift(event.target.value)} placeholder="例：客房備品組" />
          </label>

          <p className="text-xs leading-5 text-stone-500">
            價格與規則依手冊價目表：日租＝房型 × 生產院所；住 21 天贈 1 天、28 天贈 2 天；特約 95 折、員工 9 折。
            正式定價待院方確認後改由後台「套餐與贈品規則」維護。
          </p>
        </section>

        {/* 右欄：金額 */}
        <aside className="space-y-3">
          <div className="rounded-2xl border border-border-subtle bg-surface-raised p-4 shadow-xs sm:p-5">
            <p className="text-xs text-stone-500">預估總額</p>
            <p className="mt-1 text-3xl font-bold tracking-tight text-stone-900">{money(payable)}</p>
            <p className="mt-1 text-xs text-stone-500">{roomType}・{days} 天（付費 {detail.paidDays} 天）</p>

            <div className="mt-4">
              <DetailRow label={`日租 ${money(dailyRate)} × ${detail.paidDays} 天`} value={money(dailyRate * detail.paidDays)} />
              {detail.giftedDays > 0 && <DetailRow muted label={`贈送 ${detail.giftedDays} 天`} value="－" />}
              {detail.upgradeDaily > 0 && <DetailRow label={`房間升等 × ${detail.paidDays} 天`} value={money(detail.upgradeDaily * detail.paidDays)} />}
              {detail.mealUpgradeDaily > 0 && <DetailRow label={`餐點升等 × ${detail.paidDays} 天`} value={money(detail.mealUpgradeDaily * detail.paidDays)} />}
              {detail.oneTime > 0 && <DetailRow label="升級紅蟳火鍋" value={money(detail.oneTime)} />}
              {detail.multiplier !== 1 && <DetailRow label={`${priceClass}（${detail.multiplier * 100}%）`} value={`×${detail.multiplier}`} />}
              {autoGifts.map((gift) => <DetailRow key={gift} muted label={`${gift} 1 堂`} value="贈" />)}
              {addOns.includes("蒙娜麗莎之吻（當天下訂且需訂位）") && <DetailRow muted label="蒙娜麗莎之吻" value="贈・需訂位" />}
              {bossGift.trim() && <DetailRow muted label={`老闆加送：${bossGift.trim()}`} value="贈" />}
              {tasting && <DetailRow label="試吃費折抵" value={`－${money(350)}`} />}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={buttonStyles()}
              onClick={() => {
                quoteActions.save({ name, phone, roomType, days, hospital, priceClass, corporateCompany, total: payable });
                setMessage("已暫存這筆試算，可在下方取回。");
              }}
            >
              暫存試算
            </button>
            <button type="button" className={buttonStyles({ variant: "primary" })} onClick={() => onUse(name, phone, { roomType, days, hospital, priceClass, corporateCompany, addOns, tasting, bossGift: bossGift.trim() })}>
              帶入新預約
            </button>
            <button type="button" className={buttonStyles()} onClick={() => window.print()}>列印試算單</button>
          </div>
          {message && <p role="status" className="text-sm text-stone-600">{message}</p>}
        </aside>
      </div>

      {saved.length > 0 && (
        <section className="space-y-2" data-no-print>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-semibold">已暫存的試算（{saved.length}）</h3>
            <button type="button" className={buttonStyles({ size: "sm" })} onClick={() => { quoteActions.clear(); setMessage("已清空暫存試算。"); }}>全部清除</button>
          </div>
          <p className="text-xs text-stone-500">同一位媽媽常要比兩三個方案；暫存只存在這台瀏覽器，最多保留 10 筆。</p>
          <div className="overflow-x-auto rounded-xl border border-stone-200">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-stone-50 text-xs text-stone-500">
                <tr>
                  <th className="px-3 py-2.5 font-medium">暫存時間</th>
                  <th className="px-3 py-2.5 font-medium">媽媽／電話</th>
                  <th className="px-3 py-2.5 font-medium">方案</th>
                  <th className="px-3 py-2.5 text-right font-medium">試算金額</th>
                  <th className="px-3 py-2.5 font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {saved.map((item) => (
                  <tr key={item.id} className="border-t border-stone-100">
                    <td className="whitespace-nowrap px-3 py-2.5 text-xs text-stone-500">{new Date(item.at).toLocaleString("zh-TW", { timeZone: "Asia/Taipei", hour12: false })}</td>
                    <td className="px-3 py-2.5">{item.name || "未填"}<div className="text-xs text-stone-500">{item.phone || "未填"}</div></td>
                    <td className="px-3 py-2.5 text-xs text-stone-600">{item.roomType} {item.days} 天<div>{item.hospital}｜{item.priceClass}{item.corporateCompany ? `（${item.corporateCompany}）` : ""}</div></td>
                    <td className="px-3 py-2.5 text-right font-semibold tabular-nums">{money(item.total)}</td>
                    <td className="whitespace-nowrap px-3 py-2.5">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          className={buttonStyles({ size: "sm" })}
                          onClick={() => {
                            setName(item.name); setPhone(item.phone); setRoomType(item.roomType as CaseRecord["roomType"]);
                            setDays(item.days); setHospital(item.hospital); setPriceClass(item.priceClass); setCorporateCompany(item.corporateCompany);
                            setMessage("已取回這筆試算。");
                          }}
                        >
                          取回
                        </button>
                        <button type="button" className={buttonStyles({ size: "sm" })} onClick={() => { quoteActions.remove(item.id); setMessage("已刪除這筆暫存。"); }}>刪除</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
