"use client";

import Tabs from "@/components/ui/Tabs";
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

/**
 * 房務作業（原「4. 房況與排房」的房卡彈出視窗）。
 * 依 v24 規格 §4.4「各階段表單直接內嵌」，改為案件流程「入住中」階段裡的全頁頁籤，
 * 不再另開浮動視窗；房號由案件帶入，不需再選一次房。
 */
export default function RoomServicePanel({ room }: { room: string }) {
  if (!room) {
    return (
      <p className="rounded-xl border border-dashed border-stone-300 p-4 text-sm text-stone-500">
        尚未排房，排定房號後即可使用房務作業。
      </p>
    );
  }

  return (
    <section className="space-y-3 rounded-xl border border-border-subtle bg-surface-raised p-4" aria-label="房務作業">
      <div>
        <h3 className="font-semibold">房務作業（房 {room}）</h3>
        <p className="mt-1 text-sm text-stone-500">
          入住準備、換房、外出、客訴、訪客與陪宿等房務表單；與護理紀錄分開，欄位互不共用。
        </p>
      </div>
      <Tabs
        tabs={[
          { key: "prep", label: "入住準備", content: <Prep room={room} /> },
          { key: "extend", label: "延長提前換房", content: <ExtendChangeRoom room={room} /> },
          { key: "outing", label: "媽媽外出", content: <MotherOuting room={room} /> },
          { key: "complaint", label: "媽媽客訴", content: <Complaint room={room} /> },
          { key: "visitor", label: "訪客資料", content: <VisitorInfo room={room} /> },
          { key: "companion", label: "陪宿者資料", content: <CompanionInfo room={room} /> },
          { key: "baby-video", label: "寶寶視訊單", content: <BabyVideoForm room={room} /> },
          { key: "id-photo", label: "證件照片", content: <IdPhoto room={room} /> },
        ]}
      />
    </section>
  );
}
