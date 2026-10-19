import type { DemoDomain } from "../domain/types";

/** 釋出名額時保留觀看歷程，報表不因登出或重發而消失。 */
export function closeViewingHistory(data: DemoDomain, bindingId: string, reason: string, deviceId?: string, familyOnly = false) {
  data.viewingHistory.filter((event) => event.bindingId === bindingId && !event.end && (!deviceId || event.deviceId === deviceId) && (!familyOnly || event.audience === "family")).forEach((event) => { event.end = data.demoAt; event.reason = reason; });
}
