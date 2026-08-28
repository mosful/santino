"use client";

import { useState } from "react";
import MamaRoomCard from "@/components/mama/MamaRoomCard";
import Modal from "@/components/ui/Modal";
import PlaceholderNotice from "@/components/ui/PlaceholderNotice";
import Badge from "@/components/ui/Badge";
import { MAMA_ROOMS } from "@/lib/mock/mamaRoom";
import { MAMA_QUICK_KEYS } from "@/lib/mamaQuickKeys";
import AdmissionAssessment from "@/components/mama/forms/AdmissionAssessment";
import OngoingCare from "@/components/mama/forms/OngoingCare";
import PaperScoreForm from "@/components/mama/forms/PaperScoreForm";
import NursingGuidance from "@/components/mama/forms/NursingGuidance";

const STATUS_FILTERS = ["全部", "入住", "空房", "打掃", "報修"] as const;

export default function MamaPage() {
  const [filter, setFilter] = useState<(typeof STATUS_FILTERS)[number]>("全部");
  const [open, setOpen] = useState<{ room: string; key: string } | null>(null);

  const rooms =
    filter === "全部" ? MAMA_ROOMS : MAMA_ROOMS.filter((r) => r.status === filter);

  const keyLabel = MAMA_QUICK_KEYS.find((k) => k.key === open?.key)?.label ?? "";

  function renderForm() {
    if (!open) return null;
    switch (open.key) {
      case "admission":
        return <AdmissionAssessment room={open.room} />;
      case "ongoing":
      case "record":
        return <OngoingCare room={open.room} />;
      case "social":
        return <PaperScoreForm room={open.room} title="社會支持" />;
      case "mood":
        return <PaperScoreForm room={open.room} title="心情量表" />;
      case "guidance":
        return <NursingGuidance room={open.room} />;
      default:
        return (
          <PlaceholderNotice text="次要功能（非媽媽照護6大核心），畫面待後續批次補齊，目前僅可從房卡開啟本提示。" />
        );
    }
  }

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-lg font-bold">2. 媽媽照護（護理版房卡）</h1>
        <div className="flex flex-wrap gap-1">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={
                "rounded-full px-3 py-1 text-xs " +
                (filter === s ? "bg-rose-500 text-white" : "bg-slate-100 text-slate-600")
              }
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-3 text-xs text-slate-500">
        <span>圖例：</span>
        <Badge color="slate">空房(白)</Badge>
        <Badge color="green">入住(綠)</Badge>
        <Badge color="rose">親子同室(粉)</Badge>
        <Badge color="amber">打掃(黃)</Badge>
        <Badge color="blue">報修(藍)</Badge>
        <span className="ml-auto">
          房卡快捷鍵：<span className="text-rose-600">紅色＝6大核心功能</span>，灰色為次要功能
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rooms.map((r) => (
          <MamaRoomCard
            key={r.room}
            room={r}
            onKeyClick={(room, key) => setOpen({ room, key })}
          />
        ))}
      </div>

      <Modal
        open={!!open}
        title={`${open?.room ?? ""}｜${keyLabel}`}
        onClose={() => setOpen(null)}
        wide
      >
        {renderForm()}
      </Modal>
    </div>
  );
}
