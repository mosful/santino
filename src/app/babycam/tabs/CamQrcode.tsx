"use client";

import { useState } from "react";
import Badge from "@/components/ui/Badge";
import PlaceholderNotice from "@/components/ui/PlaceholderNotice";
import DemoActionButton from "@/components/ui/DemoActionButton";
import { useLegacyBabycam } from "@/lib/babycam/legacyAdapter";
import { useDomainStore } from "@/lib/demo/domainStore";
import { babycamActions } from "@/lib/babycam/actions";
import { TicketQr } from "@/components/babycam/BabycamWorkspace";

export default function CamQrcode() {
  const { BINDINGS } = useLegacyBabycam();
  const { data } = useDomainStore();
  const [feedback, setFeedback] = useState("");
  const [roomIdx, setRoomIdx] = useState(0);
  const target = BINDINGS[roomIdx] ?? BINDINGS[0];

  if (!target) return null;
  const binding = data.bindings.find((item) => item.id === target.id)!;

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
          <button
            type="button"
            onClick={() => { try { babycamActions.reissue(target.id); setFeedback("已重發，舊 QRCode 失效。"); } catch (error) { setFeedback(error instanceof Error ? error.message : "重發失敗。"); } }}
            className="rounded-lg border border-stone-200 px-3 py-1.5 text-sm text-stone-600 hover:bg-stone-50"
          >
            重新產生
          </button>
          <button
            type="button"
            onClick={() => { try { babycamActions.revoke(target.id); setFeedback("已作廢觀看授權，入住及照護資料仍保留。"); } catch (error) { setFeedback(error instanceof Error ? error.message : "作廢失敗。"); } }}
            className="rounded-lg border border-rose-200 px-3 py-1.5 text-sm text-rose-600 hover:bg-rose-50"
          >
            作廢
          </button>
          <DemoActionButton
            action="print"
            feedback="已送出列印（靜態畫面稿）"
            className="rounded-lg bg-gradient-to-r from-brand-500 to-brand-400 px-4 py-1.5 text-sm font-semibold text-white"
          >
            列印小卡
          </DemoActionButton>
        </div>
      </div>
      {feedback && <p role="status" className="text-xs text-stone-600">{feedback}</p>}

      <div className="grid gap-4 lg:grid-cols-2">
        <InfoCard
          kind="對內"
          audience="媽媽本人"
          badgeColor="green"
          note="可觀看即時影像（約 1 秒更新）"
          motherName={target.motherName}
          url={`/view/mama/?ticket=${encodeURIComponent(binding.internalTicket)}`}
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
          url={`/view/family/?ticket=${encodeURIComponent(binding.familyTicket)}`}
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
        <TicketQr href={url} size={96} />
      </div>
    </div>
  );
}
