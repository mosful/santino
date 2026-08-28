"use client";

import { useState } from "react";
import OpsRoomCard from "@/components/room/OpsRoomCard";
import Modal from "@/components/ui/Modal";
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
  const keyLabel = OPS_QUICK_KEYS.find((k) => k.key === open?.key)?.label ?? "";

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
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-lg font-bold">4. 房間動態（房務版房卡）</h1>
        <div className="flex gap-2 text-xs">
          <button className="rounded bg-slate-100 px-3 py-1.5">手機驗證碼</button>
          <button className="rounded bg-slate-100 px-3 py-1.5">加值服務總表</button>
          <button className="rounded bg-slate-100 px-3 py-1.5">本月壽星</button>
        </div>
      </div>

      <p className="mb-4 text-xs text-slate-400">
        與2.媽媽照護共用房號，但欄位與快捷鍵為獨立元件（房務 vs 護理）。
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {OPS_ROOMS.map((r) => (
          <OpsRoomCard key={r.room} room={r} onKeyClick={(room, key) => setOpen({ room, key })} />
        ))}
      </div>

      <div className="mt-6 rounded border border-dashed border-slate-300 p-3 text-xs text-slate-400">
        以下項目本階段不做，僅保留擴充彈性：{DEFERRED_ROOM_ITEMS.join("、")}
      </div>

      <Modal open={!!open} title={`${open?.room ?? ""}｜${keyLabel}`} onClose={() => setOpen(null)} wide>
        {renderForm()}
      </Modal>
    </div>
  );
}
