"use client";

import { useState } from "react";
import type { DemoDomain, ViewingBinding } from "@/lib/domain/types";
import { babycamActions } from "@/lib/babycam/actions";
import Button from "@/components/ui/Button";
import { Toast, useToast } from "@/components/ui/Toast";

const input = "min-h-11 w-full rounded-lg border border-border-subtle bg-surface-raised px-3 py-2 text-sm";

/** 合約帶入值仍可修改，儲存後與案件及照護對象同步。 */
export default function RegistrationDetails({ data, binding }: { data: DemoDomain; binding: ViewingBinding }) {
  const record = data.cases.find((item) => item.id === binding.caseId);
  const [draft, setDraft] = useState({ motherName: binding.motherName, phone: binding.phone, room: binding.room });
  const [reason, setReason] = useState("");
  const [toast, toastProps] = useToast();
  const rooms = [...new Set([...(binding.room ? [binding.room] : []), ...data.rooms.filter((item) => item.enabled).map((item) => item.room)])];
  return <section className="space-y-3" aria-label="入住基本資料">
    <p className="text-sm leading-6 text-stone-600">已帶入合約 {record?.contractNo || "—"} 的姓名、電話與房號，可修改後儲存。觀看期間優先帶入實際入住日；尚未確認時先用預產期及合約天數預填。</p>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      <label className="space-y-1.5 text-sm">媽媽姓名<input aria-label="入住媽媽姓名" className={input} value={draft.motherName} onChange={(event) => setDraft({ ...draft, motherName: event.target.value })} /></label>
      <label className="space-y-1.5 text-sm">聯絡電話<input aria-label="入住聯絡電話" type="tel" className={input} value={draft.phone} onChange={(event) => setDraft({ ...draft, phone: event.target.value })} /></label>
      <label className="space-y-1.5 text-sm">房號<select aria-label="入住登記房號" className={input} value={draft.room} onChange={(event) => setDraft({ ...draft, room: event.target.value })}><option value="">尚未排房／托嬰</option>{rooms.map((room) => <option key={room}>{room}</option>)}</select></label>
      {record?.actualAdmission && draft.room !== binding.room && <label className="space-y-1.5 text-sm sm:col-span-2 xl:col-span-3">換房原因（入住後須主管操作）<input aria-label="入住登記換房原因" className={input} value={reason} onChange={(event) => setReason(event.target.value)} /></label>}
    </div>
    <Button size="sm" onClick={() => { try { babycamActions.registration(binding.id, draft, reason); toast.ok("入住基本資料已儲存，並同步案件與照護資料。"); } catch (error) { toast.fail(error instanceof Error ? error.message : "儲存失敗。"); } }}>儲存入住基本資料</Button>
    <Toast {...toastProps} />
  </section>;
}
