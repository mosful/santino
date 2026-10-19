import { intersectWindows, isWithinSchedule, taipeiDate, taipeiHhmm, type ScheduleWindow } from "./schedule";
import type { BabyBinding, CameraRecord, DemoDomain, ViewingBinding, WindowRule } from "../domain/types";

function asSchedule(rule: WindowRule): ScheduleWindow { return { ...rule, mode: rule.mode === "inherit" ? "always" : rule.mode }; }
/** 全院、受眾及每機只會縮小範圍；入住遮罩另行必定套用。 */
export function effectiveViewingWindow(data: DemoDomain, camera: CameraRecord, audience: "internal" | "family") {
  const audienceWindow = audience === "internal" ? data.internalWindow : data.familyWindow;
  const cameraWindow = audience === "internal" ? camera.scheduleInternal : camera.scheduleFamily;
  const first = intersectWindows(asSchedule(data.houseWindow), asSchedule(audienceWindow));
  const last = intersectWindows(first.window, asSchedule(cameraWindow));
  return { ...last, truncated: first.truncated || last.truncated };
}
export function viewingBlock(data: DemoDomain, binding: ViewingBinding, baby: BabyBinding | undefined, audience: "internal" | "family", at = new Date(data.demoAt)) {
  const day = taipeiDate(at); const clock = taipeiHhmm(at);
  if (binding.ended || binding.viewingRevoked || day < binding.validFrom || day > binding.validTo) return "觀看授權已失效或尚未生效";
  if (audience === "family" && (!binding.familyEnabled || (binding.familyFrom && day < binding.familyFrom) || (binding.familyTo && day > binding.familyTo))) return "此筆入住未開放親友觀看";
  if (!baby) return "寶寶與監視器尚未指派";
  const camera = data.cameras.find((item) => item.id === baby.cameraId);
  if (!camera?.enabled) return "監視器暫停使用";
  if (baby.careMode) return "寶寶照護中";
  const state = data.displayStates.find((item) => item.key === baby.state);
  if (state?.masked) return state.name;
  if (data.viewScenario === "fault" || camera.health === "異常") return "監視器連線異常";
  if (data.viewScenario === "stale") return "影像已過期，請稍後重試";
  if (data.viewScenario === "cart-away") return "嬰兒車已離開，畫面遮蔽中";
  const scenario = data.demoScenarios[camera.id];
  if (scenario?.phase === "fault") return "偵測服務異常，畫面暫停顯示";
  if (["care", "returned"].includes(scenario?.phase ?? "")) return "偵測到離車，待人工歸位核對";
  if (data.detection.enabled && !camera.baseline) return "尚未設定正常停放基準";
  const stay = audience === "internal" ? binding.internalWindow : binding.familyWindow;
  if (!isWithinSchedule(asSchedule(stay), clock)) return "此筆入住目前非開放時段";
  const enforce = audience === "internal" ? data.enforceInternal : data.enforceFamily;
  if (enforce && !isWithinSchedule(effectiveViewingWindow(data, camera, audience).window, clock)) return "目前非開放時段";
  return null;
}
export function deriveDemoLight(data: DemoDomain, camera: CameraRecord) {
  const binding = data.bindings.find((item) => !item.ended && item.babies.some((baby) => baby.cameraId === camera.id));
  const baby = binding?.babies.find((item) => item.cameraId === camera.id);
  if (!binding || !baby || !camera.enabled) return "empty";
  const at = new Date(data.demoAt); const day = taipeiDate(at);
  if (day < binding.validFrom || day > binding.validTo) return "empty";
  if (baby.careMode || data.viewScenario === "cart-away") return "care";
  if (data.displayStates.find((state) => state.key === baby.state)?.masked) return "idle";
  for (const audience of ["family", "internal"] as const) {
    const active = binding.sessions.some((session) => session.audience === audience && at.valueOf() - Date.parse(session.lastSeen) <= 15_000);
    if (!active || viewingBlock(data, binding, baby, audience, at)) continue;
    if (isWithinSchedule(effectiveViewingWindow(data, camera, audience).window, taipeiHhmm(at))) return audience;
  }
  return "idle";
}
