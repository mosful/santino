"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

/*
  可單獨收合的區塊。

  院內不同角色關心的東西不一樣（櫃台看案件、護理站看房況），把用不到的整塊收起來
  比捲動快。收合狀態**記在這台瀏覽器**，下次開同一頁維持原樣。

  ⚠️ localStorage 是外部狀態，用 useSyncExternalStore 讀，不要在 effect 裡 setState：
  本專案是靜態匯出，伺服器端一律當「展開」，水合後才切到記住的值，否則會 hydration 失敗。

  ⚠️ 儲存格式是 id → 收合與否的**對照表**，不是「收合中的 id 清單」：
  有了 defaultCollapsed（預設收合的區塊，例如退房的三張單）之後，必須分得出
  「使用者沒動過」和「使用者把它展開了」，用清單表達不了後者。
  舊版的陣列格式會在讀取時自動轉過來。
*/

const STORAGE_KEY = "santino_collapsed_sections_v1";
const listeners = new Set<() => void>();
type CollapsedMap = Record<string, boolean>;
let cache: CollapsedMap | null = null;
/** 伺服器端與水合首幀共用的空集合；必須是同一個物件，否則每次呼叫都會觸發重渲染。 */
const EMPTY: CollapsedMap = {};

function read(): CollapsedMap {
  if (cache) return cache;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    if (Array.isArray(parsed)) {
      // 舊格式（收合中的 id 清單）→ 對照表。
      cache = Object.fromEntries(parsed.filter((item): item is string => typeof item === "string").map((item) => [item, true]));
    } else if (parsed && typeof parsed === "object") {
      cache = Object.fromEntries(Object.entries(parsed as Record<string, unknown>).filter(([, value]) => typeof value === "boolean")) as CollapsedMap;
    } else {
      cache = {};
    }
  } catch {
    cache = {};
  }
  return cache;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function setCollapsed(id: string, collapsed: boolean) {
  cache = { ...read(), [id]: collapsed };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  } catch {
    // 隱私模式讀寫會丟例外；記不住就算了，不影響操作。
  }
  listeners.forEach((item) => item());
}

/** 目前各區塊的收合狀態；沒有記錄的區塊不在表內。 */
export function useCollapsed(): CollapsedMap {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

export default function CollapsibleSection({
  id,
  title,
  icon,
  summary,
  action,
  children,
  className = "",
  bodyClassName = "",
  defaultCollapsed = false,
}: {
  /** 收合狀態的儲存代號；換掉等於重置使用者的收合偏好。 */
  id: string;
  title: ReactNode;
  icon?: ReactNode;
  /** 收合時仍要看得到的一句摘要（例如「18 間使用中」）。 */
  summary?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  /** 使用者沒動過時的預設狀態；長表單（例如退房的三張單）預設收起來比較好找。 */
  defaultCollapsed?: boolean;
}) {
  const collapsed = useCollapsed()[id] ?? defaultCollapsed;
  const bodyId = `section-${id}`;

  return (
    <section className={"work-surface overflow-hidden " + className}>
      <div className="flex flex-wrap items-center gap-2 px-3 py-2.5 sm:px-4">
        <button
          type="button"
          onClick={() => setCollapsed(id, !collapsed)}
          aria-expanded={!collapsed}
          aria-controls={bodyId}
          /*
            ⚠️ 要明寫 justify-start：globals.css 把所有 button 設成置中的 inline-flex，
            少了它標題會跑到卡片正中間。
            ⚠️ min-w 不能只靠 min-w-0：action 放了搜尋框＋按鈕時（案件清單）會把標題壓到
            一個字一行——iPad 展開側欄後內容只剩 580px，實際看到的就是直排的「案 件 清 單」。
            給一個下限，放不下時由 flex-wrap 把 action 擠到下一行。
          */
          className="-m-1 flex min-w-[9rem] flex-1 items-center justify-start gap-2 rounded-lg p-1 text-left transition-colors hover:bg-surface-muted"
        >
          <ChevronDown
            className={"h-4 w-4 shrink-0 text-stone-400 transition-transform " + (collapsed ? "-rotate-90" : "")}
            aria-hidden="true"
          />
          {icon}
          <h2 className="truncate text-base font-bold text-stone-800">{title}</h2>
          {summary && <span className="truncate text-xs text-stone-500">{summary}</span>}
        </button>
        {action}
      </div>
      <div id={bodyId} hidden={collapsed} className={"px-3 pb-3 sm:px-4 sm:pb-4 " + bodyClassName}>
        {children}
      </div>
    </section>
  );
}
