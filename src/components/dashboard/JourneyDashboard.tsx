"use client";

import Link from "next/link";
import { useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  CalendarClock,
  ChevronRight,
  CircleCheckBig,
  Search,
  Sparkles,
  UserRound,
} from "lucide-react";
import Badge from "@/components/ui/Badge";
import { JOURNEY_MOTHERS, JOURNEY_STAGES, type JourneyStageKey } from "@/lib/mock/customerJourney";

const STAGE_STYLE = {
  sky: "bg-sky-50 text-sky-700 ring-sky-200",
  violet: "bg-violet-50 text-violet-700 ring-violet-200",
  amber: "bg-amber-50 text-amber-700 ring-amber-200",
  emerald: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  orange: "bg-orange-50 text-orange-700 ring-orange-200",
  rose: "bg-rose-50 text-rose-700 ring-rose-200",
  slate: "bg-slate-100 text-slate-700 ring-slate-200",
  teal: "bg-teal-50 text-teal-700 ring-teal-200",
} as const;

const URGENCY = {
  overdue: { label: "需立即處理", badge: "rose" as const, border: "border-l-rose-500" },
  today: { label: "今日待辦", badge: "amber" as const, border: "border-l-amber-400" },
  upcoming: { label: "近期追蹤", badge: "blue" as const, border: "border-l-sky-400" },
  normal: { label: "進行中", badge: "slate" as const, border: "border-l-stone-300" },
};

