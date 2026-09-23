"use client";

import { useEffect, useState } from "react";
import { LogOut, Clock, CalendarX } from "lucide-react";
import Tabs from "@/components/ui/Tabs";
import CamPreview from "@/components/babycam/CamPreview";
import ViewLoginCard from "@/components/babycam/ViewLoginCard";
import {
  BINDINGS,
  CAMERA_BY_ID,
  STATUS_BY_KEY,
  DEMO_ACCOUNTS,
  DEMO_LOGIN,
  type Binding,
} from "@/lib/mock/babycam";

type Session = { binding: Binding; phone: string };

function toMinutes(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function inOpenWindow(nowMin: number, from: string, to: string) {
  const f = toMinutes(from);
  const t = toMinutes(to);
  return f <= t ? nowMin >= f && nowMin < t : nowMin >= f || nowMin < t;
}

function untilText(nowMin: number, from: string) {
  let diff = toMinutes(from) - nowMin;
  if (diff < 0) diff += 24 * 60;
  const h = Math.floor(diff / 60);
  const m = diff % 60;
  return h > 0 ? `${h} 小時 ${m} 分` : `${m} 分`;
}

export default function FamilyViewPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [nowMin, setNowMin] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setNowMin(d.getHours() * 60 + d.getMinutes());
    };
    tick();
    const timer = window.setInterval(tick, 30000);
    return () => window.clearInterval(timer);
  }, []);

  if (!session) {
    return (
      <ViewLoginCard
        title="寶寶影像（親友觀看）"
        subtitle="聖帝諾產後護理之家 · 限已登錄之親友"
        demoHint="靜態畫面稿：手機號碼須由櫃台事先登錄於白名單，未登錄者即使密碼正確也無法觀看。親友端一律只顯示截圖。"
        accounts={DEMO_ACCOUNTS.family}
        onSubmit={(phone, code) => {
          const hit = BINDINGS.find((b) => b.familyCode === code);
          if (!hit) return "密碼有誤，請確認資訊卡上的資訊";
          if (!hit.familyWhitelist.includes(phone)) {
            return "此手機號碼未經院方登錄，請聯繫媽媽或櫃台將您加入可觀看名單";
          }
          setSession({ binding: hit, phone });
          return null;
        }}
      />
    );
  }

  const { binding, phone } = session;
  const status = STATUS_BY_KEY[binding.statusKey];
  const expired = binding.room === DEMO_LOGIN.expiredRoom;
  const open = nowMin === null ? null : inOpenWindow(nowMin, binding.openFrom, binding.openTo);

  function renderCam(camId: string, label: string) {
    const cam = CAMERA_BY_ID[camId];

    if (expired) {
      return (
        <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-xl border border-stone-200 bg-stone-50 text-stone-500">
          <CalendarX className="h-8 w-8 text-stone-300" />
          <p className="text-sm font-medium">觀看期限已結束</p>
          <p className="text-xs text-stone-400">
            有效期限 {binding.validFrom} ～ {binding.validTo}
          </p>
        </div>
      );
    }
    if (open === null) {
      return <div className="aspect-video w-full animate-pulse rounded-xl bg-stone-200" />;
    }
    if (!open) {
      return (
        <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-xl border border-stone-200 bg-stone-50 text-stone-500">
          <Clock className="h-8 w-8 text-stone-300" />
          <p className="text-sm font-medium">目前非開放時段</p>
          <p className="text-xs text-stone-400">
            距離下次開放（{binding.openFrom}）還有 {untilText(nowMin!, binding.openFrom)}
          </p>
        </div>
      );
    }
    return (
      <CamPreview
        mode={status?.masked ? "masked" : "snapshot"}
        room={binding.room}
        camCode={cam?.code ?? label}
        statusLabel={status?.label}
        watermark={`${binding.room} · ${phone.slice(-3)}`}
        // 截圖逾時的監視器改顯示最後一張可用截圖，並標示時間差
        capturedAgo={!status?.masked && cam?.abnormal ? "5 小時前" : undefined}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-stone-800">
            {binding.room} 房 · {binding.motherName} 媽咪的寶寶
          </h1>
          <p className="text-xs text-stone-400">
            開放時段 {binding.openFrom}–{binding.openTo}　|　期限至 {binding.validTo}
          </p>
        </div>
        <button
          onClick={() => setSession(null)}
          className="flex items-center gap-1 rounded-lg border border-stone-200 px-2.5 py-1.5 text-xs text-stone-500 hover:bg-stone-50"
        >
          <LogOut className="h-3.5 w-3.5" />
          登出
        </button>
      </div>

      {binding.camIds.length > 1 ? (
        <Tabs
          tabs={binding.camIds.map((id, i) => ({
            key: id,
            label: `寶寶 ${i + 1}`,
            content: renderCam(id, `寶寶 ${i + 1}`),
          }))}
        />
      ) : (
        renderCam(binding.camIds[0], "寶寶")
      )}

      <div className="rounded-lg bg-stone-50 p-3 text-xs leading-relaxed text-stone-500">
        <p>親友端僅顯示截圖，不提供即時影像。</p>
        <p className="mt-1.5 text-stone-400">
          畫面上的浮水印含房號與您的手機末三碼。請勿翻拍或轉傳，影像外流可追溯來源。
        </p>
      </div>
    </div>
  );
}
