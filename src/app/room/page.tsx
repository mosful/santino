"use client";

import { useState } from "react";
import PageHeader from "@/components/ui/PageHeader";
import RequireAccess from "@/components/ui/RequireAccess";
import OpsRoomCard from "@/components/room/OpsRoomCard";
import OpsRoomListView from "@/components/room/OpsRoomListView";
import Modal from "@/components/ui/Modal";
import Switch from "@/components/ui/Switch";
import Pagination from "@/components/ui/Pagination";
import { rowMatchesQuery } from "@/lib/fuzzySearch";
import { OPS_ROOMS, DEFERRED_ROOM_ITEMS } from "@/lib/mock/opsRoom";
import { OPS_QUICK_KEYS } from "@/lib/opsQuickKeys";
import {
  Prep,
  ExtendChangeRoom,
  MotherOuting,
  Complaint,
  VisitorInfo,
  CompanionInfo,
  BabyVideoForm,
  IdPhoto,
} from "@/components/room/forms/OpsForms";

export default function RoomPage() {
  const [open, setOpen] = useState<{ room: string; key: string } | null>(null);
  const [listView, setListView] = useState(true);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const keyLabel = OPS_QUICK_KEYS.find((k) => k.key === open?.key)?.label ?? "";

  const filteredRooms = q ? OPS_ROOMS.filter((r) => rowMatchesQuery(r, q)) : OPS_ROOMS;
  const totalPages = Math.max(1, Math.ceil(filteredRooms.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pagedRooms = filteredRooms.slice((safePage - 1) * pageSize, safePage * pageSize);

  function renderForm() {
    if (!open) return null;
    switch (open.key) {
      case "prep":
        return <Prep room={open.room} />;
      case "extend":
        return <ExtendChangeRoom room={open.room} />;
      case "outing":
        return <MotherOuting room={open.room} />;
      case "complaint":
        return <Complaint room={open.room} />;
      case "visitor":
        return <VisitorInfo room={open.room} />;
      case "companion":
        return <CompanionInfo room={open.room} />;
      case "baby-video":
        return <BabyVideoForm room={open.room} />;
      case "id-photo":
        return <IdPhoto room={open.room} />;
      default:
        return null;
    }
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
        <p className="flex-1">與2.媽媽照護共用房號，但欄位與快捷鍵為獨立元件（房務 vs 護理）。</p>
        <Switch checked={listView} onChange={setListView} label="清單檢視" />
      </div>

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
        <OpsRoomListView rooms={pagedRooms} onKeyClick={(room, key) => setOpen({ room, key })} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {pagedRooms.map((r) => (
            <OpsRoomCard key={r.room} room={r} onKeyClick={(room, key) => setOpen({ room, key })} />
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

      <Modal open={!!open} title={`${open?.room ?? ""}｜${keyLabel}`} onClose={() => setOpen(null)} wide>
        {renderForm()}
      </Modal>
      </RequireAccess>
    </div>
  );
}
