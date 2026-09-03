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
import { rowMatchesQuery } from "@/lib/fuzzySearch";
import { useMultiWindowManager } from "@/lib/useMultiWindowManager";
import { BABY_ROOMS } from "@/lib/mock/babyRoom";

const STATUS_FILTERS = ["全部", "入住", "隔離", "親子同室", "視訊"] as const;

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
  function windowLabel(roomNo: string) {
    const name = BABY_ROOMS.find((r) => r.room === roomNo)?.babyName;
    return name ? `${roomNo}｜${name}` : roomNo;
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
        💡 每間房開啟一個作業視窗，視窗內以頁籤切換各項紀錄；可同時開啟多間房比對（拖曳標題列移動、右下角可縮放）。切換到含簽名步驟的頁籤（✍）時，會鎖定僅能操作單一房間。
      </p>

      <input
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setPage(1);
        }}
        placeholder="搜尋房號/寶寶姓名/病歷號（支援模糊搜尋）"
        className="mb-4 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm sm:w-72"
      />

      {listView ? (
        <BabyRoomListView rooms={pagedRooms} onOpen={(room) => openWindow(room, DEFAULT_TAB)} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {pagedRooms.map((r) => (
            <BabyRoomCard
              key={r.room}
              room={r}
              onOpen={(room) => openWindow(room, DEFAULT_TAB)}
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
          title={windowLabel(w.room)}
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
            showSecondary={showSecondary}
            activeKey={w.activeKey}
            onTabSelect={(t) => selectTab(w.id, t.key, !!t.hasSignature)}
          />
        </FloatingWindow>
      ))}

      <WindowTray
        items={windows.map((w) => ({
          id: w.id,
          label: windowLabel(w.room),
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
