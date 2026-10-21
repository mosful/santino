"use client";

import Link from "next/link";
import { BellRing } from "lucide-react";
import { useCareStore } from "@/lib/care/store";
import { useDomainStore } from "@/lib/demo/domainStore";
import { roleTaskCategories, taskEvents } from "@/lib/domain/tasks";
import { ANNOUNCEMENTS } from "@/lib/mock/dashboard";
import { useCurrentRole } from "@/lib/roleStore";
import RoomStatusOverview from "./RoomStatusOverview";
import { canUseCaseFlow } from "@/lib/permissions";
import CollapsibleSection from "@/components/ui/CollapsibleSection";

/** 由首頁漏斗傳進來的跨階段數字；點擊會切換漏斗的快速檢視。 */
export type QuickStat = {
  key: string;
  label: string;
  value: number;
  tone: "rose" | "amber" | "brand" | "blue";
  active: boolean;
  /** 未提供時只顯示數字（沒有案件作業權限的角色沒有可切換的漏斗）。 */
  onClick?: () => void;
};

export default function OperationsOverview({
  quickView = null,
  onQuickView,
}: {
  /** 目前選取的快速檢視（只有有案件漏斗的角色會傳）。 */
  quickView?: string | null;
  onQuickView?: (key: "overdue" | "today" | "staying" | "moving") => void;
}) {
  const { data: domain } = useDomainStore();
  const { data: care } = useCareStore();
  const role = useCurrentRole();
  const today = domain.demoAt.slice(0, 10);
  const pending = taskEvents(domain, care).filter(
    (event) => !event.handled && roleTaskCategories(role).includes(event.category)
  );
  const urgent = pending.filter((event) => event.date <= today).slice(0, 5);
  /*
    四個數字一律由 pending（＝下方到期清單的同一份來源）算出。

    ⚠️ 以前是從首頁漏斗的 mothers 陣列算的，而那份只涵蓋「案件衍生」的待辦；
    衛教師的回補期限掛在 subject 而不是 case，於是清單列著兩筆、數字卻顯示 0。
    數字與它正下方的清單必須同源，否則就是在說謊。
  */
  const inHouse = domain.cases.filter((record) => !record.closed && record.stage === 5).length;
  const movingSoon = domain.cases.filter((record) => !record.closed && (record.stage === 4 || record.stage === 6)).length;
  const quickStats: QuickStat[] = [
    { key: "overdue", label: "逾期待辦", value: pending.filter((event) => event.date < today).length, tone: "rose" },
    { key: "today", label: "今日追蹤", value: pending.filter((event) => event.date === today).length, tone: "amber" },
    { key: "staying", label: "入住中", value: inHouse, tone: "brand" },
    { key: "moving", label: "近日入退房", value: movingSoon, tone: "blue" },
  ].map((stat) => ({
    ...stat,
    tone: stat.tone as QuickStat["tone"],
    active: quickView === stat.key,
    onClick: onQuickView ? () => onQuickView(stat.key as "overdue" | "today" | "staying" | "moving") : undefined,
  }));
  const drafts = domain.cases.filter((record) => record.draftAt && !record.closed);
  const announcements = [...ANNOUNCEMENTS]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 3);
  const caseFlow = canUseCaseFlow(role);

  return (
    <div className="space-y-4">
      {/*
        ⚠️ 這裡原本有一排「櫃台常用功能」膠囊（案件流程／客戶資料／媽媽關懷／寶寶視訊）。
        2026-10-21 客戶要求把導覽統一收到左側主選單，這四項已成為「櫃台服務」的
        第二層選單（見 lib/modules.ts 模組 1 的 subItems）。不要在頁面裡再放一份。
      */}
    <div id="today-workspace" className="grid scroll-mt-20 gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.75fr)]">
      <CollapsibleSection
        id="today-workspace"
        title="今日工作台"
        summary={urgent.length ? `${urgent.length} 件到期事項` : "今天沒有到期事項"}
        icon={<BellRing className="h-[18px] w-[18px] shrink-0 text-rose-500" aria-hidden="true" />}
      >

        {/* 跨階段數字由漏斗傳入，點擊即切換下方漏斗的快速檢視。
            ⚠️ 不要在漏斗那邊再畫一次：同一組數字出現兩遍正是客戶回報的「重複資訊」。 */}
        <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {quickStats.map(({ key, ...stat }) => <QuickStatButton key={key} {...stat} />)}
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          {urgent.map((event) => (
            <Link key={event.id} href={event.href} className="group flex min-w-0 items-center gap-3 rounded-2xl border border-rose-100 bg-rose-50/60 p-3 hover:border-rose-200 hover:bg-rose-50">
              <span className="rounded-lg bg-white px-2 py-1 text-xs font-bold text-rose-600 shadow-sm">{event.date.slice(5)}</span>
              <span className="min-w-0 flex-1">
                <span className="block text-[11px] font-semibold text-rose-600">{event.category}</span>
                <span className="block truncate text-sm font-medium text-stone-700 group-hover:text-rose-700">{event.title}</span>
              </span>
            </Link>
          ))}
          {!urgent.length && <p className="col-span-full rounded-2xl border border-dashed border-stone-200 p-6 text-center text-sm text-stone-500">今天沒有逾期或到期待辦。</p>}
        </div>

        {/* 只留數字，不再連去 /cases/：上方常用功能列已經有「案件流程」，
            同一頁出現三個通往同一個地方的連結正是客戶說的「入口太多」。 */}
        {caseFlow && (
          <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-stone-500">
            <span>案件進行中 <strong className="text-stone-700">{domain.cases.filter((record) => !record.closed).length}</strong> 件</span>
            <span>未完成草稿 <strong className="text-amber-700">{drafts.length}</strong> 件待續作</span>
          </p>
        )}
      </CollapsibleSection>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
        {/* 公告是純資訊，不要連到後台「公佈欄設定」：那是維護畫面，而且依客戶
            2026-10-21 的要求已下架；讓每一則公告都變成後台連結只是製造死路。 */}
        <CollapsibleSection
          id="announcements"
          title="最新公告"
          summary={`${announcements.length} 則`}
        >
          <div className="divide-y divide-stone-100">
            {announcements.map((announcement) => (
              <div key={announcement.id} className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-2 py-2 text-xs">
                <span className="text-stone-400">{announcement.date.slice(5)}</span>
                <span className="truncate font-medium text-stone-700">{announcement.title}</span>
              </div>
            ))}
          </div>
        </CollapsibleSection>
      </div>
    </div>

    {/* v24 §3 的首頁順序：需立即處理事項 → 房況總覽 → 公佈欄 */}
    <RoomStatusOverview />
    </div>
  );
}


const STAT_TONE = {
  rose: "border-rose-200 bg-rose-50 text-rose-700",
  amber: "border-amber-200 bg-amber-50 text-amber-700",
  brand: "border-brand-200 bg-brand-50 text-brand-700",
  blue: "border-sky-200 bg-sky-50 text-sky-700",
} as const;

function QuickStatButton({ label, value, tone, active, onClick }: Omit<QuickStat, "key">) {
  const className =
    "flex flex-col items-start gap-0.5 rounded-xl border px-3 py-2 text-left " + STAT_TONE[tone];
  const body = (
    <>
      <span className="text-[11px] font-semibold">{label}</span>
      <span className="text-xl font-bold leading-none tabular-nums">{value}</span>
    </>
  );
  if (!onClick) return <div className={className}>{body}</div>;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`${className} transition-[box-shadow,border-color] hover:shadow-sm${active ? " ring-2 ring-current ring-offset-1" : ""}`}
    >
      {body}
    </button>
  );
}
