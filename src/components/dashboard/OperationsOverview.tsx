"use client";

import Link from "next/link";
import { BedDouble, BellRing, CalendarClock, ClipboardList, FileEdit, FileText, LayoutDashboard, PhoneCall, Search, UserRoundSearch, Video } from "lucide-react";
import { useCareStore } from "@/lib/care/store";
import { useDomainStore } from "@/lib/demo/domainStore";
import { roleTaskCategories, taskEvents } from "@/lib/domain/tasks";
import { ANNOUNCEMENTS } from "@/lib/mock/dashboard";
import { useCurrentRole } from "@/lib/roleStore";
import RoomStatusOverview from "./RoomStatusOverview";
import { getAccess } from "@/lib/permissions";
import { buttonStyles } from "@/components/ui/buttonStyles";

export default function OperationsOverview() {
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
    { href: "/#today-workspace", icon: LayoutDashboard, label: "今日工作台", value: "到期事項與營運摘要", visible: true },
    { href: "/cases/", icon: ClipboardList, label: "案件七階段", value: "從預約到返家後", visible: true },
    { href: "/customer/", icon: UserRoundSearch, label: "客戶資料", value: "查詢客戶與聯繫紀錄", visible: getAccess(role, "5") !== "none" },
    { href: "/#room-status-title", icon: BedDouble, label: "房況總覽", value: "依樓層查看房況與托嬰", visible: true },
    { href: "/contract/", icon: FileText, label: "合約與付款", value: "簽約、變更與收款", visible: getAccess(role, "12") !== "none" },
    { href: "/care/", icon: PhoneCall, label: "媽媽關懷", value: "跨階段關懷與追蹤", visible: getAccess(role, "7") !== "none" },
    { href: "/todo/", icon: CalendarClock, label: "待辦行事曆", value: "月、週、日工作排程", visible: true },
    { href: "/babycam/", icon: Video, label: "寶寶視訊管理", value: babycamSummary, visible: babycamAccess !== "none" },
  ].filter((item) => item.visible);

  return (
    <div className="space-y-4">
      <section aria-labelledby="counter-services-title" className="space-y-3">
        <div>
          <h2 id="counter-services-title" className="text-lg font-bold text-stone-800">櫃台常用功能</h2>
          <p className="mt-1 text-sm text-stone-500">房況、客戶、合約、關懷、案件與寶寶視訊統一由這裡進入。</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {serviceLinks.map((item) => <ServiceLink key={item.label} {...item} />)}
        </div>
      </section>

    <section id="today-workspace" className="grid scroll-mt-20 gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.75fr)]">
      <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="flex items-center gap-2 text-lg font-bold text-stone-800">
            <BellRing className="h-[18px] w-[18px] shrink-0 text-rose-500" aria-hidden="true" />
            今日工作台：先處理到期事項
          </h2>
          <Link href="/todo/" className={buttonStyles({ className: "rounded-xl" })}>
            <CalendarClock className="h-4 w-4" /> 開啟行事曆
          </Link>
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

        <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <OverviewLink href="/cases/" icon={Search} label="案件搜尋" value={`${domain.cases.filter((record) => !record.closed).length} 件進行中`} />
          <OverviewLink href="/cases/" icon={FileEdit} label="未完成草稿" value={`${drafts.length} 件待續作`} tone="amber" />
          <OverviewLink href="/contract/" icon={CalendarClock} label="合約與付款" value="回到案件七階段" tone="green" />
          {babycamAccess !== "none" && <OverviewLink href="/babycam/" icon={Video} label="寶寶視訊管理" value={babycamSummary} tone="violet" />}
        </div>
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

function ServiceLink({ href, icon: Icon, label, value }: { href: string; icon: typeof Search; label: string; value: string }) {
  return (
    <Link
      href={href}
      className="group flex min-h-24 flex-col justify-between rounded-2xl border border-border-subtle bg-surface-raised p-3.5 shadow-xs transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md"
    >
      <Icon className="h-5 w-5 text-brand-500" aria-hidden="true" />
      <span>
        <span className="block text-sm font-bold text-stone-700 group-hover:text-brand-700">{label}</span>
        <span className="mt-1 block text-[11px] leading-4 text-stone-500">{value}</span>
      </span>
    </Link>
  );
}

function OverviewLink({ href, icon: Icon, label, value, tone = "brand" }: { href: string; icon: typeof Search; label: string; value: string; tone?: "brand" | "amber" | "green" | "violet" }) {
  const styles = { brand: "bg-brand-50 text-brand-600", amber: "bg-amber-50 text-amber-700", green: "bg-emerald-50 text-emerald-700", violet: "bg-violet-50 text-violet-700" };
  return <Link href={href} className="flex min-w-0 items-center gap-2 rounded-2xl border border-stone-100 p-3 hover:border-brand-200"><span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${styles[tone]}`}><Icon className="h-4 w-4" /></span><span className="min-w-0"><span className="block text-xs font-bold text-stone-700">{label}</span><span className="block truncate text-[11px] text-stone-500">{value}</span></span></Link>;
}

