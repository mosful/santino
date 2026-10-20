"use client";

import Link from "next/link";
import { BedDouble, BellRing, CalendarClock, ClipboardList, FileText, PhoneCall, UserRoundSearch, Video, type LucideIcon } from "lucide-react";
import { useCareStore } from "@/lib/care/store";
import { useDomainStore } from "@/lib/demo/domainStore";
import { roleTaskCategories, taskEvents } from "@/lib/domain/tasks";
import { ANNOUNCEMENTS } from "@/lib/mock/dashboard";
import { useCurrentRole } from "@/lib/roleStore";
import RoomStatusOverview from "./RoomStatusOverview";
import { getAccess } from "@/lib/permissions";
import { buttonStyles } from "@/components/ui/buttonStyles";

/** 由首頁漏斗傳進來的跨階段數字；點擊會切換漏斗的快速檢視。 */
export type QuickStat = { key: string; label: string; value: number; tone: "rose" | "amber" | "brand" | "blue"; active: boolean; onClick: () => void };

export default function OperationsOverview({ quickStats = [] }: { quickStats?: QuickStat[] }) {
  const { data: domain } = useDomainStore();
  const { data: care } = useCareStore();
  const role = useCurrentRole();
  const today = domain.demoAt.slice(0, 10);
  const pending = taskEvents(domain, care).filter(
    (event) => !event.handled && roleTaskCategories(role).includes(event.category)
  );
  const urgent = pending.filter((event) => event.date <= today).slice(0, 5);
  const drafts = domain.cases.filter((record) => record.draftAt && !record.closed);
  const announcements = [...ANNOUNCEMENTS]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 3);
  const babycamAccess = getAccess(role, "17");
  const babycamSummary = role === "櫃台"
    ? "入住交付、標籤與日常操作"
    : role === "護理長 婉真"
      ? "查看狀態與報表"
      : role === "管理者"
        ? "主檔、設備與權限設定"
        : "依角色開啟可用功能";
  const serviceLinks = [
    // ⚠️ 不要再把「今日工作台」放進來：它就在下面同一頁，點了只是捲動 200px。
    { href: "/cases/", icon: ClipboardList, label: "案件流程", value: "從預約到退房結案", visible: true },
    { href: "/customer/", icon: UserRoundSearch, label: "客戶資料", value: "查詢客戶與聯繫紀錄", visible: getAccess(role, "5") !== "none" },
    { href: "/#room-status-title", icon: BedDouble, label: "房況總覽", value: "依樓層查看房況與托嬰", visible: true },
    { href: "/contract/", icon: FileText, label: "合約與付款", value: "簽約、變更與收款", visible: getAccess(role, "12") !== "none" },
    { href: "/care/", icon: PhoneCall, label: "媽媽關懷", value: "跨階段關懷與追蹤", visible: getAccess(role, "7") !== "none" },
    { href: "/todo/", icon: CalendarClock, label: "待辦事項", value: "月、週、日工作排程", visible: true },
    { href: "/babycam/", icon: Video, label: "寶寶視訊管理", value: babycamSummary, visible: babycamAccess !== "none" },
  ].filter((item) => item.visible);

  return (
    <div className="space-y-4">
      {/* 常用功能壓成一排膠囊：原本是 8 張 96px 高的大卡，佔掉整個第一屏卻只是連結。 */}
      <section aria-labelledby="counter-services-title" className="flex flex-wrap items-center gap-2">
        <h2 id="counter-services-title" className="mr-1 text-xs font-bold text-stone-500">櫃台常用功能</h2>
        {serviceLinks.map((item) => <ServiceLink key={item.label} {...item} />)}
      </section>

    <section id="today-workspace" className="grid scroll-mt-20 gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.75fr)]">
      <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="flex items-center gap-2 text-lg font-bold text-stone-800">
            <BellRing className="h-[18px] w-[18px] shrink-0 text-rose-500" aria-hidden="true" />
            今日工作台：先處理到期事項
          </h2>
          <Link href="/todo/" className={buttonStyles({ size: "sm", className: "rounded-xl" })}>
            <CalendarClock className="h-4 w-4" /> 開啟待辦事項
          </Link>
        </div>

        {/* 跨階段數字由漏斗傳入，點擊即切換下方漏斗的快速檢視。
            ⚠️ 不要在漏斗那邊再畫一次：同一組數字出現兩遍正是客戶回報的「重複資訊」。 */}
        {quickStats.length > 0 && (
          <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {quickStats.map(({ key, ...stat }) => <QuickStatButton key={key} {...stat} />)}
          </div>
        )}

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

        {/* 合約與付款、寶寶視訊管理已在上方常用功能列，這裡不重複；只留這一頁獨有的案件計數。 */}
        <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-stone-500">
          <Link href="/cases/" className="hover:text-brand-600">案件進行中 <strong className="text-stone-700">{domain.cases.filter((record) => !record.closed).length}</strong> 件</Link>
          <Link href="/cases/" className="hover:text-brand-600">未完成草稿 <strong className="text-amber-700">{drafts.length}</strong> 件待續作</Link>
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
        <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <div className="font-bold text-stone-800">最新公告</div>
            <Link href="/admin/?tab=board" className="text-xs font-semibold text-brand-600">公告管理</Link>
          </div>
          <div className="divide-y divide-stone-100">
            {announcements.map((announcement) => (
              <Link key={announcement.id} href="/admin/?tab=board" className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-2 py-2 text-xs hover:text-brand-600">
                <span className="text-stone-400">{announcement.date.slice(5)}</span>
                <span className="truncate font-medium text-stone-700">{announcement.title}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>

    {/* v24 §3 的首頁順序：需立即處理事項 → 房況總覽 → 公佈欄 */}
    <RoomStatusOverview />
    </div>
  );
}

function ServiceLink({ href, icon: Icon, label }: { href: string; icon: LucideIcon; label: string; value: string }) {
  return (
    <Link
      href={href}
      className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border-subtle bg-surface-raised px-3 text-xs font-semibold text-stone-600 shadow-2xs transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
    >
      <Icon className="h-3.5 w-3.5 shrink-0 text-brand-500" aria-hidden="true" />
      {label}
    </Link>
  );
}

const STAT_TONE = {
  rose: "border-rose-200 bg-rose-50 text-rose-700",
  amber: "border-amber-200 bg-amber-50 text-amber-700",
  brand: "border-brand-200 bg-brand-50 text-brand-700",
  blue: "border-sky-200 bg-sky-50 text-sky-700",
} as const;

function QuickStatButton({ label, value, tone, active, onClick }: Omit<QuickStat, "key">) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={
        "flex flex-col items-start gap-0.5 rounded-xl border px-3 py-2 text-left transition-[box-shadow,border-color] hover:shadow-sm " +
        STAT_TONE[tone] +
        (active ? " ring-2 ring-current ring-offset-1" : "")
      }
    >
      <span className="text-[11px] font-semibold">{label}</span>
      <span className="text-xl font-bold leading-none tabular-nums">{value}</span>
    </button>
  );
}
