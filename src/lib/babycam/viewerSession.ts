"use client";

import { domainStore } from "../demo/domainStore";
import { taipeiDate } from "./schedule";
import { closeViewingHistory } from "./history";
import { demoNow } from "./clock";
import type { DemoDomain, ViewingBinding } from "../domain/types";

export const VIEWER_LEASE_MS = 35_000;
export function familyCapacityMessage(data: DemoDomain, binding: ViewingBinding, deviceId = "", at = demoNow(data)) {
  const active = binding.sessions.filter((session) => session.id !== deviceId && session.audience === "family" && at.valueOf() - Date.parse(session.lastSeen) <= VIEWER_LEASE_MS);
  return data.concurrencyEnforced && data.familyLimit > 0 && active.length >= data.familyLimit
    ? `親友同時觀看人數已滿（上限 ${data.familyLimit} 位），目前無法開啟監視器畫面。請稍後再試，或等其他親友離開觀看。`
    : null;
}

export function enterViewer(audience: "internal" | "family", phone: string, passcode: string, ticket: string | null, deviceId: string) {
  let bindingId = "";
  domainStore.update((data) => {
    const matches = data.bindings.filter((item) => item.phone === phone && item.passcode === passcode && (!ticket || ticket === (audience === "internal" ? item.internalTicket : item.familyTicket)));
    const binding = matches.find((item) => !item.ended && !item.viewingRevoked) ?? matches[0];
    if (!binding) throw new Error("展示手機、密碼或觀看連結不正確，請使用最新交付資訊。");
    const at = demoNow(data); const day = taipeiDate(at); const stamp = at.toISOString();
    if (binding.ended || binding.viewingRevoked || day < binding.validFrom || day > binding.validTo || (audience === "family" && !binding.familyEnabled)) throw new Error("觀看授權尚未開放或已結束。");
    const active = binding.sessions.filter((session) => at.valueOf() - Date.parse(session.lastSeen) <= VIEWER_LEASE_MS && session.id !== deviceId);
    const full = audience === "family" ? familyCapacityMessage(data, binding, deviceId, at) : null;
    if (full) throw new Error(full);
    binding.sessions = [...active, { id: deviceId, audience, lastSeen: stamp }]; bindingId = binding.id;
    closeViewingHistory(data, binding.id, "重新登入", deviceId);
    data.viewingHistory.push({ id: crypto.randomUUID(), bindingId, deviceId, audience, start: stamp, lastSeen: stamp, end: null, reason: "觀看中" });
  });
  return bindingId;
}
export function viewerHeartbeat(bindingId: string, deviceId: string) {
  domainStore.update((data) => { const at = demoNow(data).toISOString(); const session = data.bindings.find((binding) => binding.id === bindingId && !binding.ended)?.sessions.find((item) => item.id === deviceId); if (session) { session.lastSeen = at; data.viewingHistory.filter((event) => event.bindingId === bindingId && event.deviceId === deviceId && !event.end).forEach((event) => { event.lastSeen = at; }); } });
}
export function leaveViewer(bindingId: string, deviceId: string) { domainStore.update((data) => { const binding = data.bindings.find((item) => item.id === bindingId); if (binding) { binding.sessions = binding.sessions.filter((item) => item.id !== deviceId); closeViewingHistory(data, bindingId, "登出", deviceId); } }); }
