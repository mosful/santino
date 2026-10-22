"use client";

import Link from "next/link";
import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  AlertCircle,
  ArrowRight,
  CalendarClock,
  Check,
  ChevronRight,
  CircleCheckBig,
  Search,
  Sparkles,
  UserRound,
} from "lucide-react";
import Badge from "@/components/ui/Badge";
import {
  JOURNEY_STAGES,
  type JourneyMother,
  type JourneyStageKey,
} from "@/lib/mock/customerJourney";
import { useJourneyMothers } from "@/lib/domain/legacySelectors";
import { useDomainStore } from "@/lib/demo/domainStore";
import { canUseCaseFlow } from "@/lib/permissions";
import { useCurrentRole } from "@/lib/roleStore";
import OperationsOverview from "./OperationsOverview";
import CollapsibleSection from "@/components/ui/CollapsibleSection";

/**
 * 首頁右下「○○・階段完成條件」區塊先隱藏（客戶 2026-10-22）。
 * 清單內容仍在各階段定義裡，要開回把旗標改成 true。
 */
const SHOW_STAGE_CHECKLIST = false;

type QuickView = "overdue" | "today" | "staying" | "moving";

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

const QUICK_VIEW_INFO: Record<QuickView, { label: string; description: string; icon: LucideIcon }> = {
  overdue: { label: "全部逾期待辦", description: "跨階段彙整需要立即處理的案件", icon: AlertCircle },
  today: { label: "全部今日追蹤", description: "跨階段彙整今天應完成的聯繫與工作", icon: CalendarClock },
  staying: { label: "目前入住中", description: "查看館內媽媽的照護與合約狀態", icon: UserRound },
  moving: { label: "近日入退房", description: "集中處理入住準備、到期與退房交接", icon: CircleCheckBig },
};

/**
 * 首頁的案件漏斗。
 *
 * ⚠️ 這裡**不做案件操作**，只負責「看見與找到」，找到之後一律跳 `/cases/detail`。
 * 原本點案件會開一個 Modal，裡面有本階段確認項目、追蹤紀錄、完成本次待辦、
 * 移至下一階段——那是案件流程的第二套實作，和 `/cases` 的真正流程功能重疊、
 * 規則卻不一致（例如 Modal 可以直接推進階段，案件頁則會要求必填資料）。
 * 客戶回報「入口太多、同一件事有好幾個地方做」，2026-10-21 整個移除。
 * 要改案件操作請改 `components/cases/CaseWorkspace.tsx`，不要在首頁再做一份。
 *
 * ⚠️ 右側也拿掉了「○○階段相關功能」連結清單：八個階段各列 3～4 個外連，
 * 等於首頁藏了 26 個通往其他模組的入口，而那些模組在側邊欄或常用功能列都有。
 */
