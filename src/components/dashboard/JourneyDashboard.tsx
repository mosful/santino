"use client";

import Link from "next/link";
import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  AlertCircle,
  ArrowRight,
  CalendarClock,
  Check,
  CircleCheckBig,
  Search,
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
import Pagination from "@/components/ui/Pagination";

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
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

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
  /*
    分頁（客戶 2026-10-22，預設每頁 10 筆）。
    原本是「只顯示前 8 筆＋一條查看其餘」，筆數一多就得跳去案件清單才看得完。
    ⚠️ 階段、快捷檢視或關鍵字一變就要回到第 1 頁，否則會停在一個空白的第 3 頁。
  */
  const totalPages = Math.max(1, Math.ceil(stageMothers.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const visibleStageMothers = stageMothers.slice((safePage - 1) * pageSize, safePage * pageSize);

  function selectStage(stage: JourneyStageKey) {
    setPage(1);
    setSelectedStage(stage);
    setQuickView(null);
    setQuery("");
  }

  function selectQuickView(view: QuickView) {
    setPage(1);
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
      {/*
        案件流程＝「階段頁籤＋該階段的案件清單」一個區塊。

        ⚠️ 原本是兩塊：上面一條漏斗圖示、下面一塊卡片清單。客戶 2026-10-22 指出
        那是同一件事被拆成兩個框，而且卡片中間留一大塊空白。現在階段改成頁籤、
        結果改成清單，一個區塊收完。
      */}
      <CollapsibleSection
        id="case-funnel"
        title="案件流程"
        summary={`${quickInfo?.label ?? selected.label}　${stageMothers.length} 件`}
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
              onChange={(event) => { setQuery(event.target.value); setPage(1); }}
              placeholder="搜尋姓名、房號、待辦"
              className="w-full rounded-xl border border-stone-200 bg-stone-50 py-2 pl-9 pr-3 text-sm transition-[border-color,background-color,box-shadow] focus:border-brand-300 focus:bg-white"
            />
          </label>
        }
      >
        <div className="scroll-fade -mx-1 mb-3 overflow-x-auto px-1 pb-1">
          <div role="tablist" aria-label="案件階段" className="flex min-w-max gap-1.5">
            {JOURNEY_STAGES.map((stage) => {
              const count = mothers.filter((mother) => mother.stage === stage.key).length;
              const active = !quickView && stage.key === selectedStage;
              return (
                <button
                  key={stage.key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => selectStage(stage.key)}
                  className={
                    "flex min-h-10 items-center gap-1.5 whitespace-nowrap rounded-xl border px-3 text-sm font-semibold transition-colors " +
                    (active
                      ? "border-brand-300 bg-brand-50 text-brand-700"
                      : "border-stone-200 bg-white text-stone-600 hover:border-brand-200 hover:bg-brand-50/60")
                  }
                >
                  {stage.label}
                  <span className={"flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] font-bold tabular-nums " + (active ? "bg-brand-600 text-white" : "bg-stone-200 text-stone-700")}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <p className="mb-3 text-xs text-stone-500">{quickInfo?.description ?? selected.description}</p>

        {/* 清單式呈現：原本一人一張卡，中間大段留白；改成表格後一眼掃完一整個階段。 */}
        <div className="overflow-x-auto rounded-xl border border-stone-200">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="bg-stone-50 text-xs text-stone-500">
              <tr>
                <th className="whitespace-nowrap px-3 py-2.5 font-medium">媽媽</th>
                <th className="whitespace-nowrap px-3 py-2.5 font-medium">房位／預產期</th>
                <th className="whitespace-nowrap px-3 py-2.5 font-medium">狀態</th>
                <th className="whitespace-nowrap px-3 py-2.5 font-medium">下一步</th>
                <th className="whitespace-nowrap px-3 py-2.5 font-medium">負責</th>
                <th className="px-3 py-2.5 font-medium"><span className="sr-only">開啟案件</span></th>
              </tr>
            </thead>
            <tbody>
              {visibleStageMothers.map((mother) => {
                const urgency = URGENCY[mother.urgency];
                const motherStage = JOURNEY_STAGES.find((stage) => stage.key === mother.stage);
                return (
                  <tr key={mother.id} className="border-t border-stone-100 transition-colors hover:bg-brand-50/40">
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand-600">{mother.name.slice(0, 1)}</span>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="font-bold text-stone-800">{mother.name}</span>
                            <Badge color={urgency.badge}>{urgency.label}</Badge>
                            {quickView && <Badge color="purple">{motherStage?.label}</Badge>}
                          </div>
                          {mother.tags.length > 0 && (
                            <div className="mt-1 flex flex-wrap gap-1">
                              {mother.tags.map((tag) => <span key={tag} className="rounded bg-stone-100 px-1.5 py-0.5 text-[11px] text-stone-500">{tag}</span>)}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-xs text-stone-600">
                      {mother.room ? <span className="font-semibold text-stone-700">{mother.room}</span> : mother.dueDate || "—"}
                      {mother.stayDay && <div className="mt-0.5 text-stone-500">{mother.stayDay}</div>}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-stone-600">{mother.status}</td>
                    <td className="px-3 py-2.5 text-xs">
                      <div className="font-semibold text-stone-700">{mother.nextAction}</div>
                      <div className="mt-0.5 text-amber-700">{mother.actionDate}</div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-xs text-stone-600">{mother.owner}</td>
                    <td className="px-3 py-2.5">
                      {/* 一步到位：直接進該案件的流程頁。按鈕只留箭頭（客戶 2026-10-22）。 */}
                      <Link
                        href={caseHref(mother.id)}
                        aria-label={`開啟 ${mother.name} 的案件`}
                        title={`開啟 ${mother.name} 的案件`}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-stone-200 text-stone-500 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
                      >
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {stageMothers.length === 0 && (
                <tr><td colSpan={6} className="px-3 py-10 text-center text-sm text-stone-500">找不到符合條件的媽媽</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {stageMothers.length > 0 && (
          <div className="mt-2.5">
            <Pagination
              page={safePage}
              pageSize={pageSize}
              total={stageMothers.length}
              onPageChange={setPage}
              onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
            />
          </div>
        )}
      </CollapsibleSection>

      <section className={SHOW_STAGE_CHECKLIST ? "grid gap-4" : "contents"}>
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
