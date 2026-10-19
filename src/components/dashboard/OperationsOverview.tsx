"use client";

import Link from "next/link";
import { Baby, BedDouble, BellRing, Building2, CalendarClock, ClipboardList, FileEdit, FileText, LayoutDashboard, PhoneCall, Search, UserRoundSearch, Video } from "lucide-react";
import { useCareStore } from "@/lib/care/store";
import { useDomainStore } from "@/lib/demo/domainStore";
import { roleTaskCategories, taskEvents } from "@/lib/domain/tasks";
import { ANNOUNCEMENTS } from "@/lib/mock/dashboard";
import { useCurrentRole } from "@/lib/roleStore";
import { getAccess } from "@/lib/permissions";

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
  const activeMothers = domain.subjects.filter(
    (subject) => subject.kind === "mama" && !subject.historical
  );
  const enabledRooms = domain.rooms.filter((room) => room.enabled);
  const occupiedRooms = new Set(activeMothers.map((subject) => subject.room));
  const floors = [...new Set(enabledRooms.map((room) => room.room.slice(0, 1)))].sort();
  const childcare = domain.cases.filter(
    (record) => record.childcare && !record.childcareEnded
  );
  const announcements = [...ANNOUNCEMENTS]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 3);
  const babycamAccess = getAccess(role, "17");
  const babycamSummary = role === "櫃台"
    ? "入住交付、標籤與日常操作"
    : role === "阿長 婉真"
      ? "查看狀態與報表"
      : role === "系統管理員"
        ? "主檔、設備與權限設定"
        : "依角色開啟可用功能";
  const serviceLinks = [
    { href: "/#today-workspace", icon: LayoutDashboard, label: "今日工作台", value: "到期事項與營運摘要", visible: true },
    { href: "/cases/", icon: ClipboardList, label: "案件七階段", value: "從預約到返家後", visible: true },
    { href: "/customer/", icon: UserRoundSearch, label: "客戶資料", value: "查詢客戶與聯繫紀錄", visible: getAccess(role, "5") !== "none" },
    { href: "/room/", icon: BedDouble, label: "房況與排房", value: "查看住房與安排房位", visible: getAccess(role, "4") !== "none" },
    { href: "/contract/", icon: FileText, label: "合約與付款", value: "簽約、變更與收款", visible: getAccess(role, "12") !== "none" },
    { href: "/care/", icon: PhoneCall, label: "媽媽關懷", value: "跨階段關懷與追蹤", visible: getAccess(role, "7") !== "none" },
    { href: "/cases/calendar/", icon: CalendarClock, label: "待辦行事曆", value: "月、週、日工作排程", visible: true },
    { href: "/babycam/workspace/", icon: Video, label: "寶寶視訊管理", value: babycamSummary, visible: babycamAccess !== "none" },
  ].filter((item) => item.visible);

  return (
    <div className="space-y-4">
      <section aria-labelledby="counter-services-title" className="rounded-3xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-4">
          <div className="text-xs font-semibold text-brand-600">櫃台服務</div>
          <h2 id="counter-services-title" className="mt-1 text-lg font-bold text-stone-800">常用功能</h2>
          <p className="mt-1 text-sm text-stone-500">房況、客戶、合約、關懷、案件與寶寶視訊統一由這裡進入。</p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {serviceLinks.map((item) => <ServiceLink key={item.label} {...item} />)}
        </div>
      </section>

    <section id="today-workspace" className="grid scroll-mt-20 gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.75fr)]">
      <div className="rounded-3xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-rose-600">
              <BellRing className="h-4 w-4" /> 今日工作台
            </div>
            <h2 className="mt-1 text-lg font-bold text-stone-800">先處理到期事項，再接續案件流程</h2>
          </div>
          <Link href="/cases/calendar/" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-stone-200 px-3 text-sm font-semibold text-stone-600 hover:border-brand-200 hover:bg-brand-50">
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
          {!urgent.length && <p className="col-span-full rounded-2xl border border-dashed border-stone-200 p-6 text-center text-sm text-stone-400">今天沒有逾期或到期待辦。</p>}
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <OverviewLink href="/cases/" icon={Search} label="案件搜尋" value={`${domain.cases.filter((record) => !record.closed).length} 件進行中`} />
          <OverviewLink href="/cases/" icon={FileEdit} label="未完成草稿" value={`${drafts.length} 件待續作`} tone="amber" />
          <OverviewLink href="/contract/" icon={CalendarClock} label="合約與付款" value="回到案件七階段" tone="green" />
          {babycamAccess !== "none" && <OverviewLink href="/babycam/workspace/" icon={Video} label="寶寶視訊管理" value={babycamSummary} tone="violet" />}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
        <div className="rounded-3xl border border-stone-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-stone-800"><Building2 className="h-4 w-4 text-brand-500" />住房概況</div>
            <Link href="/room/" className="text-xs font-semibold text-brand-600">查看房況</Link>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <RoomStat label="已入住" value={occupiedRooms.size} />
            <RoomStat label="可使用" value={Math.max(0, enabledRooms.length - occupiedRooms.size)} />
            <RoomStat label="托嬰" value={childcare.length} accent />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {floors.map((floor) => {
              const rooms = enabledRooms.filter((room) => room.room.startsWith(floor));
              const used = rooms.filter((room) => occupiedRooms.has(room.room)).length;
              return <span key={floor} className="rounded-lg bg-stone-100 px-2.5 py-1 text-xs text-stone-600">{floor}F　{used}/{rooms.length}</span>;
            })}
            <Link href="/baby/" className="inline-flex items-center gap-1 rounded-lg bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700"><Baby className="h-3.5 w-3.5" />寶寶照護</Link>
          </div>
        </div>

        <div className="rounded-3xl border border-stone-200 bg-white p-4 shadow-sm">
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
    </div>
  );
}

function ServiceLink({ href, icon: Icon, label, value }: { href: string; icon: typeof Search; label: string; value: string }) {
  return <Link href={href} className="group flex min-h-24 flex-col justify-between rounded-2xl border border-stone-100 bg-stone-50/60 p-3 transition hover:border-brand-200 hover:bg-brand-50"><Icon className="h-5 w-5 text-brand-500" /><span><span className="block text-sm font-bold text-stone-700 group-hover:text-brand-700">{label}</span><span className="mt-1 block text-[11px] leading-4 text-stone-400">{value}</span></span></Link>;
}

function OverviewLink({ href, icon: Icon, label, value, tone = "brand" }: { href: string; icon: typeof Search; label: string; value: string; tone?: "brand" | "amber" | "green" | "violet" }) {
  const styles = { brand: "bg-brand-50 text-brand-600", amber: "bg-amber-50 text-amber-700", green: "bg-emerald-50 text-emerald-700", violet: "bg-violet-50 text-violet-700" };
  return <Link href={href} className="flex min-w-0 items-center gap-2 rounded-2xl border border-stone-100 p-3 hover:border-brand-200"><span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${styles[tone]}`}><Icon className="h-4 w-4" /></span><span className="min-w-0"><span className="block text-xs font-bold text-stone-700">{label}</span><span className="block truncate text-[11px] text-stone-400">{value}</span></span></Link>;
}

function RoomStat({ label, value, accent = false }: { label: string; value: number; accent?: boolean }) {
  return <div className={`rounded-2xl px-2 py-3 ${accent ? "bg-violet-50" : "bg-stone-50"}`}><div className={`text-xl font-bold ${accent ? "text-violet-700" : "text-stone-800"}`}>{value}</div><div className="mt-1 text-[11px] text-stone-500">{label}</div></div>;
}
