"use client";

import { useState } from "react";
import PageHeader from "@/components/ui/PageHeader";
import RequireAccess from "@/components/ui/RequireAccess";
import MamaRoomCard from "@/components/mama/MamaRoomCard";
import MamaRoomListView from "@/components/mama/MamaRoomListView";
import MamaCarePanel from "@/components/mama/MamaCarePanel";
import FloatingWindow from "@/components/ui/FloatingWindow";
import WindowTray from "@/components/ui/WindowTray";
import Badge from "@/components/ui/Badge";
import Switch from "@/components/ui/Switch";
import Pagination from "@/components/ui/Pagination";
import CareSearch from "@/components/ui/CareSearch";
import { rowMatchesQuery } from "@/lib/fuzzySearch";
import { useMultiWindowManager } from "@/lib/useMultiWindowManager";
import { DISCHARGED_MAMA_RECORDS, MAMA_ROOMS, type MamaRoom } from "@/lib/mock/mamaRoom";

const STATUS_FILTERS = ["全部", "入住", "空房", "打掃", "報修"] as const;

// 開啟作業視窗時的預設頁籤（第一個核心功能）
const DEFAULT_TAB = "admission";

export default function MamaPage() {
  const [filter, setFilter] = useState<(typeof STATUS_FILTERS)[number]>("全部");
  const [showSecondary, setShowSecondary] = useState(false);
  const [listView, setListView] = useState(true);
  const [showDischarged, setShowDischarged] = useState(false);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const {
    windows,
    openWindow,
    selectTab,
    closeWindow,
    closeAll,
    bringToFront,
    toggleMinimize,
    minimizeAll,
    blockedMsg,
  } = useMultiWindowManager();

  const availableRooms = showDischarged ? [...DISCHARGED_MAMA_RECORDS, ...MAMA_ROOMS] : MAMA_ROOMS;
  const byStatus = filter === "全部" ? availableRooms : availableRooms.filter((r) => r.status === filter);
  const rooms = q ? byStatus.filter((r) => rowMatchesQuery(r, q)) : byStatus;
  const totalPages = Math.max(1, Math.ceil(rooms.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pagedRooms = rooms.slice((safePage - 1) * pageSize, safePage * pageSize);

  /** 視窗標題與工作列標籤：房號＋媽媽姓名（功能名稱已由頁籤本身表達） */
  function findRecord(caseId: string) {
    return availableRooms.find((record) => (record.caseId ?? record.room) === caseId);
  }

  function windowLabel(caseId: string) {
    const record = findRecord(caseId);
    if (!record) return caseId;
    return `${record.room}｜${record.motherName ?? "空房"}${record.historical ? "｜退房回補" : ""}`;
  }

  function openMamaRecord(record: MamaRoom) {
    openWindow(record.room, record.historical ? "record" : DEFAULT_TAB, record.caseId ?? record.room);
  }

  return (
    <div className="w-full px-4 py-3 sm:px-6 sm:py-4">
      <RequireAccess moduleNo="2">
      <PageHeader
        title="2. 媽媽照護（護理版房卡）"
        moduleNo="2"
        action={
          <div className="flex flex-wrap gap-1">
            {STATUS_FILTERS.map((s) => (
              <button
                key={s}
                title={`只顯示狀態為「${s}」的房間`}
                onClick={() => {
                  setFilter(s);
                  setPage(1);
                }}
                className={
                  "rounded-full px-3 py-1 text-xs " +
                  (filter === s ? "bg-rose-500 text-white" : "bg-stone-100 text-stone-600")
                }
              >
                {s}
              </button>
            ))}
          </div>
        }
      />

      <div className="mb-4 flex flex-wrap gap-3 text-xs text-stone-500">
        <span>圖例：</span>
        <Badge color="slate">空房(白)</Badge>
        <Badge color="green">入住(綠)</Badge>
        <Badge color="rose">親子同室(粉)</Badge>
        <Badge color="amber">打掃(黃)</Badge>
        <Badge color="blue">報修(藍)</Badge>
        <span className="ml-auto flex items-center gap-2">
          作業頁籤：<span className="text-rose-600">紅色＝6大核心功能</span>
          <Switch checked={showSecondary} onChange={setShowSecondary} label="顯示次要功能" />
          <Switch checked={listView} onChange={setListView} label="清單檢視" />
        </span>
      </div>

      <p className="mb-4 rounded-lg bg-brand-50 px-3 py-2 text-xs text-brand-600">
        💡 每間房開啟一個作業視窗，視窗內以頁籤切換各項紀錄；
        <span className="non-tablet-copy">可同時開啟多間房比對（拖曳標題列移動、右下角可縮放）。</span>
        <span className="tablet-only-copy">平板會以大型固定工作區開啟，可由下方工作列快速切換房間。</span>
        切換到含簽名步驟的頁籤（✍）時，會鎖定僅能操作單一房間。
      </p>

      <CareSearch
        value={q}
        onChange={(value) => {
          setQ(value);
          setPage(1);
        }}
        placeholder="搜尋房號/媽媽姓名/病歷號（支援模糊搜尋）"
        resultCount={rooms.length}
        accent="rose"
      />

      <label className="mb-4 flex cursor-pointer flex-wrap items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        <input
          type="checkbox"
          checked={showDischarged}
          onChange={(event) => {
            setShowDischarged(event.target.checked);
            setFilter("全部");
            setPage(1);
          }}
          className="h-5 w-5 accent-amber-600"
        />
        <span className="font-medium">顯示今日上午已退房、可回補紀錄的個案</span>
        <span className="rounded-full bg-amber-200 px-2.5 py-1 text-xs">{DISCHARGED_MAMA_RECORDS.length} 位待處理</span>
        <span className="w-full text-xs text-amber-700 sm:ml-8 sm:w-auto">房號可能已由下午新住客使用，系統會依病歷個案分開開窗。</span>
      </label>

      {listView ? (
        <>
          <div className="care-list-table md:hidden lg:block">
            <MamaRoomListView rooms={pagedRooms} onOpen={openMamaRecord} />
          </div>
          <div className="care-list-cards hidden grid-cols-2 gap-4 md:grid lg:hidden">
            {pagedRooms.map((r) => (
              <MamaRoomCard key={r.caseId ?? r.room} room={r} onOpen={openMamaRecord} />
            ))}
          </div>
        </>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {pagedRooms.map((r) => (
            <MamaRoomCard
              key={r.caseId ?? r.room}
              room={r}
              onOpen={openMamaRecord}
            />
          ))}
        </div>
      )}

      <div className="mt-4">
        <Pagination
          page={safePage}
          pageSize={pageSize}
          total={rooms.length}
          onPageChange={setPage}
          onPageSizeChange={(n) => {
            setPageSize(n);
            setPage(1);
          }}
        />
      </div>

      {blockedMsg && (
        <div
          className={
            "fixed left-1/2 z-[60] -translate-x-1/2 rounded-lg bg-stone-900 px-4 py-2.5 text-xs text-white shadow-lg " +
            (windows.length > 0 ? "bottom-16" : "bottom-4")
          }
        >
          {blockedMsg}
        </div>
      )}

      {windows.map((w) => (
        <FloatingWindow
          key={w.id}
          title={windowLabel(w.caseId)}
          onClose={() => closeWindow(w.id)}
          onFocus={() => bringToFront(w.id)}
          onMinimize={() => toggleMinimize(w.id)}
          zIndex={w.z}
          initialPos={{ x: w.x, y: w.y }}
          hidden={w.minimized}
          wide
        >
          <MamaCarePanel
            room={w.room}
            caseLabel={(() => {
              const record = findRecord(w.caseId);
              return record ? `房號 ${record.room}｜${record.motherName}｜病歷號 ${record.chartNo}` : undefined;
            })()}
            historical={findRecord(w.caseId)?.historical}
            showSecondary={showSecondary}
            activeKey={w.activeKey}
            onTabSelect={(t) => selectTab(w.id, t.key, !!t.hasSignature)}
          />
        </FloatingWindow>
      ))}

      <WindowTray
        items={windows.map((w) => ({
          id: w.id,
          label: windowLabel(w.caseId),
          minimized: w.minimized,
        }))}
        onToggle={toggleMinimize}
        onClose={closeWindow}
        onMinimizeAll={minimizeAll}
        onCloseAll={closeAll}
      />
      </RequireAccess>
    </div>
  );
}
