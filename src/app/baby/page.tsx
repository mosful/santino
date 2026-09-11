"use client";

import { useState } from "react";
import PageHeader from "@/components/ui/PageHeader";
import RequireAccess from "@/components/ui/RequireAccess";
import BabyRoomCard from "@/components/baby/BabyRoomCard";
import BabyRoomListView from "@/components/baby/BabyRoomListView";
import BabyCarePanel from "@/components/baby/BabyCarePanel";
import FloatingWindow from "@/components/ui/FloatingWindow";
import WindowTray from "@/components/ui/WindowTray";
import Badge from "@/components/ui/Badge";
import Switch from "@/components/ui/Switch";
import Pagination from "@/components/ui/Pagination";
import CareSearch from "@/components/ui/CareSearch";
import { rowMatchesQuery } from "@/lib/fuzzySearch";
import { useMultiWindowManager } from "@/lib/useMultiWindowManager";
import { BABY_ROOMS, BOARDING_BABIES, type BabyRoom } from "@/lib/mock/babyRoom";

const STATUS_FILTERS = ["全部", "入住", "托嬰", "隔離", "親子同室", "視訊"] as const;

// 開啟作業視窗時的預設頁籤（第一個核心功能）
const DEFAULT_TAB = "admission";

export default function BabyPage() {
  const [filter, setFilter] = useState<(typeof STATUS_FILTERS)[number]>("全部");
  const [showSecondary, setShowSecondary] = useState(false);
  const [listView, setListView] = useState(true);
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

  const byStatus =
    filter === "全部" ? BABY_ROOMS : BABY_ROOMS.filter((r) => r.status === filter);
  const rooms = q ? byStatus.filter((r) => rowMatchesQuery(r, q)) : byStatus;
  const totalPages = Math.max(1, Math.ceil(rooms.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pagedRooms = rooms.slice((safePage - 1) * pageSize, safePage * pageSize);

  /** 視窗標題與工作列標籤：房號＋寶寶姓名（功能名稱已由頁籤本身表達） */
  function findRecord(caseId: string) {
    return BABY_ROOMS.find((record) => (record.caseId ?? record.room) === caseId);
  }

  function recordIdentifier(record: BabyRoom) {
    return record.boarding ? `車號 ${record.carNo}` : `房號 ${record.room}`;
  }

  function windowLabel(caseId: string) {
    const record = findRecord(caseId);
    return record ? `${recordIdentifier(record)}｜${record.babyName ?? "空房"}` : caseId;
  }

  function openBabyRecord(record: BabyRoom) {
    openWindow(recordIdentifier(record), DEFAULT_TAB, record.caseId ?? record.room);
  }

  return (
    <div className="w-full px-4 py-3 sm:px-6 sm:py-4">
      <RequireAccess moduleNo="3">
      <PageHeader
        title="3. 寶寶照護（嬰兒室房卡）"
        moduleNo="3"
        action={
          <div className="flex flex-wrap gap-1">
            {STATUS_FILTERS.map((s) => (
              <button
                key={s}
                title={`只顯示狀態為「${s}」的寶寶房卡`}
                onClick={() => {
                  setFilter(s);
                  setPage(1);
                }}
                className={
                  "rounded-full px-3 py-1 text-xs " +
                  (filter === s ? "bg-sky-500 text-white" : "bg-stone-100 text-stone-600")
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
        <Badge color="blue">男寶寶</Badge>
        <Badge color="rose">女寶寶</Badge>
        <Badge color="purple">親子同室</Badge>
        <Badge color="amber">隔離</Badge>
        <span className="ml-auto flex items-center gap-2">
          作業頁籤：<span className="text-sky-600">藍色＝8大核心功能</span>
          <Switch checked={showSecondary} onChange={setShowSecondary} label="顯示次要功能" />
          <Switch checked={listView} onChange={setListView} label="清單檢視" />
        </span>
      </div>

      <p className="mb-4 rounded-lg bg-sky-50 px-3 py-2 text-xs text-sky-600">
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
        placeholder="搜尋房號/車號/寶寶姓名/病歷號（支援模糊搜尋）"
        resultCount={rooms.length}
        accent="sky"
      />

      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 text-xs text-violet-800">
        <span className="font-medium">托嬰個案不顯示房號，改以專屬車號識別。</span>
        <button type="button" onClick={() => { setFilter("托嬰"); setPage(1); }} className="rounded-full bg-violet-600 px-3 py-1.5 text-white">
          查看 {BOARDING_BABIES.length} 位托嬰寶寶
        </button>
      </div>

      {listView ? (
        <>
          <div className="care-list-table md:hidden lg:block">
            <BabyRoomListView rooms={pagedRooms} onOpen={openBabyRecord} />
          </div>
          <div className="care-list-cards hidden grid-cols-2 gap-4 md:grid lg:hidden">
            {pagedRooms.map((r) => (
              <BabyRoomCard key={r.caseId ?? r.room} room={r} onOpen={openBabyRecord} />
            ))}
          </div>
        </>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {pagedRooms.map((r) => (
            <BabyRoomCard
              key={r.caseId ?? r.room}
              room={r}
              onOpen={openBabyRecord}
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
          <BabyCarePanel
            room={w.room}
            caseLabel={(() => {
              const record = findRecord(w.caseId);
              return record ? `${recordIdentifier(record)}｜${record.babyName}｜病歷號 ${record.chartNo}` : undefined;
            })()}
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
