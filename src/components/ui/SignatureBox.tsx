"use client";

import { useState } from "react";
import SignaturePad from "./SignaturePad";
import { useSessionSignature, setSessionSignature } from "@/lib/signatureStore";
import { useCurrentRole } from "@/lib/roleStore";
import { ROLE_PROFILE } from "@/lib/permissions";

/**
 * 簽名可重複應用（總則#4）：本次登入session簽過一次後，其餘簽名欄位自動帶入同一份簽名，
 * 不需重複簽名；員工蓋章圖檔依當班（目前登入）人員自動帶入（總則#5）。
 */
export default function SignatureBox({ label, showStamp = true }: { label: string; showStamp?: boolean }) {
  const sessionSignature = useSessionSignature();
  const role = useCurrentRole();
  const profile = ROLE_PROFILE[role];
  const [drawing, setDrawing] = useState(false);
  const [localOverride, setLocalOverride] = useState<string | null>(null);

  const signature = localOverride ?? sessionSignature;
  const today = new Date().toISOString().slice(0, 10);

  function handleConfirm(dataUrl: string) {
    setLocalOverride(dataUrl);
    setSessionSignature(dataUrl);
    setDrawing(false);
  }

  return (
    <div className="rounded-lg border border-stone-200 p-2">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs text-stone-500">{label}</span>
        {showStamp && (
          <span className="flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-[10px] text-brand-600">
            <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full border border-brand-400 text-[8px] font-bold text-brand-500">
              章
            </span>
            {profile.name}蓋章已自動帶入
          </span>
        )}
      </div>

      {drawing ? (
        <SignaturePad onConfirm={handleConfirm} onCancel={() => setDrawing(false)} />
      ) : signature ? (
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={signature} alt="簽名" className="h-16 rounded border border-stone-100 bg-white" />
          <div className="flex flex-col gap-1 text-xs">
            <span className="text-stone-400">已套用本次登入簽名</span>
            <button type="button" onClick={() => setDrawing(true)} className="text-left text-brand-500 underline">
              重新簽名
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setDrawing(true)}
          className="flex h-16 w-full items-center justify-center rounded bg-stone-50 text-xs text-stone-400 hover:bg-stone-100"
        >
          點擊簽名
        </button>
      )}

      <input
        readOnly
        value={signature ? today : ""}
        placeholder="日期（簽名後自動帶入）"
        className="mt-1 w-full rounded border border-stone-200 px-2 py-1 text-xs text-stone-500"
      />
    </div>
  );
}
