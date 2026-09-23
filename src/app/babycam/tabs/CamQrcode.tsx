"use client";

import { useState } from "react";
import Badge from "@/components/ui/Badge";
import PlaceholderNotice from "@/components/ui/PlaceholderNotice";
import DemoActionButton from "@/components/ui/DemoActionButton";
import { BINDINGS, VIEW_URL } from "@/lib/mock/babycam";

export default function CamQrcode() {
  const [roomIdx, setRoomIdx] = useState(0);
  const target = BINDINGS[roomIdx];

  if (!target) return null;

  return (
    <div className="space-y-4">
      <PlaceholderNotice text="產生對內（媽媽）與對外（親友）兩張資訊卡。QRCode 內只放不帶敏感資訊的短網址與 Token，手機號碼不會明碼出現在網址中。版面沿用舊系統「寶寶視訊單」。" />

      <div className="flex flex-wrap items-center gap-2 print:hidden">
        <span className="text-xs font-medium text-stone-500">選擇房號</span>
        <select
          value={roomIdx}
          onChange={(e) => setRoomIdx(Number(e.target.value))}
          className="rounded-lg border border-stone-200 px-3 py-1.5 text-sm"
        >
          {BINDINGS.map((b, i) => (
            <option key={b.id} value={i}>
              {b.room} 房 — {b.motherName}
            </option>
          ))}
        </select>

        <div className="ml-auto flex gap-2">
          <DemoActionButton
            feedback="靜態畫面稿：實際會重新產生 Token 並作廢舊的 QRCode"
            className="rounded-lg border border-stone-200 px-3 py-1.5 text-sm text-stone-600 hover:bg-stone-50"
          >
            重新產生
          </DemoActionButton>
          <DemoActionButton
            feedback="靜態畫面稿：實際會將此 Token 加入作廢清單並同步至 DMZ"
            className="rounded-lg border border-rose-200 px-3 py-1.5 text-sm text-rose-600 hover:bg-rose-50"
          >
            作廢
          </DemoActionButton>
          <DemoActionButton
            action="print"
            feedback="已送出列印（靜態畫面稿）"
            className="rounded-lg bg-gradient-to-r from-brand-500 to-brand-400 px-4 py-1.5 text-sm font-semibold text-white"
          >
            列印小卡
          </DemoActionButton>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <InfoCard
          kind="對內"
          audience="媽媽本人"
          badgeColor="green"
          note="可觀看即時影像（約 1 秒更新）"
          motherName={target.motherName}
          url={VIEW_URL.mama}
          code={target.mamaCode}
          validFrom={target.validFrom}
          validTo={target.validTo}
          extra={`限定手機號碼：${target.mamaPhone}`}
        />
        <InfoCard
          kind="對外"
          audience="親友"
          badgeColor="blue"
          note="僅顯示截圖，限開放時段與有效期限內"
          motherName={target.motherName}
          url={VIEW_URL.family}
          code={target.familyCode}
          validFrom={target.validFrom}
          validTo={target.validTo}
          extra={`已登錄親友手機 ${target.familyWhitelist.length} 組，未登錄者無法觀看`}
        />
      </div>
    </div>
  );
}

function InfoCard({
  kind,
  audience,
  badgeColor,
  note,
  motherName,
  url,
  code,
  validFrom,
  validTo,
  extra,
}: {
  kind: string;
  audience: string;
  badgeColor: "green" | "blue";
  note: string;
  motherName: string;
  url: string;
  code: string;
  validFrom: string;
  validTo: string;
  extra: string;
}) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <Badge color={badgeColor}>
          {kind}／{audience}
        </Badge>
        <span className="text-xs text-stone-400">{note}</span>
      </div>

      <h3 className="mb-5 text-center text-base tracking-[0.3em] text-stone-700">
        聖帝諾產後護理之家
      </h3>

      <div className="space-y-2.5 text-sm leading-relaxed text-stone-700">
        <p>親愛的　{motherName}　媽咪：</p>
        <p className="break-all">
          觀看寶寶影像網址：<span className="text-brand-600">{url}</span>
        </p>
        <p>
          您的專屬密碼為：<span className="font-mono font-semibold">{code}</span>
        </p>
        <p className="text-stone-500">
          （使用日期：{validFrom} ～ {validTo}）
        </p>
        <p className="pt-2 text-stone-500">
          若寶寶不在專屬位置上，應是在媽媽房內，或正由護理人員護理中。
        </p>
      </div>

      <div className="my-4 border-t border-stone-200" />

      <div className="flex items-center justify-between gap-4">
        <div className="text-sm text-stone-600">
          <p>觀看寶寶影像 QRcode 掃描</p>
          <p className="mt-1 text-xs text-stone-400">{extra}</p>
        </div>
        <FakeQrCode seed={code} />
      </div>
    </div>
  );
}

/**
 * 示意用 QRCode：專案未安裝 QRCode 套件，這裡用種子決定性地畫出外觀相近的圖樣。
 * 僅供版面確認，無法實際掃描。
 */
function FakeQrCode({ seed }: { seed: string }) {
  const size = 25;
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;

  const isFinder = (x: number, y: number) => {
    const inBox = (ox: number, oy: number) =>
      x >= ox && x < ox + 7 && y >= oy && y < oy + 7;
    return inBox(0, 0) || inBox(size - 7, 0) || inBox(0, size - 7);
  };
  const finderOn = (x: number, y: number) => {
    const lx = x < 7 ? x : x - (size - 7);
    const ly = y < 7 ? y : y - (size - 7);
    const edge = lx === 0 || lx === 6 || ly === 0 || ly === 6;
    const core = lx >= 2 && lx <= 4 && ly >= 2 && ly <= 4;
    return edge || core;
  };

  const cells: React.ReactNode[] = [];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let on: boolean;
      if (isFinder(x, y)) {
        on = finderOn(x, y);
      } else {
        h = (h * 1103515245 + 12345) >>> 0;
        on = ((h >>> 16) & 1) === 1;
      }
      if (on) cells.push(<rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" />);
    }
  }

  return (
    <svg
      viewBox={`-1 -1 ${size + 2} ${size + 2}`}
      className="h-24 w-24 shrink-0"
      fill="#1c1917"
      role="img"
      aria-label="示意用 QRCode（靜態畫面稿，無法掃描）"
    >
      <rect x="-1" y="-1" width={size + 2} height={size + 2} fill="#fff" />
      {cells}
    </svg>
  );
}
