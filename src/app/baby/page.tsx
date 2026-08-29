"use client";

import { useState } from "react";
import PageHeader from "@/components/ui/PageHeader";
import RequireAccess from "@/components/ui/RequireAccess";
import BabyRoomCard from "@/components/baby/BabyRoomCard";
import FloatingWindow from "@/components/ui/FloatingWindow";
import PlaceholderNotice from "@/components/ui/PlaceholderNotice";
import Badge from "@/components/ui/Badge";
import Switch from "@/components/ui/Switch";
import Pagination from "@/components/ui/Pagination";
import { rowMatchesQuery } from "@/lib/fuzzySearch";
import { useMultiWindowManager } from "@/lib/useMultiWindowManager";
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
  const [showSecondary, setShowSecondary] = useState(false);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const { windows, openWindow, closeWindow, bringToFront, blockedMsg } = useMultiWindowManager();

  const byStatus =
    filter === "全部" ? BABY_ROOMS : BABY_ROOMS.filter((r) => r.status === filter);
  const rooms = q ? byStatus.filter((r) => rowMatchesQuery(r, q)) : byStatus;
  const totalPages = Math.max(1, Math.ceil(rooms.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pagedRooms = rooms.slice((safePage - 1) * pageSize, safePage * pageSize);

  function renderForm(room: string, key: string) {
    switch (key) {
      case "admission":
        return <BabyAdmission room={room} />;
      case "record":
        return <BabyRecord room={room} />;
      case "daily":
        return <BabyDaily room={room} />;
      case "feeding":
        return <FeedingAssessment room={room} />;
      case "growth":
        return <GrowthDiary room={room} />;
      case "photo":
        return <BabyPhoto room={room} />;
      case "io":
        return <BabyIO room={room} />;
      case "guidance":
        return <BabyGuidance room={room} />;
      default:
        return (
          <PlaceholderNotice text="次要功能（非寶寶照護8大核心），畫面待後續批次補齊。" />
        );
    }
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
          房卡快捷鍵：<span className="text-sky-600">藍色＝8大核心功能</span>
          <Switch checked={showSecondary} onChange={setShowSecondary} label="顯示次要功能" />
        </span>
      </div>

      <p className="mb-4 rounded-lg bg-sky-50 px-3 py-2 text-xs text-sky-600">
        💡 可同時開啟多個房卡表單視窗（拖曳標題列移動位置），供同時填寫多筆紀錄；含簽名步驟的表單會鎖定僅能操作單一房間。
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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {pagedRooms.map((r) => (
          <BabyRoomCard
            key={r.room}
            room={r}
            onKeyClick={(room, key) => {
              const qk = BABY_QUICK_KEYS.find((k) => k.key === key);
              openWindow(room, key, !!qk?.hasSignature);
            }}
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

      {blockedMsg && (
        <div className="fixed bottom-4 left-1/2 z-[60] -translate-x-1/2 rounded-lg bg-stone-900 px-4 py-2.5 text-xs text-white shadow-lg">
          {blockedMsg}
        </div>
      )}

      {windows.map((w) => {
        const keyLabel = BABY_QUICK_KEYS.find((k) => k.key === w.key)?.label ?? "";
        return (
          <FloatingWindow
            key={w.id}
            title={`${w.room}｜${keyLabel}`}
            onClose={() => closeWindow(w.id)}
            onFocus={() => bringToFront(w.id)}
            zIndex={w.z}
            initialPos={{ x: w.x, y: w.y }}
            wide
          >
            {renderForm(w.room, w.key)}
          </FloatingWindow>
        );
      })}
      </RequireAccess>
    </div>
  );
}