export default function JourneyDashboard() {
  const role = useCurrentRole();
  const caseFlow = canUseCaseFlow(role);
  const mothers = useJourneyMothers();
  const { data: domain } = useDomainStore();
  const [selectedStage, setSelectedStage] = useState<JourneyStageKey>("入住中");
  const [quickView, setQuickView] = useState<QuickView | null>(null);
  const [query, setQuery] = useState("");

  const selected = JOURNEY_STAGES.find((stage) => stage.key === selectedStage) ?? JOURNEY_STAGES[0];
  const quickInfo = quickView ? QUICK_VIEW_INFO[quickView] : null;
  const ContextIcon = quickInfo?.icon ?? selected.icon;
  const keyword = query.trim().toLowerCase();

  /** 漏斗用的是舊系統 legacyId，案件頁用的是案件 id，這裡做一次轉換。 */
  const caseHref = (legacyId: number) => {
    const id = domain.cases.find((item) => item.legacyId === legacyId)?.id ?? "";
    return `/cases/detail/?id=${encodeURIComponent(id)}`;
  };

  const stageMothers = mothers.filter((mother) => {
    const inScope = quickView ? matchesQuickView(mother, quickView) : mother.stage === selectedStage;
    if (!inScope) return false;
    if (!keyword) return true;
    return [mother.name, mother.status, mother.room, mother.owner, mother.nextAction, ...mother.tags]
      .filter(Boolean)
      .some((value) => value?.toLowerCase().includes(keyword));
  }).sort((a, b) => {
    const priority = { overdue: 0, today: 1, upcoming: 2, normal: 3 };
    return priority[a.urgency] - priority[b.urgency];
  });
  const visibleStageMothers = keyword ? stageMothers : stageMothers.slice(0, 8);

  function selectStage(stage: JourneyStageKey) {
    setSelectedStage(stage);
    setQuickView(null);
    setQuery("");
  }

  function selectQuickView(view: QuickView) {
    setQuickView(view);
    setQuery("");
  }

  /*
    沒有櫃台案件作業權限的角色（衛教師、護理師）只看今日工作台與房況總覽。

    ⚠️ 以前不分角色一律渲染整條案件漏斗與案件清單，護理人員打開首頁看到的是
    一整頁自己不能操作的櫃檯資料；點下去才被擋頁。要改可操作角色請改
    permissions.canUseCaseFlow，不要在這裡另寫一組判斷。
  */
  if (!caseFlow) {
    return (
      <div className="space-y-4 animate-fade-in-up">
        <OperationsOverview />
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in-up">
      <OperationsOverview quickView={quickView} onQuickView={selectQuickView} />
      {/* ⚠️ 這裡以前還有一整條「從第一次詢問，到母嬰安心返家」標題帶＋四個數字，
          但那四個數字與上方今日工作台完全相同——客戶回報的「重複資訊」就是它。
          數字已移進今日工作台，這裡只留漏斗本身。 */}
      <CollapsibleSection
        id="case-funnel"
        title="案件流程"
        summary="點階段可聚焦該階段的案件"
        icon={<Sparkles className="h-4 w-4 shrink-0 text-brand-500" aria-hidden="true" />}
        bodyClassName="!px-0"
      >
        <div className="scroll-fade overflow-x-auto px-3 pb-1 sm:px-5">
          <div className="flex min-w-max items-start sm:min-w-0 sm:justify-center">
            {JOURNEY_STAGES.map((stage, index) => {
              const Icon = stage.icon;
              const count = mothers.filter((mother) => mother.stage === stage.key).length;
              const active = !quickView && stage.key === selectedStage;
              return (
                <div key={stage.key} className="flex items-start">
                  <button
                    type="button"
                    onClick={() => selectStage(stage.key)}
                    aria-pressed={active}
                    className={
                      "group flex w-[108px] flex-col items-center rounded-2xl px-2 py-2 text-center transition-[transform,background-color,box-shadow] " +
                      (active ? "bg-stone-50 shadow-sm ring-1 ring-stone-200" : "hover:bg-stone-50")
                    }
                  >
                    <span className={`relative flex h-11 w-11 items-center justify-center rounded-2xl ring-1 ${STAGE_STYLE[stage.color]} ${active ? "scale-105 shadow-sm" : ""}`}>
                      <Icon className="h-5 w-5" />
                      <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-stone-800 px-1 text-[10px] font-bold text-white ring-2 ring-white">{count}</span>
                    </span>
                    <span className={`mt-2 text-xs font-semibold ${active ? "text-stone-800" : "text-stone-500"}`}>{stage.label}</span>
                  </button>
                  {index < JOURNEY_STAGES.length - 1 && <ChevronRight className="mt-5 h-4 w-4 shrink-0 text-stone-300" />}
                </div>
              );
            })}
          </div>
        </div>
      </CollapsibleSection>

      {/* 右側的「階段完成條件」隱藏後就不再分欄，案件流程滿版（客戶 2026-10-22）。 */}
      <section className={SHOW_STAGE_CHECKLIST ? "grid gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(300px,0.7fr)]" : "grid gap-4"}>
        {/* 篩選結果整塊也可收合：護理站只想看房況時，這一長串案件清單可以先收起來。
            id 固定不隨階段變，否則每切一個階段就是一個新的收合偏好。 */}
        <CollapsibleSection
          id="stage-cases"
          title={quickInfo?.label ?? selected.label}
          summary={`${visibleStageMothers.length} 件`}
          icon={
            <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ring-1 ${quickInfo ? "bg-brand-50 text-brand-600 ring-brand-200" : STAGE_STYLE[selected.color]}`}>
              <ContextIcon className="h-4 w-4" />
            </span>
          }
          action={
            <label className="relative block w-full sm:w-56">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="搜尋姓名、房號、待辦"
                className="w-full rounded-xl border border-stone-200 bg-stone-50 py-2 pl-9 pr-3 text-sm transition-[border-color,background-color,box-shadow] focus:border-brand-300 focus:bg-white"
              />
            </label>
          }
        >
          <p className="mb-3 text-xs text-stone-500">{quickInfo?.description ?? selected.description}</p>

          <div className="space-y-2.5">
            {visibleStageMothers.map((mother) => {
              const urgency = URGENCY[mother.urgency];
              const motherStage = JOURNEY_STAGES.find((stage) => stage.key === mother.stage);
              return (
                <article key={mother.id} className={`group rounded-xl border border-stone-200 ${urgency.border} bg-white p-3 transition-[border-color,box-shadow] hover:border-brand-300 hover:shadow-md sm:p-4`}>
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-sm font-bold text-brand-600">{mother.name.slice(0, 1)}</span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-bold text-stone-800">{mother.name}</h3>
                          <Badge color={urgency.badge}>{urgency.label}</Badge>
                          {quickView && <Badge color="purple">{motherStage?.label}</Badge>}
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
                    {/* 一步到位：直接進該案件的流程頁，中間不再隔一層摘要視窗。 */}
                    <Link
                      href={caseHref(mother.id)}
                      className="flex min-h-11 shrink-0 items-center justify-center gap-1 rounded-xl border border-stone-200 px-3 text-xs font-semibold text-stone-600 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-600"
                    >
                      開啟案件 <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </article>
              );
            })}
            {stageMothers.length === 0 && <div className="rounded-2xl border border-dashed border-stone-200 py-10 text-center text-sm text-stone-500">找不到符合條件的媽媽</div>}
            {!keyword && stageMothers.length > visibleStageMothers.length && (
              <Link href="/cases/" className="flex min-h-11 items-center justify-center rounded-2xl border border-dashed border-stone-200 text-sm font-semibold text-stone-500 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-600">
                查看其餘 {stageMothers.length - visibleStageMothers.length} 件案件
              </Link>
            )}
          </div>
        </CollapsibleSection>

        {SHOW_STAGE_CHECKLIST && !quickInfo && (
          <aside>
            <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-4 shadow-sm sm:p-5">
              <div className="mb-2 flex items-center gap-2 text-sm font-bold text-amber-800">
                <CircleCheckBig className="h-4 w-4" />
                {selected.label}・階段完成條件
              </div>
              <ul className="space-y-1.5 text-xs leading-5 text-stone-600">
                {selected.checklist.map((item) => <li key={item} className="flex gap-2"><Check className="mt-1 h-3 w-3 shrink-0 text-amber-600" />{item}</li>)}
              </ul>
            </div>
          </aside>
        )}
      </section>
    </div>
  );
}

function matchesQuickView(mother: JourneyMother, view: QuickView) {
  if (view === "overdue") return mother.urgency === "overdue";
  if (view === "today") return mother.urgency === "today";
  if (view === "staying") return mother.stage === "入住中";
  return mother.stage === "入住前" || mother.stage === "退房";
}
