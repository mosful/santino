"use client";

import { useState } from "react";
import SignaturePad from "./SignaturePad";
import Modal from "./Modal";
import { useSignature, rememberSignature, staffKey } from "@/lib/signatureStore";
import { useCurrentRole } from "@/lib/roleStore";
import { ROLE_PROFILE } from "@/lib/permissions";
import { buttonStyles } from "@/components/ui/buttonStyles";

/**
 * 簽名可重複應用（總則#4）：本次登入session簽過一次後，其餘簽名欄位自動帶入同一份簽名，
 * 不需重複簽名；員工蓋章圖檔依當班（目前登入）人員自動帶入（總則#5）。
 */
export default function SignatureBox({
  label,
  showStamp = true,
  caseLabel = "目前個案",
}: {
  label: string;
  showStamp?: boolean;
  caseLabel?: string;
}) {
  const role = useCurrentRole();
  // 這幾張舊表單的簽名欄位都是當班人員自己簽的，跟著登入角色帶（見 signatureStore）。
  const sessionSignature = useSignature(staffKey(role))?.image ?? null;
  const profile = ROLE_PROFILE[role];
  const [drawing, setDrawing] = useState(false);
  const [caseConfirmed, setCaseConfirmed] = useState(false);
  const [localOverride, setLocalOverride] = useState<string | null>(null);

  const signature = localOverride ?? sessionSignature;
  const today = new Date().toISOString().slice(0, 10);

  function handleConfirm(dataUrl: string) {
    setLocalOverride(dataUrl);
    rememberSignature(staffKey(role), dataUrl, role);
    setDrawing(false);
  }

  function openSignature() {
    setCaseConfirmed(false);
    setDrawing(true);
  }

  return (
    <>
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

      {signature ? (
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={signature} alt="已簽署的簽名影像" width={240} height={64} className="h-16 w-auto rounded border border-stone-100 bg-white" />
          <div className="flex flex-col gap-1 text-xs">
            <span className="text-stone-400">已套用本次登入簽名</span>
            <button type="button" onClick={openSignature} className={buttonStyles({ variant: "link", size: "sm" })}>
              重新簽名
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={openSignature}
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
      <Modal open={drawing} title={`簽名確認｜${label}`} onClose={() => setDrawing(false)}>
        <div className="space-y-4">
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3">
            <div className="text-xs text-rose-600">請先確認本次簽名個案</div>
            <div className="mt-1 text-lg font-bold text-rose-800">{caseLabel}</div>
          </div>
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-stone-200 p-3 text-sm text-stone-700">
            <input type="checkbox" checked={caseConfirmed} onChange={(event) => setCaseConfirmed(event.target.checked)} className="h-5 w-5 accent-rose-500" />
            我已核對房號／車號與個案姓名，確認簽名對象正確
          </label>
          {caseConfirmed ? (
            <SignaturePad onConfirm={handleConfirm} onCancel={() => setDrawing(false)} />
          ) : (
            <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50 p-8 text-center text-sm text-stone-400">
              完成個案確認後才會開啟簽名板
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}
