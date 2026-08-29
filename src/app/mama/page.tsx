"use client";

import { useState } from "react";
import PageHeader from "@/components/ui/PageHeader";
import RequireAccess from "@/components/ui/RequireAccess";
import MamaRoomCard from "@/components/mama/MamaRoomCard";
import Modal from "@/components/ui/Modal";
import PlaceholderNotice from "@/components/ui/PlaceholderNotice";
import Badge from "@/components/ui/Badge";
import Switch from "@/components/ui/Switch";
import Pagination from "@/components/ui/Pagination";
import { rowMatchesQuery } from "@/lib/fuzzySearch";
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
  const [showSecondary, setShowSecondary] = useState(false);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const byStatus =
    filter === "全部" ? MAMA_ROOMS : MAMA_ROOMS.filter((r) => r.status === filter);
  const rooms = q ? byStatus.filter((r) => rowMatchesQuery(r, q)) : byStatus;
  const totalPages = Math.max(1, Math.ceil(rooms.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pagedRooms = rooms.slice((safePage - 1) * pageSize, safePage * pageSize);

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
      case "health-edu-eval":
        return (
          <PlaceholderNotice text="衛教認知評估單：衛教師新增項目，實際欄位內容尚未與客戶確認，先保留版位，待補充後再設計表單（見規格文件8.2節待確認事項）。" />
        );
      default:
        return (
          <PlaceholderNotice text="次要功能（非媽媽照護6大核心），畫面待後續批次補齊，目前僅可從房卡開啟本提示。" />
        );
    }
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
          房卡快捷鍵：<span className="text-rose-600">紅色＝6大核心功能</span>
          <Switch checked={showSecondary} onChange={setShowSecondary} label="顯示次要功能" />
        </span>
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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {pagedRooms.map((r) => (
          <MamaRoomCard
            key={r.room}
            room={r}
            onKeyClick={(room, key) => setOpen({ room, key })}
            showSecondary={showSecondary}
          />
        ))}
      </div>

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

      <Modal
        open={!!open}
        title={`${open?.room ?? ""}｜${keyLabel}`}
        onClose={() => setOpen(null)}
        wide
      >
        {renderForm()}
      </Modal>
      </RequireAccess>
    </div>
  );
}
