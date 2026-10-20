"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CalendarClock, CalendarDays, Check, Eye, Plus, RotateCcw } from "lucide-react";
import Button, { ButtonLink } from "@/components/ui/Button";
import { useDomainStore } from "@/lib/demo/domainStore";
import { useCareStore } from "@/lib/care/store";
import { useCurrentRole } from "@/lib/roleStore";
import { roleTaskCategories, TASK_CATEGORIES, taskActions, taskEvents, type Task } from "@/lib/domain/tasks";
import { ROLE_PROFILE, type Role } from "@/lib/permissions";

/*
  待辦事項（v24 §9 的待辦行事曆）。

  三件規格要求在這裡落地，改動前請先看懂：
  1. 月曆整合 10 類事件，點日期右側列出明細並可「處理」。
  2. 預設篩選＝該角色實際會處理的類別（roleTaskCategories）；其他類別以
     虛線＋👁 顯示，可手動開啟但僅供檢視，按鈕是「檢視」而不是「處理」。
  3. 「重設為○○預設」可還原。

  ⚠️ 不要用「隱藏非預設類別」來實作第 2 點：規格明確要求其他類別仍看得到、
  可手動開啟，只是不能處理——那是跨班溝通用的，不是權限。模組層級的權限
  （哪個角色看得到這個頁面）是另一回事，由 lib/permissions.ts 管。
*/

const input = "h-10 rounded-lg border border-border-subtle bg-surface-raised px-3 text-sm";

/** 10 類事件的色票；與首頁的 Badge 色系同一套，換色請兩邊一起改。 */
const CATEGORY_TONE: Record<string, { chip: string; dot: string }> = {
  入住: { chip: "bg-emerald-100 text-emerald-900", dot: "bg-emerald-500" },
  退房: { chip: "bg-amber-100 text-amber-900", dot: "bg-amber-500" },
  參觀: { chip: "bg-sky-100 text-sky-900", dot: "bg-sky-500" },
  "合約／猶豫期": { chip: "bg-violet-100 text-violet-900", dot: "bg-violet-500" },
  待收款: { chip: "bg-orange-100 text-orange-900", dot: "bg-orange-500" },
  醫師巡診: { chip: "bg-rose-100 text-rose-900", dot: "bg-rose-500" },
  課程: { chip: "bg-blue-100 text-blue-900", dot: "bg-blue-500" },
  "關懷／提醒": { chip: "bg-stone-200 text-stone-900", dot: "bg-stone-500" },
  回補期限: { chip: "bg-red-100 text-red-900", dot: "bg-red-500" },
  托嬰: { chip: "bg-purple-100 text-purple-900", dot: "bg-purple-500" },
};
const tone = (category: string) => CATEGORY_TONE[category] ?? { chip: "bg-stone-100 text-stone-700", dot: "bg-stone-400" };

/** 每個角色上線後第一眼該看到的一句話；與 v24 §9 的預設篩選對應。 */
const ROLE_FOCUS: Record<Role, string> = {
  櫃台: "入住、退房、參觀、合約與收款是您的主線；巡診與回補期限僅供檢視。",
  "衛教師 琳雅": "關懷／提醒與退房後回補期限是您要處理的兩類；其餘類別僅供檢視。",
  "護理師 陳護理師": "醫師巡診、回補期限與托嬰是您要處理的類別；櫃檯類僅供檢視。",
  "護理長 婉真": "全院十類待辦都可處理，包含櫃檯與護理兩邊的進度。",
  管理者: "全院十類待辦都可處理，並可檢視所有角色的待辦來源。",
};

const DAY = 86_400_000;
const todayInTaipei = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Taipei" });

export default function TodoWorkspace() {
  // 切換角色時整個重建：篩選預設值、已開啟的類別與新增表單都要跟著回到該角色的起點
  //（v24 §1「切換時重設行事曆預設篩選」）。
  const role = useCurrentRole();
  return <Workspace key={role} />;
}

