"use client";

import { domainStore } from "../demo/domainStore";
import { taipeiDate } from "./schedule";
import { closeViewingHistory } from "./history";

export function enterViewer(audience: "internal" | "family", phone: string, passcode: string, ticket: string | null, deviceId: string) {
  let bindingId = "";
  domainStore.update((data) => {
    const binding = data.bindings.find((item) => item.phone === phone && item.passcode === passcode && (!ticket || ticket === (audience === "internal" ? item.internalTicket : item.familyTicket)));
    if (!binding) throw new Error("展示手機、密碼或觀看連結不正確，請使用最新交付資訊。");
    const day = taipeiDate(new Date(data.demoAt));
    if (binding.ended || binding.viewingRevoked || day < binding.validFrom || day > binding.validTo || (audience === "family" && !binding.familyEnabled)) throw new Error("觀看授權尚未開放或已結束。");
    const active = binding.sessions.filter((session) => Date.parse(data.demoAt) - Date.parse(session.lastSeen) <= 30 * 60_000 && session.id !== deviceId);
    if (audience === "family" && data.concurrencyEnforced && data.familyLimit > 0 && active.filter((session) => session.audience === "family").length >= data.familyLimit) throw new Error("目前觀看人數已滿，請先在舊裝置登出或由櫃台釋出名額。");
    binding.sessions = [...active, { id: deviceId, audience, lastSeen: data.demoAt }]; bindingId = binding.id;
    closeViewingHistory(data, binding.id, "重新登入", deviceId);
    data.viewingHistory.push({ id: crypto.randomUUID(), bindingId, deviceId, audience, start: data.demoAt, lastSeen: data.demoAt, end: null, reason: "觀看中" });
  });
  return bindingId;
}
export function viewerHeartbeat(bindingId: string, deviceId: string) {
  domainStore.update((data) => { const session = data.bindings.find((binding) => binding.id === bindingId && !binding.ended)?.sessions.find((item) => item.id === deviceId); if (session) { session.lastSeen = data.demoAt; data.viewingHistory.filter((event) => event.bindingId === bindingId && event.deviceId === deviceId && !event.end).forEach((event) => { event.lastSeen = data.demoAt; }); } });
}
export function leaveViewer(bindingId: string, deviceId: string) { domainStore.update((data) => { const binding = data.bindings.find((item) => item.id === bindingId); if (binding) { binding.sessions = binding.sessions.filter((item) => item.id !== deviceId); closeViewingHistory(data, bindingId, "登出", deviceId); } }); }
