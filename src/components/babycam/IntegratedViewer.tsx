"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { LogOut, Maximize } from "lucide-react";
import Tabs from "@/components/ui/Tabs";
import { useDomainStore } from "@/lib/demo/domainStore";
import { enterViewer, leaveViewer, viewerHeartbeat } from "@/lib/babycam/viewerSession";
import { viewingBlock } from "@/lib/babycam/viewing";
import CamPreview from "./CamPreview";
import ViewLoginCard from "./ViewLoginCard";
import { buttonStyles } from "@/components/ui/buttonStyles";

/** 沿用既有觀看頁的登入卡、標題、頁籤及影像元件，僅替換資料與授權流程。 */
export default function IntegratedViewer({ audience }: { audience: "internal" | "family" }) {
  const { data } = useDomainStore();
  const params = useSearchParams();
  const [session, setSession] = useState<{ bindingId: string; deviceId: string; ticket: string } | null>(null);
  const [viewerMessage, setViewerMessage] = useState("");
  const frame = useRef<HTMLDivElement>(null);
  const family = audience === "family";
  const ticket = params.get("ticket");
  const binding = data.bindings.find((item) => item.id === session?.bindingId);
  const accounts = data.bindings.filter((item) => !item.ended && (!ticket || ticket === (family ? item.familyTicket : item.internalTicket))).slice(0, 4).map((item) => ({ label: item.babies.length > 1 ? "多胞胎" : item.babies.length ? "一般觀看" : "待指派", room: item.room || "托嬰", phone: item.phone, code: item.passcode }));
  useEffect(() => {
    if (!session) return;
    const timer = window.setInterval(() => viewerHeartbeat(session.bindingId, session.deviceId), 10_000);
    const release = () => leaveViewer(session.bindingId, session.deviceId);
    const changeRole = () => { release(); setSession(null); };
    window.addEventListener("pagehide", release); window.addEventListener("santino-role-changed", changeRole);
    return () => { window.clearInterval(timer); window.removeEventListener("pagehide", release); window.removeEventListener("santino-role-changed", changeRole); release(); };
  }, [session]);
  if (!session || !binding) return <ViewLoginCard title={family ? "寶寶影像（親友觀看）" : "寶寶即時影像"} subtitle={`聖帝諾產後護理之家 · ${family ? "親友觀看" : "媽媽專用"}`} demoHint="靜態展示：請使用院內完整功能工作區交付的展示手機與密碼。資料僅在同一瀏覽器同步，沒有真實帳號驗證或攝影機連線。" accounts={accounts} onSubmit={(phone, code) => {
    try {
      let deviceId = window.sessionStorage.getItem("santino-viewer-device");
      if (!deviceId) { deviceId = crypto.randomUUID(); window.sessionStorage.setItem("santino-viewer-device", deviceId); }
      const bindingId = enterViewer(audience, phone, code, ticket, deviceId);
      const current = data.bindings.find((item) => item.id === bindingId)!;
      setSession({ bindingId, deviceId, ticket: family ? current.familyTicket : current.internalTicket }); return null;
    } catch (error) { return error instanceof Error ? error.message : "登入失敗，請重新確認。"; }
  }} />;
  const currentTicket = family ? binding.familyTicket : binding.internalTicket;
  const invalidated = session.ticket !== currentTicket || !binding.sessions.some((item) => item.id === session.deviceId);
  function renderCamera(index: number) {
    const baby = binding!.babies[index];
    const camera = data.cameras.find((item) => item.id === baby?.cameraId);
    const blocked = invalidated ? "觀看連結已重發或登入已由院方釋出，請重新登入" : viewingBlock(data, binding!, baby, audience);
    // 遮蔽時墊的底圖：以寶寶目前的顯示狀態為準（內建底圖或院方上傳的）。
    const background = blocked ? data.displayStates.find((state) => state.key === baby?.state) : undefined;
    return <CamPreview mode={blocked ? "masked" : family ? "snapshot" : "live"} room={binding!.room || "托嬰"} camCode={camera?.code ?? "待指派"} statusLabel={blocked ?? undefined} backgroundState={background} watermark={`${binding!.room || "托嬰"} · 展示觀看`} />;
  }
  return <div className="space-y-4" ref={frame}>
    <div className="flex items-center justify-between gap-3"><div><h1 className="text-base font-bold text-stone-800">{binding.room ? `${binding.room} 房` : "托嬰"} · {binding.motherName} 媽咪{family ? "的寶寶" : ""}</h1><p className="text-xs text-stone-400">有效期限 {binding.validFrom} ～ {binding.validTo}</p></div><button type="button" onClick={() => { leaveViewer(binding.id, session.deviceId); setSession(null); }} className="flex items-center gap-1 rounded-lg border border-stone-200 px-2.5 py-1.5 text-xs text-stone-500 hover:bg-stone-50"><LogOut className="h-3.5 w-3.5" />登出</button></div>
    {binding.babies.length > 1 ? <Tabs tabs={binding.babies.map((baby, index) => ({ key: baby.babyId, label: data.subjects.find((subject) => subject.id === baby.babyId)?.name ?? `寶寶 ${index + 1}`, content: renderCamera(index) }))} /> : renderCamera(0)}
    <button type="button" className={buttonStyles({ size: "sm" })} onClick={async () => { if (!frame.current?.requestFullscreen) { setViewerMessage("此瀏覽器不支援全螢幕，可旋轉裝置橫向觀看。"); return; } try { await frame.current.requestFullscreen(); setViewerMessage(""); } catch { setViewerMessage("瀏覽器未允許全螢幕，請確認瀏覽器設定或旋轉裝置觀看。"); } }}><Maximize size={14} />全螢幕</button>
    {viewerMessage && <p role="status" className="text-xs text-stone-600">{viewerMessage}</p>}
    <div className="rounded-lg bg-stone-50 p-3 text-xs leading-relaxed text-stone-500"><p>若寶寶不在專屬位置上，應是在媽媽房內，或正由護理人員護理中。</p><p className="mt-1.5 text-stone-400">{family ? "親友端僅顯示模擬截圖。" : "院內端顯示模擬影像。"}請勿轉傳畫面或將密碼提供給他人。</p></div>
  </div>;
}
