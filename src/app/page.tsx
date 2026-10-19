"use client";

import Link from "next/link";
import { BedDouble, Users, GraduationCap, Megaphone } from "lucide-react";
import RequireAccess from "@/components/ui/RequireAccess";
import TabsFromUrl from "@/components/ui/TabsFromUrl";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import StatCard from "@/components/ui/StatCard";
import DashboardWorkspace from "@/components/dashboard/DashboardWorkspace";
import DemoActionButton from "@/components/ui/DemoActionButton";
import {
  ANNOUNCEMENTS,
  COURSES,
} from "@/lib/mock/dashboard";
import { useDomainStore } from "@/lib/demo/domainStore";
import { useCareStore } from "@/lib/care/store";
import { useCurrentRole } from "@/lib/roleStore";
import { roleTaskCategories, taskEvents } from "@/lib/domain/tasks";

const CATEGORY_COLOR: Record<string, "rose" | "green" | "blue" | "amber" | "purple" | "slate"> = {
  入住: "green", 退房: "amber", 參觀: "blue", "合約／猶豫期": "green", 待收款: "rose",
  醫師巡診: "purple", 課程: "slate", "關懷／提醒": "rose", 回補期限: "amber", 托嬰: "purple",
};
function AnnouncementTab() {
  return (
    <div className="space-y-2">
      {ANNOUNCEMENTS.map((a) => (
        <Link key={a.id} href="/admin?tab=board" className="block">
          <Card>
            <div className="flex items-center justify-between">
              <span className="font-medium">{a.title}</span>
              <span className="text-xs text-stone-400">
                {a.date}｜{a.author}
              </span>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
}

function MamaCalendarTab() {
  const { data: domain } = useDomainStore();
  const { data: care } = useCareStore(); const role = useCurrentRole();
  const events = taskEvents(domain, care).filter((event) => !event.handled && roleTaskCategories(role).includes(event.category));
  const days = [...new Set(events.map((event) => event.date))].sort().map((date) => ({ date, items: events.filter((event) => event.date === date) }));
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 text-xs text-stone-500">
        {Object.entries(CATEGORY_COLOR).map(([cat, color]) => (
          <Badge key={cat} color={color}>
            {cat}
          </Badge>
        ))}
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {days.map((day) => (
          <Card key={day.date} title={day.date}>
            <ul className="space-y-1.5 text-sm">
              {day.items.map((it, i) => (
                <li key={i}>
                  <Link
                    href={it.href}
                    className="flex items-center gap-2 rounded px-1 py-0.5 -mx-1 transition-colors hover:bg-stone-50"
                  >
                    <Badge color={CATEGORY_COLOR[it.category]}>{it.category}</Badge>
                    <span className="text-stone-600">{it.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
      <div className="flex justify-end">
        <DemoActionButton feedback="媽媽行事曆列印預覽已開啟" action="print" className="rounded bg-stone-100 px-3 py-1.5 text-xs">列印媽媽行事曆</DemoActionButton>
      </div>
    </div>
  );
}

function InternalCalendarTab() {
  return (
    <Card
      title="內部行事曆"
      action={
        <div className="flex gap-2">
          <DemoActionButton feedback="已開啟批次新增處理項目（Demo 模式）" className="rounded bg-stone-100 px-3 py-1 text-xs">
            批次新增處理項目
          </DemoActionButton>
          <DemoActionButton feedback="已建立一筆新的行事曆項目草稿" className="rounded bg-rose-500 px-3 py-1 text-xs text-white">
            ＋ 新增項目
          </DemoActionButton>
        </div>
      }
    >
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-stone-400">
        {Array.from({ length: 28 }).map((_, i) => (
          <div key={i} className="rounded border border-stone-100 py-3">
            {i + 1}
          </div>
        ))}
      </div>
    </Card>
  );
}

function CourseTab() {
  return (
    <div className="space-y-2">
      {COURSES.map((c) => (
        <Link key={c.id} href="/course?tab=registration" className="block">
          <Card>
            <div className="flex items-center justify-between text-sm">
              <div>
                <span className="font-medium">{c.name}</span>
                <span className="ml-2 text-stone-400">{c.time}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge color={c.fee ? "amber" : "green"}>
                  {c.fee ? "收費" : "免費"}
                </Badge>
                <span className="text-xs text-stone-500">
                  已報名 {c.enrolled}/{c.cap}
                </span>
              </div>
            </div>
          </Card>
        </Link>
      ))}
      <p className="text-xs text-stone-400">課程通知、已讀與報名回覆成效可至「14. LINE官方帳號管理」查看。</p>
    </div>
  );
}

function ValueAddedTab() {
  return (
    <Card
      title="加值服務"
      action={
        <select className="rounded border border-stone-200 px-2 py-1 text-xs">
          <option>表類別：全部</option>
        </select>
      }
    >
      <p className="text-sm text-stone-400">當月無資料（依規格文件3.4節，錄影當時亦無資料可顯示）。</p>
    </Card>
  );
}

export default function HomePage() {
  const { data: domain } = useDomainStore();
  const occupied = domain.subjects.filter((subject) => subject.kind === "mama" && !subject.historical).length;

  return (
    <div className="page-frame">
      <RequireAccess moduleNo="1">
        <DashboardWorkspace
          classicContent={
            <>
              <div className="tablet-stat-grid mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatCard icon={BedDouble} label="入住中媽媽" value={occupied} gradient="from-brand-500 to-brand-400" href="/mama" />
                <StatCard icon={Users} label="客戶總數" value={domain.cases.length} gradient="from-sky-500 to-sky-400" href="/customer" />
                <StatCard icon={GraduationCap} label="本週開課數" value={COURSES.length} gradient="from-amber-500 to-amber-400" href="/course" />
                <StatCard icon={Megaphone} label="公告則數" value={ANNOUNCEMENTS.length} gradient="from-emerald-500 to-emerald-400" href="/admin?tab=board" />
              </div>
              <TabsFromUrl
                tabs={[
                  { key: "board", label: "公佈欄", content: <AnnouncementTab /> },
                  { key: "mama-cal", label: "媽媽行事曆", content: <MamaCalendarTab /> },
                  { key: "internal-cal", label: "內部行事曆", content: <InternalCalendarTab /> },
                  { key: "course", label: "課程管理", content: <CourseTab /> },
                  { key: "value-added", label: "加值服務", content: <ValueAddedTab /> },
                ]}
              />
            </>
          }
        />
      </RequireAccess>
    </div>
  );
}
