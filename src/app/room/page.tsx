"use client";

import { useState } from "react";
import PageHeader from "@/components/ui/PageHeader";
import RequireAccess from "@/components/ui/RequireAccess";
import OpsRoomCard from "@/components/room/OpsRoomCard";
import OpsRoomListView from "@/components/room/OpsRoomListView";
import OpsCarePanel from "@/components/room/OpsCarePanel";
import FloatingWindow from "@/components/ui/FloatingWindow";
import WindowTray from "@/components/ui/WindowTray";
import Switch from "@/components/ui/Switch";
import Pagination from "@/components/ui/Pagination";
import { rowMatchesQuery } from "@/lib/fuzzySearch";
import { useMultiWindowManager } from "@/lib/useMultiWindowManager";
import { OPS_ROOMS, DEFERRED_ROOM_ITEMS } from "@/lib/mock/opsRoom";

// 開啟作業視窗時的預設頁籤
const DEFAULT_TAB = "prep";

export default function RoomPage() {
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

  const filteredRooms = q ? OPS_ROOMS.filter((r) => rowMatchesQuery(r, q)) : OPS_ROOMS;
  const totalPages = Math.max(1, Math.ceil(filteredRooms.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pagedRooms = filteredRooms.slice((safePage - 1) * pageSize, safePage * pageSize);

  /** 視窗標題與工作列標籤：房號＋孕媽姓名（功能名稱已由頁籤本身表達） */
  function windowLabel(roomNo: string) {
    const name = OPS_ROOMS.find((r) => r.room === roomNo)?.motherName;
    return name ? `${roomNo}｜${name}` : roomNo;
  }

  return (
    <div className="w-full px-4 py-3 sm:px-6 sm:py-4">
      <RequireAccess moduleNo="4">
      <PageHeader
        title="4. 房間動態（房務版房卡）"
        moduleNo="4"
        action={
          <div className="flex gap-2 text-xs">
            <button className="rounded bg-stone-100 px-3 py-1.5">手機驗證碼</button>
            <button className="rounded bg-stone-100 px-3 py-1.5">加值服務總表</button>
            <button className="rounded bg-stone-100 px-3 py-1.5">本月壽星</button>
          </div>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3 text-xs text-stone-400">
        <p className="flex-1">與2.媽媽照護共用房號，但欄位與作業頁籤為獨立元件（房務 vs 護理）。</p>
        <Switch checked={listView} onChange={setListView} label="清單檢視" />
      </div>

      <p className="mb-4 rounded-lg bg-teal-50 px-3 py-2 text-xs text-teal-700">
        💡 每間房開啟一個房務作業視窗，視窗內以頁籤切換 8 項房務作業；可同時開啟多間房比對（拖曳標題列移動、右下角可縮放）。
      </p>

      <input
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setPage(1);
        }}
        placeholder="搜尋房號/媽媽姓名/病歷號（支援模糊搜尋）"
        className="mb-4 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm sm:w-72"
      />

      {listView ? (
        <OpsRoomListView rooms={pagedRooms} onOpen={(room) => openWindow(room, DEFAULT_TAB)} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {pagedRooms.map((r) => (
            <OpsRoomCard key={r.room} room={r} onOpen={(room) => openWindow(room, DEFAULT_TAB)} />
          ))}
        </div>
      )}

      <div className="mt-4">
        <Pagination
          page={safePage}
          pageSize={pageSize}
          total={filteredRooms.length}
          onPageChange={setPage}
          onPageSizeChange={(n) => {
            setPageSize(n);
            setPage(1);
          }}
        />
      </div>

      <div className="mt-6 rounded border border-dashed border-stone-300 p-3 text-xs text-stone-400">
        以下項目本階段不做，僅保留擴充彈性：{DEFERRED_ROOM_ITEMS.join("、")}
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
          <OpsCarePanel
            room={w.room}
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
