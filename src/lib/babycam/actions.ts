"use client";

import { audit, domainStore } from "../demo/domainStore";
import { getCurrentRole } from "../roleStore";
import type { BabyBinding, DemoDomain, ViewingBinding, WindowRule } from "../domain/types";
import { validTime } from "../domain/rules";
import { normalizeCartNo } from "./cart-no";
import { guard } from "../demo/lenient";
import { closeViewingHistory } from "./history";
import { normalizePrintSettings } from "./wristband-print";
import { getAccess, ROLES, type AccessLevel, type Role } from "../permissions";
import { initialDemoScenario, reduceDemoScenario, type DemoScenarioAction } from "./demo-scenario";

/**
 * 寶寶視訊的分段權限（對齊 BabyCam 的 01–08 八格）。
 *
 * ⚠️ 只會回 "edit" 或 "none"：客戶要求不屬於該角色的功能直接不顯示，
 * 不要再出現「進得去但整頁停用」的唯讀分頁（護理長原本就是這樣）。
 * 看得到哪幾格由 data.sectionPermissions 決定；"08" 系統格固定只給管理者。
 */
/**
 * 分段權限的**純函式**版本：角色由呼叫端傳入。
 *
 * ⚠️ 需要在 render 期間判斷權限的元件（例如側邊欄要決定寶寶視訊四個群組顯示哪些）
 * 一律用這支，不要用下面那個會自己呼叫 `getCurrentRole()` 的版本——那會在 hydration
 * 當下讀到 localStorage 的角色，和元件用 `useCurrentRole()`（hydration 期間回預設值）
 * 拿到的不一樣，兩邊算出不同的畫面就會 hydration failed（React #418，實際發生過）。
 */
export function babycamSectionAllowed(data: DemoDomain, role: Role, section: string) {
  if (getAccess(role, "17") === "none") return false;
  if (role === "管理者") return true;
  if (section === "08") return false;
  return (data.sectionPermissions[role] ?? []).includes(section);
}

export function getBabycamSectionAccess(data: DemoDomain, section: string): AccessLevel {
  return babycamSectionAllowed(data, getCurrentRole(), section) ? "edit" : "none";
}
export function canBabycamSection(data: DemoDomain, section: string) { return getBabycamSectionAccess(data, section) !== "none"; }
export function canEditBabycamSection(data: DemoDomain, section: string) { return getBabycamSectionAccess(data, section) === "edit"; }
function requireSection(data: DemoDomain, section: string) {
  const access = getBabycamSectionAccess(data, section);
  if (access === "none") throw new Error("目前角色沒有此視訊功能權限。");
}
function bindingOf(data: DemoDomain, id: string) { const binding = data.bindings.find((item) => item.id === id); if (!binding || binding.ended) throw new Error("此視訊登記不存在或已結束。"); return binding; }
function checkWindow(rule: WindowRule) { if (rule.mode === "scheduled" && (!validTime(rule.start) || !validTime(rule.end))) throw new Error("開放時段格式不正確。"); }
function dateValid(value: string) { return /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value; }

