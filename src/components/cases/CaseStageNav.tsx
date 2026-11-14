"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { ChevronRight, Search } from "lucide-react";
import HeaderSlot from "@/components/layout/HeaderSlot";
import { CASE_STAGES } from "@/lib/domain/types";
import { searchCaseStages, type StageSearchEntry } from "@/lib/domain/caseStageSearch";

/*
  案件詳情的階段流程列（客戶 2026-11-14）：預約 > 參觀 > … > 退房 排成一列，
  點哪個就只顯示那個階段；右側模糊搜尋欄位，選了直接跳到該階段的欄位。

  放在頁首下方第 3 層（HeaderSlot below），捲到哪裡都看得到，不必上下捲動找階段。
*/
export function stageState(index: number, current: number, closed: boolean) {
  return closed ? "closed" : index < current ? "complete" : index === current ? "current" : "future";
}

export default function CaseStageNav({ current, closed, shown, onSelect, onJump }: { current: number; closed: boolean; shown: number; onSelect: (index: number) => void; onJump: (entry: StageSearchEntry) => void }) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const results = query.trim() ? searchCaseStages(query) : [];
  const pick = (entry: StageSearchEntry) => { setQuery(""); onJump(entry); };
  const navRef = useRef<HTMLElement>(null);
  // 窄螢幕流程列會橫向捲動：切換階段後把選取中的那一格捲進可視範圍。
  useEffect(() => { navRef.current?.querySelector('[aria-current="step"]')?.scrollIntoView({ block: "nearest", inline: "nearest" }); }, [shown]);

  return (
    <HeaderSlot>
      <div className="case-stepper">
        <nav ref={navRef} aria-label="案件階段" className="case-stepper-steps">
          {CASE_STAGES.map((stage, index) => {
            const state = stageState(index, current, closed);
            return (
              <Fragment key={stage}>
                {index > 0 && <ChevronRight className="h-4 w-4 shrink-0 text-stone-400" aria-hidden="true" />}
                <button type="button" data-state={state} aria-label={`${index + 1}. ${stage}`} aria-current={index === shown ? "step" : undefined} title={state === "complete" ? "已完成・可修改" : state === "current" ? "進行中" : state === "closed" ? "已結案" : "尚未開始"} onClick={() => onSelect(index)}>
                  <span className="case-stage-index" aria-hidden="true">{state === "complete" || state === "closed" ? "✓" : index + 1}</span>
                  <span>{stage}</span>
                </button>
              </Fragment>
            );
          })}
        </nav>
        <div className="case-stepper-search">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" aria-hidden="true" />
          <input
            type="search"
            role="combobox"
            aria-label="搜尋階段欄位"
            aria-expanded={results.length > 0}
            aria-controls="case-stage-search-results"
            aria-autocomplete="list"
            placeholder="搜尋欄位，例如：訂金、房號"
            value={query}
            onChange={(event) => { setQuery(event.target.value); setActive(0); }}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown") { event.preventDefault(); setActive((value) => Math.min(value + 1, results.length - 1)); }
              if (event.key === "ArrowUp") { event.preventDefault(); setActive((value) => Math.max(value - 1, 0)); }
              if (event.key === "Enter" && results[active]) { event.preventDefault(); pick(results[active]); }
              if (event.key === "Escape") setQuery("");
            }}
          />
          {query.trim() && (
            <ul id="case-stage-search-results" role="listbox" aria-label="搜尋結果" className="case-stepper-results">
              {results.map((entry, index) => (
                <li key={`${entry.stage}-${entry.label}`} role="option" aria-selected={index === active} onMouseDown={(event) => event.preventDefault()} onClick={() => pick(entry)} onMouseEnter={() => setActive(index)}>
                  <span className="text-xs text-stone-500">{entry.stage < 0 ? "共通資料" : `${entry.stage + 1}. ${CASE_STAGES[entry.stage]}`}{entry.step && entry.step !== entry.label ? `・${entry.step}` : ""}</span>
                  <span className="font-medium text-stone-800">{entry.label}</span>
                </li>
              ))}
              {!results.length && <li className="text-sm text-stone-500">找不到符合的欄位</li>}
            </ul>
          )}
        </div>
      </div>
    </HeaderSlot>
  );
}