function Workspace() {
  const role = useCurrentRole();
  const { data } = useDomainStore();
  const { data: care } = useCareStore();

  const defaults = useMemo(() => roleTaskCategories(role), [role]);
  const [filters, setFilters] = useState<string[]>(defaults);
  const [month, setMonth] = useState(data.demoAt.slice(0, 7));
  const [selected, setSelected] = useState(data.demoAt.slice(0, 10));
  const [view, setView] = useState<"月" | "週" | "日">("月");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(defaults[0] ?? "關懷／提醒");
  const [message, setMessage] = useState("");

  const all = useMemo(() => taskEvents(data, care), [data, care]);
  const events = all.filter((item) => filters.includes(item.category));

  /*
    「今天」要等掛載後才算。

    ⚠️ 本專案是靜態匯出（output: "export"），HTML 在建置當下就產生好了；
    若在 render 期間呼叫 new Date()，伺服器端算出的是建置日、瀏覽器算出的是
    真正的今天，兩者不同就會 hydration 失敗。因此先以示範基準日開場，
    掛載後再跳到今天並連帶把月份與選取日移過去。
  */
  const [today, setToday] = useState(data.demoAt.slice(0, 10));
  useEffect(() => {
    // 延到微任務再設，避免 react-hooks/set-state-in-effect 的連鎖渲染警告。
    void Promise.resolve().then(() => {
      const real = todayInTaipei();
      setToday(real);
      setMonth(real.slice(0, 7));
      setSelected(real);
    });
  }, []);

  /** 我要處理的（屬於本角色預設類別）、尚未處理的待辦，用於上方摘要。 */
  const mine = all.filter((item) => defaults.includes(item.category) && !item.handled);
  const overdue = mine.filter((item) => item.date < today);
  const dueToday = mine.filter((item) => item.date === today);
  const dueThisWeek = mine.filter((item) => item.date > today && item.date <= shift(today, 7));

  const [year, mon] = month.split("-").map(Number);
  const offset = new Date(year, mon - 1, 1).getDay();
  const days = new Date(year, mon, 0).getDate();
  const selectedAt = new Date(`${selected}T00:00:00+08:00`);
  const weekStart = new Date(selectedAt.valueOf() - selectedAt.getDay() * DAY);
  const weekDates = Array.from({ length: 7 }, (_, index) =>
    new Date(weekStart.valueOf() + index * DAY).toLocaleDateString("en-CA", { timeZone: "Asia/Taipei" }),
  );
  const selectedEvents = events.filter((item) => item.date === selected);

  function run(action: () => void) {
    try {
      action();
      setMessage("已更新本機待辦；原型不會發送任何通知。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "處理失敗。");
    }
  }

  return (
    <div className="space-y-5">
      <p className="text-sm leading-6 text-stone-600">
        案件、照護與托嬰共用同一份資料自動產生期限；巡診、課程與關懷以匿名待辦示範。
        <span className="font-medium text-stone-700">{ROLE_FOCUS[role]}</span>
      </p>

      {/* 需立即處理事項：逾期最刺眼，今天其次，本週只作為預告 */}
      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryCard
          tone="danger"
          icon={AlertTriangle}
          label="已逾期"
          count={overdue.length}
          hint={overdue[0] ? overdue[0].title : "沒有逾期項目"}
          onClick={() => overdue[0] && jump(overdue[0])}
        />
        <SummaryCard
          tone="brand"
          icon={CalendarClock}
          label={`今天（${today.slice(5)}）`}
          count={dueToday.length}
          hint={dueToday[0] ? dueToday[0].title : "今天沒有待辦"}
          onClick={() => setPick(today)}
        />
        <SummaryCard
          tone="muted"
          icon={CalendarDays}
          label="未來 7 天"
          count={dueThisWeek.length}
          hint={dueThisWeek[0] ? `最近：${dueThisWeek[0].date.slice(5)} ${dueThisWeek[0].title}` : "未來一週沒有待辦"}
          onClick={() => dueThisWeek[0] && setPick(dueThisWeek[0].date)}
        />
      </div>

      {message && (
        <p role="status" className="rounded-xl border border-border-subtle bg-surface-muted px-4 py-3 text-sm">
          {message}
        </p>
      )}

      {/* 類別篩選：角色預設為實心可處理，其餘虛線＋👁 僅供檢視 */}
      <section className="space-y-2 rounded-2xl border border-border-subtle bg-surface-raised p-3 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="mr-1 text-xs font-semibold text-stone-500">顯示類別</h2>
          {TASK_CATEGORIES.map((item) => {
            const own = defaults.includes(item);
            const on = filters.includes(item);
            return (
              <Button
                key={item}
                size="sm"
                selected={on}
                className={own ? "" : "border-dashed"}
                title={own ? `${item}：可處理` : `${item}：不在您的職掌，開啟後僅供檢視`}
                onClick={() => setFilters(on ? filters.filter((old) => old !== item) : [...filters, item])}
              >
                <span className={`h-2 w-2 rounded-full ${on ? "bg-white/80" : tone(item).dot}`} aria-hidden="true" />
                {item}
                {!own && <Eye className="h-3 w-3 opacity-70" aria-hidden="true" />}
              </Button>
            );
          })}
          <Button size="sm" variant="ghost" onClick={() => setFilters(defaults)}>
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            重設為{ROLE_PROFILE[role].name}預設
          </Button>
        </div>
        <p className="text-xs text-stone-500">虛線＋👁 的類別不在您的職掌，開啟後只能「檢視」，不會出現「處理完成」。</p>
      </section>

      {/* 月份與檢視切換 */}
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-stone-600">
          月份
          <input
            aria-label="行事曆月份"
            type="month"
            className={input}
            value={month}
            onChange={(event) => {
              if (event.target.value) setMonth(event.target.value);
            }}
          />
        </label>
        <div role="group" aria-label="檢視方式" className="flex gap-1.5">
          {(["月", "週", "日"] as const).map((item) => (
            <Button key={item} size="sm" selected={view === item} onClick={() => setView(item)}>
              {item}檢視
            </Button>
          ))}
        </div>
        <span className="ml-auto text-xs text-stone-500">
          本月顯示 {events.filter((item) => item.date.startsWith(month)).length} 項
        </span>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(300px,1fr)]">
        <section className="overflow-x-auto rounded-2xl border border-border-subtle bg-surface-raised p-3 shadow-xs">
          {view === "月" && (
            <div className="grid min-w-[700px] grid-cols-7 gap-px rounded-xl bg-border-subtle">
              {["日", "一", "二", "三", "四", "五", "六"].map((label) => (
                <div key={label} className="bg-surface-muted py-2 text-center text-xs font-semibold text-stone-500">
                  {label}
                </div>
              ))}
              {Array.from({ length: offset }, (_, index) => (
                <div key={`empty-${index}`} className="bg-surface-raised" />
              ))}
              {Array.from({ length: days }, (_, index) => {
                const date = `${month}-${String(index + 1).padStart(2, "0")}`;
                const items = events.filter((item) => item.date === date && !item.handled);
                const isToday = date === today;
                return (
                  <button
                    type="button"
                    key={date}
                    aria-label={`${date}，${items.length} 項待辦事項`}
                    aria-pressed={selected === date}
                    onClick={() => setSelected(date)}
                    className={
                      "flex min-h-28 flex-col items-stretch gap-1 p-2 text-left text-sm transition-colors " +
                      (selected === date
                        ? "bg-brand-50 ring-2 ring-inset ring-brand-500"
                        : "bg-surface-raised hover:bg-brand-50/60")
                    }
                  >
                    <span
                      className={
                        "inline-flex h-6 w-6 items-center justify-center self-start rounded-full text-xs font-semibold tabular-nums " +
                        (isToday ? "bg-brand-600 text-white" : "text-stone-600")
                      }
                    >
                      {index + 1}
                    </span>
                    {items.slice(0, 2).map((item) => (
                      <span key={item.id} className={`block truncate rounded px-1.5 py-1 text-[11px] ${tone(item.category).chip}`}>
                        {item.category}｜{item.title.split("｜").at(-1)}
                      </span>
                    ))}
                    {items.length > 2 && <span className="text-xs text-stone-500">另 {items.length - 2} 項</span>}
                  </button>
                );
              })}
            </div>
          )}

          {view === "週" && (
            <div className="grid min-w-[700px] grid-cols-7 gap-px rounded-xl bg-border-subtle">
              {weekDates.map((date) => (
                <button
                  type="button"
                  key={date}
                  aria-pressed={selected === date}
                  onClick={() => setSelected(date)}
                  className={
                    "flex min-h-72 flex-col items-stretch gap-2 p-2 text-left transition-colors " +
                    (selected === date ? "bg-brand-50 ring-2 ring-inset ring-brand-500" : "bg-surface-raised hover:bg-brand-50/60")
                  }
                >
                  <span className="text-sm font-semibold tabular-nums text-stone-600">{date.slice(5)}</span>
                  {events
                    .filter((item) => item.date === date && !item.handled)
                    .map((item) => (
                      <span key={item.id} className={`rounded-lg p-2 text-xs ${tone(item.category).chip}`}>
                        <span className="font-medium">{item.category}</span>
                        <br />
                        {item.title}
                      </span>
                    ))}
                </button>
              ))}
            </div>
          )}

          {view === "日" && (
            <div className="space-y-2">
              <h2 className="font-semibold text-stone-700">{selected} 全日待辦事項</h2>
              {selectedEvents.map((item) => (
                <Link
                  href={item.href}
                  key={item.id}
                  className={`flex items-center gap-2 rounded-xl p-3 text-sm ${tone(item.category).chip}`}
                >
                  <span className="font-medium">{item.category}</span>
                  <span>{item.title}</span>
                </Link>
              ))}
              {!selectedEvents.length && <p className="py-6 text-center text-sm text-stone-500">本日沒有符合篩選的待辦。</p>}
            </div>
          )}
        </section>

        {/* 所選日期的明細：可處理的才給「處理完成」，其餘僅「檢視」（v24 §9） */}
        <section className="space-y-3 rounded-2xl border border-border-subtle bg-surface-raised p-4 shadow-xs">
          <h2 className="font-semibold text-stone-700">{selected} 明細</h2>
          {selectedEvents.map((event) => {
            const own = defaults.includes(event.category);
            return (
              <div key={event.id} className="space-y-2 border-b border-border-subtle pb-3 last:border-b-0 text-sm">
                <p className="flex flex-wrap items-center gap-2">
                  <span className={`inline-flex rounded px-2 py-1 text-xs ${tone(event.category).chip}`}>{event.category}</span>
                  <span className={event.handled ? "text-stone-400 line-through" : "text-stone-700"}>{event.title}</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  <ButtonLink href={event.href} size="sm">
                    檢視
                  </ButtonLink>
                  {own && (
                    <Button
                      size="sm"
                      variant={event.handled ? "subtle" : "primary"}
                      disabled={event.handled}
                      onClick={() => run(() => taskActions.complete(event.id))}
                    >
                      <Check className="h-3.5 w-3.5" aria-hidden="true" />
                      {event.handled ? "已處理" : "處理完成"}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
          {!selectedEvents.length && <p className="text-sm text-stone-500">所選日期沒有符合篩選的待辦。</p>}
        </section>
      </div>

      {defaults.length > 0 && (
        <section className="space-y-3 rounded-2xl border border-border-subtle bg-surface-raised p-4 shadow-xs">
          <h2 className="font-semibold text-stone-700">新增 {selected} 的待辦事項</h2>
          <div className="flex flex-wrap gap-3">
            <select
              aria-label="新增待辦事項類別"
              className={input}
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            >
              {defaults.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
            <input
              aria-label="待辦事項內容"
              placeholder="例：302 房明早 10:00 產前關懷電話"
              className={`${input} min-w-0 flex-1`}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
            <Button
              variant="primary"
              onClick={() =>
                run(() => {
                  taskActions.add(selected, category, title);
                  setTitle("");
                })
              }
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              新增待辦事項
            </Button>
          </div>
          <p className="text-xs text-stone-500">只能新增您職掌內的類別；原型存在瀏覽器記憶體，重新整理會回到示範資料。</p>
        </section>
      )}
    </div>
  );

  function setPick(date: string) {
    setMonth(date.slice(0, 7));
    setSelected(date);
  }

  function jump(task: Task) {
    setPick(task.date);
    // 逾期項目可能不在目前篩選內（例如被手動關掉），一併打開該類別才看得到
    if (!filters.includes(task.category)) setFilters([...filters, task.category]);
  }
}

function shift(date: string, days: number) {
  return new Date(Date.parse(`${date}T00:00:00+08:00`) + days * DAY).toLocaleDateString("en-CA", { timeZone: "Asia/Taipei" });
}

function SummaryCard({
  tone: cardTone,
  icon: Icon,
  label,
  count,
  hint,
  onClick,
}: {
  tone: "danger" | "brand" | "muted";
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  count: number;
  hint: string;
  onClick: () => void;
}) {
  const styles = {
    danger: count > 0 ? "border-rose-200 bg-rose-50 text-rose-700" : "border-border-subtle bg-surface-raised text-stone-500",
    brand: "border-brand-200 bg-brand-50 text-brand-700",
    muted: "border-border-subtle bg-surface-raised text-stone-600",
  }[cardTone];

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-stretch gap-1 rounded-2xl border p-4 text-left shadow-xs transition-[border-color,box-shadow] hover:shadow-sm ${styles}`}
    >
      <span className="flex items-center gap-2 text-xs font-semibold">
        <Icon className="h-4 w-4" aria-hidden="true" />
        {label}
      </span>
      <span className="text-2xl font-bold tabular-nums leading-tight">{count}</span>
      <span className="truncate text-xs opacity-80">{hint}</span>
    </button>
  );
}
