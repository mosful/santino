"use client";

import { useState } from "react";
import PageHeader from "@/components/ui/PageHeader";
import BabyRoomCard from "@/components/baby/BabyRoomCard";
import Modal from "@/components/ui/Modal";
import PlaceholderNotice from "@/components/ui/PlaceholderNotice";
import Badge from "@/components/ui/Badge";
import { BABY_ROOMS } from "@/lib/mock/babyRoom";
import { BABY_QUICK_KEYS } from "@/lib/babyQuickKeys";
import {
  BabyAdmission,
  BabyRecord,
  BabyDaily,
  FeedingAssessment,
  GrowthDiary,
  BabyPhoto,
  BabyIO,
  BabyGuidance,
} from "@/components/baby/forms/BabyForms";

const STATUS_FILTERS = ["全部", "入住", "隔離", "親子同室", "視訊"] as const;

export default function BabyPage() {
  const [filter, setFilter] = useState<(typeof STATUS_FILTERS)[number]>("全部");
  const [open, setOpen] = useState<{ room: string; key: string } | null>(null);

  const rooms =
    filter === "全部" ? BABY_ROOMS : BABY_ROOMS.filter((r) => r.status === filter);

  const keyLabel = BABY_QUICK_KEYS.find((k) => k.key === open?.key)?.label ?? "";

  function renderForm() {
    if (!open) return null;
    switch (open.key) {
      case "admission":
        return <BabyAdmission room={open.room} />;
      case "record":
        return <BabyRecord room={open.room} />;
      case "daily":
        return <BabyDaily room={open.room} />;
      case "feeding":
        return <FeedingAssessment room={open.room} />;
      case "growth":
        return <GrowthDiary room={open.room} />;
      case "photo":
        return <BabyPhoto room={open.room} />;
      case "io":
        return <BabyIO room={open.room} />;
      case "guidance":
        return <BabyGuidance room={open.room} />;
      default:
        return (
          <PlaceholderNotice text="次要功能（非寶寶照護8大核心），畫面待後續批次補齊。" />
        );
    }
  }

  return (
    <div className="w-full px-4 py-3 sm:px-6 sm:py-4">
      <PageHeader
        title="3. 寶寶照護（嬰兒室房卡）"
        action={
          <div className="flex flex-wrap gap-1">
            {STATUS_FILTERS.map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
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
        <span className="ml-auto">
          房卡快捷鍵：<span className="text-sky-600">藍色＝8大核心功能</span>，灰色為次要功能
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {rooms.map((r) => (
          <BabyRoomCard key={r.room} room={r} onKeyClick={(room, key) => setOpen({ room, key })} />
        ))}
      </div>

      <Modal open={!!open} title={`${open?.room ?? ""}｜${keyLabel}`} onClose={() => setOpen(null)} wide>
        {renderForm()}
      </Modal>
    </div>
  );
}
