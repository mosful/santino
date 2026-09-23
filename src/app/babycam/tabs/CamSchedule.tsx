"use client";

import { useState } from "react";
import { Clock, CalendarRange, EyeOff } from "lucide-react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Switch from "@/components/ui/Switch";
import PlaceholderNotice from "@/components/ui/PlaceholderNotice";
import DemoActionButton from "@/components/ui/DemoActionButton";
import CamPreview from "@/components/babycam/CamPreview";
import { BINDINGS, CAM_STATUSES, STATUS_BY_KEY, CAMERA_BY_ID } from "@/lib/mock/babycam";

export default function CamSchedule() {
  const [roomIdx, setRoomIdx] = useState(0);
  const target = BINDINGS[roomIdx];
  const [statusKey, setStatusKey] = useState(target?.statusKey ?? "normal");
  const [openFrom, setOpenFrom] = useState(target?.openFrom ?? "09:00");
  const [openTo, setOpenTo] = useState(target?.openTo ?? "21:00");
  const [familyEnabled, setFamilyEnabled] = useState(true);

  const status = STATUS_BY_KEY[statusKey];
  const overnight = openTo < openFrom;

  function switchRoom(idx: number) {
    setRoomIdx(idx);
    const b = BINDINGS[idx];
    setStatusKey(b.statusKey);
    setOpenFrom(b.openFrom);
    setOpenTo(b.openTo);
  }

  if (!target) return null;

  return (
    <div className="space-y-4">
      <PlaceholderNotice text="設定監視器開放時段、對外有效期限與目前狀態。除「正常顯示」外，其餘狀態一律自動遮蔽畫面；伺服器端每次請求都會重新檢查這三項條件，不信任前端。" />

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-stone-500">選擇房號</span>
        <select
          value={roomIdx}
          onChange={(e) => switchRoom(Number(e.target.value))}
          className="rounded-lg border border-stone-200 px-3 py-1.5 text-sm"
        >
          {BINDINGS.map((b, i) => (
            <option key={b.id} value={i}>
              {b.room} 房 — {b.motherName}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <Card title="開放時段">
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className="mb-1 block text-xs text-stone-500">開始</label>
                <input
                  type="time"
                  value={openFrom}
                  onChange={(e) => setOpenFrom(e.target.value)}
                  className="rounded-lg border border-stone-200 px-3 py-2 text-sm"
                />
              </div>
              <span className="pb-2.5 text-stone-400">～</span>
              <div>
                <label className="mb-1 block text-xs text-stone-500">結束</label>
                <input
                  type="time"
                  value={openTo}
                  onChange={(e) => setOpenTo(e.target.value)}
                  className="rounded-lg border border-stone-200 px-3 py-2 text-sm"
                />
              </div>
              {overnight && (
                <div className="pb-2.5">
                  <Badge color="amber">跨夜時段</Badge>
                </div>
              )}
            </div>
            <p className="mt-2 flex items-center gap-1.5 text-xs text-stone-400">
              <Clock className="h-3.5 w-3.5" />
              結束時間小於開始時間即視為跨夜（例如 20:00～02:00）。
            </p>
          </Card>

          <Card title="對外有效期限">
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <CalendarRange className="h-4 w-4 text-stone-400" />
              <span className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-2">
                {target.validFrom} ～ {target.validTo}
              </span>
              <Switch
                checked={familyEnabled}
                onChange={setFamilyEnabled}
                label="開放親友端觀看"
              />
            </div>
            <p className="mt-2 text-xs text-stone-400">
              有效期限不與合約連動，由櫃台在此直接設定。期限外即使密碼正確也無法觀看。
            </p>
          </Card>

          <Card title={`目前狀態（共 ${CAM_STATUSES.length} 種）`}>
            <div className="flex flex-wrap gap-2">
              {CAM_STATUSES.map((s) => (
                <button
                  key={s.key}
                  onClick={() => setStatusKey(s.key)}
                  className={
                    "rounded-full px-3 py-1.5 text-xs font-medium transition " +
                    (s.key === statusKey
                      ? "bg-gradient-to-r from-brand-500 to-brand-400 text-white shadow-sm"
                      : "bg-stone-100 text-stone-600 hover:bg-stone-200")
                  }
                >
                  {s.label}
                  {s.masked && <EyeOff className="ml-1 inline h-3 w-3" />}
                </button>
              ))}
            </div>
            <p className="mt-3 text-xs text-stone-400">
              標有眼睛圖示者為遮蔽狀態。只有「正常顯示」會送出影像，其餘一律顯示狀態名稱、不顯示畫面。
            </p>
          </Card>

          <div className="flex justify-end">
            <DemoActionButton
              feedback="靜態畫面稿：實際會寫入設定並於下一次同步推送到 DMZ"
              className="rounded-lg bg-gradient-to-r from-brand-500 to-brand-400 px-5 py-2.5 text-sm font-semibold text-white shadow-sm"
            >
              儲存設定
            </DemoActionButton>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-stone-500">即時預覽（依目前狀態）</p>
          <CamPreview
            mode={status?.masked ? "masked" : "live"}
            room={target.room}
            camCode={CAMERA_BY_ID[target.camIds[0]]?.code ?? ""}
            statusLabel={status?.label}
          />
          <p className="text-xs text-stone-400">
            此預覽即媽媽端與親友端實際會看到的畫面。
          </p>
        </div>
      </div>
    </div>
  );
}
