"use client";

import { useEffect, useState } from "react";
import { LogOut, Clock } from "lucide-react";
import Tabs from "@/components/ui/Tabs";
import CamPreview from "@/components/babycam/CamPreview";
import ViewLoginCard from "@/components/babycam/ViewLoginCard";
import {
  BINDINGS,
  CAMERA_BY_ID,
  STATUS_BY_KEY,
  DEMO_ACCOUNTS,
  type Binding,
} from "@/lib/mock/babycam";

/** "HH:mm" → 當日分鐘數 */
function toMinutes(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

/** 支援跨夜（結束時間小於開始時間） */
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

export default function MamaViewPage() {
  const [session, setSession] = useState<Binding | null>(null);
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
        title="寶寶即時影像"
        subtitle="聖帝諾產後護理之家 · 媽媽專用"
        demoHint="靜態畫面稿：無真實後端驗證，帳密比對的是假資料。實際上線時密碼為雜湊儲存，櫃台只能重設不能查看。"
        accounts={DEMO_ACCOUNTS.mama}
        onSubmit={(phone, code) => {
          const hit = BINDINGS.find((b) => b.mamaPhone === phone && b.mamaCode === code);
          if (!hit) return "手機號碼或密碼有誤，請確認寶寶視訊單上的資訊";
          setSession(hit);
          return null;
        }}
      />
    );
  }

  // 先解構成 const，否則巢狀的 renderCam 內會失去 session 的 null 收斂
  const active = session;
  const status = STATUS_BY_KEY[active.statusKey];
  const open = nowMin === null ? null : inOpenWindow(nowMin, active.openFrom, active.openTo);

  function renderCam(camId: string, label: string) {
    const cam = CAMERA_BY_ID[camId];
    if (open === null) {
      return <div className="aspect-video w-full animate-pulse rounded-xl bg-stone-200" />;
    }
    if (!open) {
      return (
        <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-xl border border-stone-200 bg-stone-50 text-stone-500">
          <Clock className="h-8 w-8 text-stone-300" />
          <p className="text-sm font-medium">目前非開放時段</p>
          <p className="text-xs text-stone-400">
            距離下次開放（{active.openFrom}）還有 {untilText(nowMin!, active.openFrom)}
          </p>
        </div>
      );
    }
    return (
      <CamPreview
        mode={status?.masked ? "masked" : "live"}
        room={active.room}
        camCode={cam?.code ?? label}
        statusLabel={status?.label}
        watermark={`${active.room} · ${active.mamaPhone.slice(-3)}`}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-stone-800">
            {session.room} 房 · {session.motherName} 媽咪
          </h1>
          <p className="text-xs text-stone-400">
            開放時段 {session.openFrom}–{session.openTo}
            {session.openTo < session.openFrom && "（跨夜）"}
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

      {session.camIds.length > 1 ? (
        <Tabs
          tabs={session.camIds.map((id, i) => ({
            key: id,
            label: `寶寶 ${i + 1}`,
            content: renderCam(id, `寶寶 ${i + 1}`),
          }))}
        />
      ) : (
        renderCam(session.camIds[0], "寶寶")
      )}

      <div className="rounded-lg bg-stone-50 p-3 text-xs leading-relaxed text-stone-500">
        <p>若寶寶不在專屬位置上，應是在媽媽房內，或正由護理人員護理中。</p>
        <p className="mt-1.5 text-stone-400">
          畫面約每 1 秒更新一次。院內即時影像僅供本人觀看，請勿轉傳畫面或將密碼提供給他人。
        </p>
      </div>
    </div>
  );
}
