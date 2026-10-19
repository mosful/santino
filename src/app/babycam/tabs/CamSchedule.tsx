"use client";

import { useState } from "react";
import { Clock, CalendarRange, EyeOff } from "lucide-react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Switch from "@/components/ui/Switch";
import PlaceholderNotice from "@/components/ui/PlaceholderNotice";
import CamPreview from "@/components/babycam/CamPreview";
import { useLegacyBabycam } from "@/lib/babycam/legacyAdapter";
import { babycamActions } from "@/lib/babycam/actions";
import { domainStore } from "@/lib/demo/domainStore";

export default function CamSchedule() {
  const { BINDINGS, CAM_STATUSES, STATUS_BY_KEY, CAMERA_BY_ID } = useLegacyBabycam();
  const [roomIdx, setRoomIdx] = useState(0);
  const target = BINDINGS[roomIdx];
  const source = target && domainStore.get().bindings.find((binding) => binding.id === target.id);
  const [draft, setDraft] = useState<{ id: string; statusKey: string; openFrom: string; openTo: string; familyEnabled: boolean } | null>(null);
  const current = draft?.id === target?.id ? draft : { id: target?.id ?? "", statusKey: target?.statusKey ?? "normal", openFrom: source?.internalWindow.start ?? "10:00", openTo: source?.internalWindow.end ?? "22:00", familyEnabled: source?.familyEnabled ?? false };
  const { statusKey, openFrom, openTo, familyEnabled } = current;
  const setStatusKey = (value: string) => setDraft({ ...current, statusKey: value });
  const setOpenFrom = (value: string) => setDraft({ ...current, openFrom: value });
  const setOpenTo = (value: string) => setDraft({ ...current, openTo: value });
  const setFamilyEnabled = (value: boolean) => setDraft({ ...current, familyEnabled: value });
  const [feedback, setFeedback] = useState("");
  const status = STATUS_BY_KEY[statusKey]; const overnight = openTo < openFrom;
  function switchRoom(idx: number) { setRoomIdx(idx); setDraft(null); setFeedback(""); }
  if (!target) return null;

  return (
    <div className="space-y-4">
      <PlaceholderNotice text="設定監視器開放時段、對外有效期限與目前狀態。除「正常顯示」外，其餘狀態一律自動遮蔽畫面；本機操作介面會驗證權限與資料規則，所有入口共用相同設定。" />

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
              期限承接案件入住及托嬰，可由完整工作區調整。期限外即使密碼正確也無法觀看。
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
                      ? "bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-sm"
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
            <button
              type="button"
              onClick={() => {
                try {
                  babycamActions.updateBinding(target.id, { familyEnabled, internalWindow: { mode: "scheduled", start: openFrom, end: openTo }, familyWindow: { mode: "scheduled", start: openFrom, end: openTo } });
                  const binding = domainStore.get().bindings.find((item) => item.id === target.id);
                  binding?.babies.forEach((baby) => babycamActions.state(target.id, baby.babyId, statusKey));
                  setFeedback("已儲存，觀看端與工作區已同步。");
                } catch (error) { setFeedback(error instanceof Error ? error.message : "儲存失敗。"); }
              }}
              className="rounded-lg bg-gradient-to-r from-brand-500 to-brand-400 px-5 py-2.5 text-sm font-semibold text-white shadow-sm"
            >
              儲存設定
            </button>
            {feedback && <p role="status" className="mt-2 text-xs text-stone-600">{feedback}</p>}
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
            此區只預覽顯示狀態；觀看端另套用授權、時段、照護與裝置狀態。
          </p>
        </div>
      </div>
    </div>
  );
}