export const babycamActions = {
  register(caseId: string) {
    domainStore.update((data) => {
      requireSection(data, "01");
      if (!["管理者", "櫃台"].includes(getCurrentRole())) throw new Error("入住交付須由櫃台或管理角色操作。");
      const record = data.cases.find((item) => item.id === caseId);
      if (!record || !record.actualAdmission || record.dischargedAt) throw new Error("請先從案件流程完成實際入住。");
      if (data.bindings.some((binding) => binding.caseId === caseId && !binding.ended)) throw new Error("此案件已有視訊登記，請沿用原資料。");
      const internalWindow: WindowRule = { mode: "inherit", start: "10:00", end: "22:00" };
      data.bindings.push({ id: crypto.randomUUID(), caseId, room: record.room, motherName: record.name, phone: record.phone, validFrom: record.actualAdmission, validTo: "2026-12-31", familyEnabled: true, familyFrom: "", familyTo: "", internalWindow, familyWindow: { ...internalWindow }, internalTicket: crypto.randomUUID(), familyTicket: crypto.randomUUID(), passcode: `DEMO-${data.bindings.length + 1}`, babies: [], sessions: [], ended: false });
      audit(data, "建立視訊入住登記，待護理指派", caseId);
    });
  },
  updateBinding(id: string, patch: Partial<ViewingBinding>) {
    domainStore.update((data) => { requireSection(data, "01"); const binding = bindingOf(data, id); const allowed = ["validFrom", "validTo", "familyEnabled", "familyFrom", "familyTo", "internalWindow", "familyWindow"]; if (Object.keys(patch).some((key) => !allowed.includes(key))) throw new Error("請使用對應視訊操作。"); if (patch.internalWindow) checkWindow(patch.internalWindow); if (patch.familyWindow) checkWindow(patch.familyWindow); const after = { ...binding, ...patch }; if (!dateValid(after.validFrom) || !dateValid(after.validTo) || after.familyFrom && !dateValid(after.familyFrom) || after.familyTo && !dateValid(after.familyTo)) throw new Error("觀看授權日期格式不正確。"); if (after.validFrom > after.validTo || (after.familyFrom && after.familyTo && after.familyFrom > after.familyTo)) throw new Error("結束日期不能早於起始日期。"); Object.assign(binding, patch); audit(data, "修改入住觀看授權", id); });
  },
  assign(id: string, input: { babyId?: string; name: string; cameraId: string; cartNo: string; birthDate: string; sex: "男" | "女"; birthOrder: number; reason?: string }) {
    domainStore.update((data) => {
      requireSection(data, "02"); const binding = bindingOf(data, id);
      // 必填與格式在需求確認期間只提醒（客戶 2026-10-30）；監視器仍要選，否則整頁找不到裝置。
      guard(Boolean(input.name.trim() && input.cartNo.trim() && input.birthDate), "寶寶姓名、車號或出生日期尚未填寫。");
      if (!input.cameraId) throw new Error("請選擇一支監視器。");
      guard(!input.birthDate || (/^\d{4}-\d{2}-\d{2}$/.test(input.birthDate) && new Date(input.birthDate).toISOString().slice(0, 10) === input.birthDate), "出生日期格式不正確。");
      if (!data.cameras.some((camera) => camera.id === input.cameraId && camera.enabled)) throw new Error("請選擇啟用中的監視器。");
      const babyId = input.babyId || `baby-${crypto.randomUUID()}`;
      const normalized = normalizeCartNo(input.cartNo);
      guard(Boolean(normalized), "車號請使用 1 至 10 碼英數或連字號。");
      // 格式不合也照存，但存回原字串而不是 null——車號是顯示欄位，null 會讓房卡與標籤變空白。
      const cartNo = normalized ?? input.cartNo.trim();
      /* 原本這裡擋「多胞胎須各有胎序，請先把既有寶寶的 0 改成 1」——那是要求護理人員
         自己去維護一個內部編號，客戶 2026-10-29 直接說這檢查很奇怪。胎序現在由畫面的
         胎別決定（選雙胞胎就一次登錄兩位、自動給 1、2），不再要人工對齊。 */
      if (data.bindings.some((item) => !item.ended && item.babies.some((baby) => baby.babyId !== babyId && (baby.cameraId === input.cameraId || normalizeCartNo(baby.cartNo) === cartNo)))) throw new Error("監視器或車號已由其他寶寶使用。");
      const existing = binding.babies.find((baby) => baby.babyId === babyId);
      /* 換鏡頭的歷程就是這一段區間：封閉舊的、開一段新的，原因寫在新區間上。
         寶寶臨時移到隔離房、好了再推回原位都靠它回答「那天這支鏡頭照的是誰」。 */
      const movedCamera = Boolean(existing) && existing!.cameraId !== input.cameraId;
      if (!existing || movedCamera) {
        const reason = input.reason?.trim() || (existing ? "未註明" : "首次指派");
        data.cameraIntervals.filter((item) => item.babyId === babyId && !item.end).forEach((item) => { item.end = data.demoAt; });
        data.cameraIntervals.push({ id: crypto.randomUUID(), bindingId: id, babyId, cameraId: input.cameraId, start: data.demoAt, end: null, reason });
        if (movedCamera) {
          const from = data.cameras.find((camera) => camera.id === existing!.cameraId)?.code ?? existing!.cameraId;
          const to = data.cameras.find((camera) => camera.id === input.cameraId)?.code ?? input.cameraId;
          audit(data, `更換監視器 ${from} → ${to}；原因：${reason}`, babyId);
        }
      }
      const baby: BabyBinding = { babyId, cameraId: input.cameraId, cartNo, identityCode: existing?.identityCode ?? `DEMO-${crypto.randomUUID().slice(0, 8).toUpperCase()}`, state: existing?.state ?? "normal", careMode: existing?.careMode ?? false, careSince: existing?.careSince, birthOrder: input.birthOrder };
      if (existing) Object.assign(existing, baby); else binding.babies.push(baby);
      const subject = data.subjects.find((item) => item.id === babyId);
      if (subject && subject.caseId !== binding.caseId) throw new Error("此寶寶不屬於所選入住案件。");
      const fields = { name: input.name.trim(), birthDate: input.birthDate, gender: input.sex, birthOrder: input.birthOrder, carNo: cartNo, room: binding.room };
      if (subject) Object.assign(subject, fields);
      else data.subjects.push({ id: babyId, caseId: binding.caseId, kind: "baby", ...fields, motherName: binding.motherName, chartNo: `B-${babyId.slice(-8)}`, status: binding.room ? "入住" : "托嬰", stayDay: 1 });
      audit(data, `寶寶指派／更新；胎序 ${input.birthOrder}`, babyId);
    });
  },
  unassign(id: string, babyId: string) { domainStore.update((data) => { requireSection(data, "02"); const binding = bindingOf(data, id); if (!binding.babies.some((baby) => baby.babyId === babyId)) throw new Error("此寶寶沒有有效指派。"); binding.babies = binding.babies.filter((baby) => baby.babyId !== babyId); data.cameraIntervals.filter((item) => item.babyId === babyId && !item.end).forEach((item) => { item.end = data.demoAt; }); data.careEvents.filter((event) => event.babyId === babyId && !event.end).forEach((event) => { event.end = data.demoAt; }); audit(data, "解除監視器指派，舊標籤失效，寶寶照護紀錄保留", babyId); }); },
  state(id: string, babyId: string, state: string) {
    domainStore.update((data) => { requireSection(data, "01"); const binding = bindingOf(data, id); if (!data.displayStates.some((item) => item.key === state)) throw new Error("找不到顯示狀態。"); const baby = binding.babies.find((item) => item.babyId === babyId); if (!baby) throw new Error("找不到寶寶。"); baby.state = state; audit(data, `切換顯示狀態 ${state}`, babyId); });
  },
  care(id: string, babyId: string, careMode: boolean) {
    domainStore.update((data) => {
      requireSection(data, "02"); const binding = bindingOf(data, id); const baby = binding.babies.find((item) => item.babyId === babyId); if (!baby) throw new Error("找不到寶寶。"); if (baby.careMode === careMode) return;
      baby.careMode = careMode;
      if (careMode) { baby.careSince = data.demoAt; data.careEvents.push({ id: crypto.randomUUID(), bindingId: id, babyId, start: data.demoAt, end: null, actor: getCurrentRole() }); }
      else { baby.careSince = undefined; data.careEvents.filter((event) => event.babyId === babyId && !event.end).forEach((event) => { event.end = data.demoAt; }); }
      audit(data, careMode ? "寶寶離開鏡頭，照護中" : "寶寶回到鏡頭，結束照護", babyId);
    });
  },
  scan(code: string, expectedBabyId: string) {
    domainStore.update((data) => {
      requireSection(data, "02"); const found = data.bindings.filter((binding) => !binding.ended).flatMap((binding) => binding.babies.map((baby) => ({ binding, baby }))).find((item) => item.baby.identityCode.toUpperCase().replace(/\W/g, "") === code.toUpperCase().replace(/\W/g, ""));
      if (!found || found.baby.babyId !== expectedBabyId) throw new Error("識別不符或標籤已失效，請核對寶寶與車號，不可直接歸位。");
      found.baby.careMode = false; found.baby.careSince = undefined; data.careEvents.filter((event) => event.babyId === expectedBabyId && !event.end).forEach((event) => { event.end = data.demoAt; }); audit(data, "掃碼歸位核對通過", expectedBabyId);
      const scenario = data.demoScenarios[found.baby.cameraId];
      if (scenario && ["care", "departing"].includes(scenario.phase)) throw new Error("偵測仍顯示離車，請先模擬寶寶回到鏡頭再核對。");
      if (scenario) data.demoScenarios[found.baby.cameraId] = reduceDemoScenario(scenario, { type: "scan-return" });
    });
  },
  reissue(id: string) { domainStore.update((data) => { requireSection(data, "01"); const binding = bindingOf(data, id); closeViewingHistory(data, id, "重發連結"); binding.viewingRevoked = false; binding.internalTicket = crypto.randomUUID(); binding.familyTicket = crypto.randomUUID(); binding.sessions = []; audit(data, "重發觀看連結，舊連結失效", id); }); },
  revoke(id: string) { domainStore.update((data) => { requireSection(data, "01"); const binding = bindingOf(data, id); binding.viewingRevoked = true; closeViewingHistory(data, id, "授權結束"); binding.sessions = []; audit(data, "作廢觀看授權；入住及照護狀態不變更", id); }); },
  passcode(id: string, value: string) { domainStore.update((data) => { requireSection(data, "01"); if (!value.trim()) throw new Error("展示密碼不可空白。"); bindingOf(data, id).passcode = value.trim(); audit(data, "重設展示密碼", id); }); },
  kick(id: string) { domainStore.update((data) => { requireSection(data, "01"); const binding = bindingOf(data, id); closeViewingHistory(data, id, "院方踢除", undefined, true); binding.sessions = binding.sessions.filter((session) => session.audience !== "family"); audit(data, "踢除親友展示登入", id); }); },
  camera(id: string, patch: Partial<DemoDomain["cameras"][number]>) {
    domainStore.update((data) => { requireSection(data, "03"); const camera = data.cameras.find((item) => item.id === id); if (!camera) throw new Error("找不到監視器。"); const allowed = ["enabled", "health", "baseline", "scheduleInternal", "scheduleFamily", "code", "codec", "sourceType", "sourceLabel", "resolution", "lastShotAt"]; if (Object.keys(patch).some((key) => !allowed.includes(key))) throw new Error("此監視器欄位不可變更。"); if (patch.code && (!/^[AB][0-9]{2}$/.test(patch.code) || data.cameras.some((item) => item.id !== id && item.code === patch.code))) throw new Error("監視器編號須為 A／B 加兩位數，且不可重複。"); if (patch.sourceLabel && (/:\/\/|(?:\d{1,3}\.){3}\d{1,3}/.test(patch.sourceLabel))) throw new Error("來源僅填匿名代號，不接受網址或設備位址。"); if (patch.scheduleInternal) checkWindow(patch.scheduleInternal); if (patch.scheduleFamily) checkWindow(patch.scheduleFamily); Object.assign(camera, patch); if (patch.code) camera.zone = patch.code[0] as "A" | "B"; audit(data, "修改監視器展示設定", id); });
  },
  settings(patch: Partial<DemoDomain>) {
    domainStore.update((data) => { requireSection(data, "04"); const allowed = ["houseWindow", "internalWindow", "familyWindow", "enforceInternal", "enforceFamily", "familyLimit", "concurrencyEnforced", "demoAt", "viewScenario", "networkPrefix"]; if (Object.keys(patch).some((key) => !allowed.includes(key))) throw new Error("請使用對應設定操作。"); for (const key of ["houseWindow", "internalWindow", "familyWindow"] as const) if (patch[key]) checkWindow(patch[key]); if (patch.demoAt !== undefined && !Number.isFinite(Date.parse(patch.demoAt))) throw new Error("展示日期時間不正確。"); if (patch.familyLimit !== undefined && (!Number.isInteger(patch.familyLimit) || patch.familyLimit < 0)) throw new Error("同時觀看上限請填 0 或正整數。"); if (patch.networkPrefix !== undefined && !/^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$/.test(patch.networkPrefix)) throw new Error("網段前綴請填三段數字，例如 192.168.202。"); Object.assign(data, patch); audit(data, "修改展示／觀看設定", "settings"); });
  },
  display(key: string, name: string, image?: string) {
    domainStore.update((data) => { requireSection(data, image !== undefined ? "05" : "04"); const state = data.displayStates.find((item) => item.key === key); if (!state || !name.trim()) throw new Error("請填寫狀態名稱。"); if (name.trim() !== state.name) requireSection(data, "04"); state.name = name.trim(); if (image !== undefined) state.image = image; audit(data, "修改顯示狀態", key); });
  },
  room(room: string, roomType: "精緻" | "VIP" | "VILLA", enabled: boolean, typeId?: string) {
    domainStore.update((data) => { requireSection(data, "04"); if (!/^[0-9]{3,4}$/.test(room)) throw new Error("房號請填 3 至 4 位數。"); const type = data.roomTypes.find((item) => item.id === (typeId || roomType)); if (!type) throw new Error("請選有效房型。"); const old = data.rooms.find((item) => item.room === room); if (!enabled && data.subjects.some((subject) => subject.room === room && !subject.historical)) throw new Error("使用中的房號不可停用。"); if (old) Object.assign(old, { roomType: type.priceCategory, enabled, typeId: type.id }); else data.rooms.push({ room, roomType: type.priceCategory, enabled, typeId: type.id }); audit(data, "修改房型房號主檔", room); });
  },
  roomType(id: string, name: string, priceCategory: "精緻" | "VIP" | "VILLA", remove = false) {
    domainStore.update((data) => { requireSection(data, "04"); const old = data.roomTypes.find((item) => item.id === id); if (!["精緻", "VIP", "VILLA"].includes(priceCategory)) throw new Error("請選有效計價基準。"); if (remove) { if (data.rooms.some((room) => (room.typeId || room.roomType) === id)) throw new Error("仍被房號使用的房型不可刪除。"); data.roomTypes = data.roomTypes.filter((item) => item.id !== id); } else { if (!name.trim() || data.roomTypes.some((item) => item.id !== id && item.name === name.trim())) throw new Error("房型名稱不可空白或重複。"); if (old) Object.assign(old, { name: name.trim(), priceCategory }); else data.roomTypes.push({ id: crypto.randomUUID(), name: name.trim(), priceCategory }); } audit(data, remove ? "刪除房型" : "維護房型", id || name); });
  },
  addCamera(code: string, codec: string, sourceLabel: string, resolution: string, enabled: boolean) {
    domainStore.update((data) => { requireSection(data, "03"); if (!/^[AB][0-9]{2}$/.test(code) || data.cameras.some((item) => item.code === code)) throw new Error("監視器編號須為 A／B 加兩位數，且不可重複。"); if (/:\/\/|(?:\d{1,3}\.){3}\d{1,3}/.test(sourceLabel)) throw new Error("僅可填匿名來源代號。"); const number = Math.max(0, ...data.cameras.map((item) => Number(item.id.replace("camera-", "")) || 0)) + 1; data.cameras.push({ id: `camera-${number}`, code, zone: code[0] as "A" | "B", enabled, codec, sourceLabel, resolution, sourceType: "本機示意", health: "等待", lastShotAt: data.demoAt, baseline: false, scheduleInternal: { mode: "inherit", start: "10:00", end: "22:00" }, scheduleFamily: { mode: "inherit", start: "10:00", end: "20:00" } }); audit(data, "新增匿名監視器主檔", code); });
  },
  removeCamera(id: string) { domainStore.update((data) => { requireSection(data, "03"); if (data.cameras.length <= 1 || data.bindings.some((binding) => !binding.ended && binding.babies.some((baby) => baby.cameraId === id))) throw new Error("使用中的監視器或最後一支監視器不可刪除，請先解除指派。"); data.cameras = data.cameras.filter((item) => item.id !== id); audit(data, "刪除匿名監視器主檔", id); }); },
  displayMaster(key: string, name: string, masked: boolean, order: number) { domainStore.update((data) => { requireSection(data, "04"); if (!name.trim()) throw new Error("請填狀態名稱。"); const index = data.displayStates.findIndex((item) => item.key === key); const old = data.displayStates[index]; if (key === "normal" && masked) throw new Error("正常顯示不可改為遮蔽。"); const state = old ? { ...old, name: name.trim(), masked } : { key: `state-${crypto.randomUUID()}`, name: name.trim(), masked }; if (index >= 0) data.displayStates.splice(index, 1); data.displayStates.splice(Math.max(0, Math.min(data.displayStates.length, Math.trunc(order) || 0)), 0, state); audit(data, "修改顯示狀態主檔", state.key); }); },
  removeDisplay(key: string) { domainStore.update((data) => { requireSection(data, "04"); if (key === "normal" || data.bindings.some((binding) => !binding.ended && binding.babies.some((baby) => baby.state === key))) throw new Error("正常顯示或使用中的狀態不可刪除。"); data.displayStates = data.displayStates.filter((item) => item.key !== key); audit(data, "刪除顯示狀態", key); }); },
  printSettings(settings: unknown) { domainStore.update((data) => { requireSection(data, "02"); data.printSettings = normalizePrintSettings(settings); audit(data, "儲存標籤列印設定", "print"); }); },
  detection(settings: DemoDomain["detection"]) { domainStore.update((data) => { requireSection(data, "04"); if (settings.threshold < 0.02 || settings.threshold > 0.8 || !Number.isInteger(settings.streak) || settings.streak < 1 || settings.streak > 10 || settings.intervalSeconds < 1 || settings.intervalSeconds > 300 || settings.maxAgeSeconds < 10 || settings.maxAgeSeconds > 3600) throw new Error("請確認偵測門檻、連續次數與時間範圍。"); data.detection = settings; audit(data, "修改本機偵測模擬設定", "detection"); }); },
  scenario(cameraId: string, action: DemoScenarioAction) {
    domainStore.update((data) => {
      requireSection(data, "03"); if (getCurrentRole() !== "管理者") throw new Error("設備維運情境僅限管理者。");
      const camera = data.cameras.find((item) => item.id === cameraId); if (!camera) throw new Error("找不到監視器。");
      const previous = data.demoScenarios[cameraId] ?? initialDemoScenario(); const next = reduceDemoScenario(previous, action);
      if (action.type === "sample" && ["departing", "fault"].includes(previous.phase)) { next.abnormalSamples = Math.min(data.detection.streak, previous.abnormalSamples + 1); next.phase = next.abnormalSamples >= data.detection.streak ? "care" : previous.phase; }
      if (action.type === "tick" && previous.phase === "departing" && previous.departedAt !== null) { const ready = action.now - previous.departedAt >= data.detection.intervalSeconds * 1000; Object.assign(next, ready ? { phase: "care", abnormalSamples: data.detection.streak, departedAt: null } : previous); }
      data.demoScenarios[cameraId] = next;
      const binding = data.bindings.find((item) => !item.ended && item.babies.some((baby) => baby.cameraId === cameraId)); const baby = binding?.babies.find((item) => item.cameraId === cameraId);
      if (baby && ["normal", "care", "returned", "restored"].includes(next.phase)) {
        const careMode = ["care", "returned"].includes(next.phase); if (baby.careMode !== careMode) { baby.careMode = careMode; if (careMode) { baby.careSince = data.demoAt; data.careEvents.push({ id: crypto.randomUUID(), bindingId: binding!.id, babyId: baby.babyId, start: data.demoAt, end: null, actor: getCurrentRole() }); } else { baby.careSince = undefined; data.careEvents.filter((event) => event.babyId === baby.babyId && !event.end).forEach((event) => { event.end = data.demoAt; }); } }
      }
      if (binding && action.type === "view") { closeViewingHistory(data, binding.id, "切換模擬受眾", `demo-${cameraId}`); binding.sessions = binding.sessions.filter((session) => session.id !== `demo-${cameraId}`); if (action.viewer !== "idle") { const audience = action.viewer === "internal" ? "internal" : "family"; binding.sessions.push({ id: `demo-${cameraId}`, audience, lastSeen: data.demoAt }); data.viewingHistory.push({ id: crypto.randomUUID(), bindingId: binding.id, deviceId: `demo-${cameraId}`, audience, start: data.demoAt, lastSeen: data.demoAt, end: null, reason: "展示控制台模擬觀看" }); } }
      audit(data, `設備維運情境 ${action.type} → ${next.phase}`, cameraId);
    });
  },
  lightColor(state: string, color: string, label?: string) { domainStore.update((data) => { requireSection(data, "08"); if (!["熄滅", "紅", "綠", "藍", "黃", "洋紅", "青", "白"].includes(color) || !state.trim()) throw new Error("請選擇有效燈色與名稱。"); data.lightColors[state] = color; if (label?.trim()) data.lightLabels[state] = label.trim(); audit(data, "修改模擬燈號狀態", state); }); },
  removeLight(state: string) { domainStore.update((data) => { requireSection(data, "08"); if (["empty", "care", "idle", "internal", "family"].includes(state)) throw new Error("五種內建業務狀態不可刪除。"); delete data.lightColors[state]; delete data.lightLabels[state]; audit(data, "刪除自訂燈號狀態", state); }); },
  relay(channel: string, enabled: boolean) { domainStore.update((data) => { requireSection(data, "07"); if (getCurrentRole() !== "管理者") throw new Error("通道點測模擬僅限管理者。"); data.relayChannels[channel] = enabled; audit(data, `模擬通道 ${enabled ? "開" : "關"}`, channel); }); },
  /*
    消毒排程（客戶 2026-10-29）：固定的紫外線消毒用 weekday，不定期的環境消毒用 date。
    歸在 04（開放時段）底下——它就是一種「這段時間不開放」的設定，護理長即可維護。
  */
  saveDisinfection(input: { id?: string; label: string; kind: "紫外線" | "環境"; weekday: number | null; date: string; start: string; end: string; rooms: string[]; enabled: boolean }) {
    domainStore.update((data) => {
      requireSection(data, "04");
      if (!input.label.trim()) throw new Error("請填寫消毒項目名稱。");
      if (input.weekday === null && !/^\d{4}-\d{2}-\d{2}$/.test(input.date)) throw new Error("不定期消毒請選擇日期。");
      if (input.weekday !== null && (!Number.isInteger(input.weekday) || input.weekday < 0 || input.weekday > 6)) throw new Error("請選擇有效的星期。");
      if (!/^\d{2}:\d{2}$/.test(input.start) || !/^\d{2}:\d{2}$/.test(input.end)) throw new Error("請填寫 HH:MM 格式的起訖時間。");
      if (input.start === input.end) throw new Error("起訖時間不可相同。");
      const unknown = input.rooms.filter((room) => !data.rooms.some((item) => item.room === room));
      if (unknown.length) throw new Error(`房號 ${unknown.join("、")} 不在房間主檔內。`);
      data.disinfections ??= [];
      const existing = input.id ? data.disinfections.find((item) => item.id === input.id) : undefined;
      const fields = { label: input.label.trim(), kind: input.kind, weekday: input.weekday, date: input.weekday === null ? input.date : "", start: input.start, end: input.end, rooms: [...input.rooms], enabled: input.enabled };
      if (existing) Object.assign(existing, fields);
      else data.disinfections.push({ id: crypto.randomUUID(), ...fields });
      audit(data, existing ? "修改消毒排程" : "新增消毒排程", fields.label);
    });
  },
  removeDisinfection(id: string) {
    domainStore.update((data) => {
      requireSection(data, "04");
      const target = (data.disinfections ?? []).find((item) => item.id === id);
      if (!target) throw new Error("找不到這筆消毒排程。");
      data.disinfections = data.disinfections.filter((item) => item.id !== id);
      audit(data, "刪除消毒排程", target.label);
    });
  },
  staff(id: string, name: string, role: string, enabled: boolean) {
    domainStore.update((data) => { requireSection(data, "08"); if (!name.trim() || !(ROLES as readonly string[]).includes(role)) throw new Error("請填姓名並選擇有效角色。"); const old = data.staff.find((item) => item.id === id); if (old?.role === "管理者" && old.enabled && (role !== "管理者" || !enabled) && data.staff.filter((item) => item.enabled && item.role === "管理者").length === 1) throw new Error("最後一位啟用中的管理員不可停用或降級。"); if (old) Object.assign(old, { name, role, enabled }); else data.staff.push({ id: crypto.randomUUID(), name, role, enabled }); audit(data, "修改展示帳號", id || name); });
  },
  permission(role: string, section: string, enabled: boolean) { domainStore.update((data) => { requireSection(data, "08"); if (role === "管理者" || section === "08") throw new Error("管理員全部權限與帳號設定專屬權限不可調整。"); const sections = data.sectionPermissions[role] ?? []; data.sectionPermissions[role] = enabled ? [...new Set([...sections, section])] : sections.filter((item) => item !== section); audit(data, "修改八格展示功能權限", role); }); },
};