export default function JourneyDashboard() {
  const [selectedStage, setSelectedStage] = useState<JourneyStageKey>("staying");
  const [query, setQuery] = useState("");
  const selected = JOURNEY_STAGES.find((stage) => stage.key === selectedStage) ?? JOURNEY_STAGES[0];
  const keyword = query.trim().toLowerCase();
  const stageMothers = JOURNEY_MOTHERS.filter((mother) => {
    if (mother.stage !== selectedStage) return false;
    if (!keyword) return true;
    return [mother.name, mother.status, mother.room, mother.owner, mother.nextAction, ...mother.tags]
      .filter(Boolean)
      .some((value) => value?.toLowerCase().includes(keyword));
  }).sort((a, b) => {
    const priority = { overdue: 0, today: 1, upcoming: 2, normal: 3 };
    return priority[a.urgency] - priority[b.urgency];
  });

  const overdue = JOURNEY_MOTHERS.filter((mother) => mother.urgency === "overdue").length;
  const today = JOURNEY_MOTHERS.filter((mother) => mother.urgency === "today").length;
  const inHouse = JOURNEY_MOTHERS.filter((mother) => mother.stage === "staying").length;
  const movingSoon = JOURNEY_MOTHERS.filter((mother) => mother.stage === "preAdmission" || mother.stage === "discharge").length;

  return (
    <div className="space-y-4 animate-fade-in-up">
      <section className="overflow-hidden rounded-3xl border border-brand-900/10 bg-white/90 shadow-sm">
        <div className="flex flex-col gap-4 border-b border-stone-100 bg-gradient-to-r from-brand-50 via-white to-amber-50/70 px-4 py-4 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2 text-xs font-semibold text-brand-600">
              <Sparkles className="h-4 w-4" />
              以媽媽目前狀態安排櫃台工作
            </div>
            <h2 className="text-lg font-bold text-stone-800">從第一次詢問，到母嬰安心返家</h2>
            <p className="mt-1 text-sm text-stone-500">點選階段即可查看媽媽、下一步待辦與相關系統功能。</p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:min-w-[480px]">
            <Summary label="逾期待辦" value={overdue} tone="rose" icon={AlertCircle} />
            <Summary label="今日追蹤" value={today} tone="amber" icon={CalendarClock} />
            <Summary label="入住中" value={inHouse} tone="brand" icon={UserRound} />
            <Summary label="近日入退宿" value={movingSoon} tone="blue" icon={CircleCheckBig} />
          </div>
        </div>

        <div className="scroll-fade overflow-x-auto px-3 py-4 sm:px-5">
          <div className="flex min-w-max items-start">
            {JOURNEY_STAGES.map((stage, index) => {
              const Icon = stage.icon;
              const count = JOURNEY_MOTHERS.filter((mother) => mother.stage === stage.key).length;
              const active = stage.key === selectedStage;
              return (
                <div key={stage.key} className="flex items-start">
                  <button
                    type="button"
                    onClick={() => setSelectedStage(stage.key)}
                    aria-pressed={active}
                    className={
                      "group flex w-[108px] flex-col items-center rounded-2xl px-2 py-2 text-center transition-all " +
                      (active ? "bg-stone-50 shadow-sm ring-1 ring-stone-200" : "hover:bg-stone-50")
                    }
                  >
                    <span className={`relative flex h-11 w-11 items-center justify-center rounded-2xl ring-1 ${STAGE_STYLE[stage.color]} ${active ? "scale-105 shadow-sm" : ""}`}>
                      <Icon className="h-5 w-5" />
                      <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-stone-800 px-1 text-[10px] font-bold text-white ring-2 ring-white">
                        {count}
                      </span>
                    </span>
                    <span className={`mt-2 text-xs font-semibold ${active ? "text-stone-800" : "text-stone-500"}`}>{stage.shortLabel}</span>
                  </button>
                  {index < JOURNEY_STAGES.length - 1 && <ChevronRight className="mt-5 h-4 w-4 shrink-0 text-stone-300" />}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(300px,0.7fr)]">
        <div className="rounded-3xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className={`flex h-9 w-9 items-center justify-center rounded-xl ring-1 ${STAGE_STYLE[selected.color]}`}>
                  <selected.icon className="h-[18px] w-[18px]" />
                </span>
                <div>
                  <h2 className="font-bold text-stone-800">{selected.label}</h2>
                  <p className="text-xs text-stone-500">{selected.description}</p>
                </div>
              </div>
            </div>
            <label className="relative block sm:w-56">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="搜尋姓名、房號、待辦"
                className="w-full rounded-xl border border-stone-200 bg-stone-50 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-brand-300 focus:bg-white"
              />
            </label>
          </div>

          <div className="space-y-2.5">
            {stageMothers.map((mother) => {
              const urgency = URGENCY[mother.urgency];
              return (
                <article key={mother.id} className={`group rounded-2xl border border-stone-200 border-l-4 ${urgency.border} bg-white p-3 transition hover:border-r-brand-200 hover:border-y-brand-200 hover:shadow-md sm:p-4`}>
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-sm font-bold text-brand-600">
                        {mother.name.slice(0, 1)}
                      </span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-bold text-stone-800">{mother.name}</h3>
                          <Badge color={urgency.badge}>{urgency.label}</Badge>
                          <span className="text-xs font-medium text-stone-500">{mother.status}</span>
                        </div>
                        <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-stone-500">
                          {mother.room && <span>房位：<strong className="text-stone-700">{mother.room}</strong></span>}
                          {mother.stayDay && <span>{mother.stayDay}</span>}
                          {mother.dueDate && <span>預產期：{mother.dueDate}</span>}
                          <span>負責：{mother.owner}</span>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {mother.tags.map((tag) => <span key={tag} className="rounded-md bg-stone-100 px-2 py-0.5 text-[11px] text-stone-500">{tag}</span>)}
                        </div>
                      </div>
                    </div>
                    <div className="rounded-xl bg-amber-50/70 px-3 py-2 lg:w-[230px]">
                      <div className="text-[11px] font-medium text-amber-700">下一步・{mother.actionDate}</div>
                      <div className="mt-0.5 text-sm font-semibold text-stone-700">{mother.nextAction}</div>
                    </div>
                    <Link href="/customer" className="flex shrink-0 items-center justify-center gap-1 rounded-xl border border-stone-200 px-3 py-2 text-xs font-semibold text-stone-600 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-600">
                      開啟歷程 <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </article>
              );
            })}
            {stageMothers.length === 0 && (
              <div className="rounded-2xl border border-dashed border-stone-200 py-10 text-center text-sm text-stone-400">找不到符合條件的媽媽</div>
            )}
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-3xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <div className="text-xs font-medium text-stone-400">階段工作台</div>
                <h2 className="font-bold text-stone-800">{selected.label}相關功能</h2>
              </div>
              <span className={`flex h-9 w-9 items-center justify-center rounded-xl ring-1 ${STAGE_STYLE[selected.color]}`}>
                <selected.icon className="h-[18px] w-[18px]" />
              </span>
            </div>
            <div className="space-y-2">
              {selected.links.map((link) => (
                <Link key={link.label} href={link.href} className="group flex items-center gap-3 rounded-2xl border border-stone-100 bg-stone-50/70 p-3 transition hover:border-brand-200 hover:bg-brand-50">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-brand-500 shadow-sm">
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-stone-700 group-hover:text-brand-600">{link.label}</span>
                    <span className="block truncate text-[11px] text-stone-400">{link.hint}</span>
                  </span>
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-4 shadow-sm sm:p-5">
            <div className="mb-2 flex items-center gap-2 text-sm font-bold text-amber-800">
              <CircleCheckBig className="h-4 w-4" />
              階段完成條件
            </div>
            <p className="text-xs leading-5 text-stone-600">完成必要資料與待辦後，媽媽狀態才移至下一階段；保留人工調整，並記錄異動時間與人員。</p>
          </div>
        </aside>
      </section>
    </div>
  );
}

function Summary({
  label,
  value,
  tone,
  icon: Icon,
}: {
  label: string;
  value: number;
  tone: "rose" | "amber" | "brand" | "blue";
  icon: typeof AlertCircle;
}) {
  const styles = {
    rose: "bg-rose-50 text-rose-700",
    amber: "bg-amber-50 text-amber-700",
    brand: "bg-brand-50 text-brand-600",
    blue: "bg-sky-50 text-sky-700",
  };
  return (
    <div className={`flex items-center gap-2 rounded-2xl px-3 py-2 ${styles[tone]}`}>
      <Icon className="h-4 w-4 shrink-0 opacity-70" />
      <div>
        <div className="text-lg font-bold leading-none">{value}</div>
        <div className="mt-1 whitespace-nowrap text-[10px] font-medium opacity-80">{label}</div>
      </div>
    </div>
  );
}
