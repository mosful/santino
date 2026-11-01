import type { DemoDomain } from "../domain/types";

/** 展示時間持續前進，切換頁面或開啟另一個觀看分頁也共用同一起點。 */
export function demoNow(data: Pick<DemoDomain, "demoAt" | "demoClockStartedAt">, now = Date.now()) {
  const elapsed = data.demoClockStartedAt ? Math.max(0, now - Date.parse(data.demoClockStartedAt)) : 0;
  return new Date(Date.parse(data.demoAt) + elapsed);
}
