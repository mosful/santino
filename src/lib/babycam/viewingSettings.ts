import type { DemoDomain, WindowRule } from "@/lib/domain/types";

export type ViewingSettings = Pick<DemoDomain, "houseWindow" | "internalWindow" | "familyWindow" | "enforceInternal" | "enforceFamily" | "familyLimit" | "concurrencyEnforced">;

export const DEFAULT_VIEWING_SETTINGS: ViewingSettings = {
  houseWindow: { mode: "scheduled", start: "10:00", end: "22:00" },
  internalWindow: { mode: "scheduled", start: "10:00", end: "22:00" },
  familyWindow: { mode: "scheduled", start: "10:00", end: "20:00" },
  enforceInternal: true,
  enforceFamily: true,
  familyLimit: 2,
  concurrencyEnforced: true,
};

/** 只調整舊版開放時段預設，不重設案件、寶寶、授權或既有自訂時間。 */
export function migrateViewingSettings(data: DemoDomain) {
  if (data.viewingSettingsRevision === 1) return;
  const legacyDefaults = data.houseWindow.mode === "always" && data.houseWindow.start === "00:00" && data.houseWindow.end === "23:59"
    && JSON.stringify(data.internalWindow) === JSON.stringify(DEFAULT_VIEWING_SETTINGS.internalWindow)
    && JSON.stringify(data.familyWindow) === JSON.stringify(DEFAULT_VIEWING_SETTINGS.familyWindow)
    && !data.enforceInternal && !data.enforceFamily;
  for (const key of ["houseWindow", "internalWindow", "familyWindow"] as const) {
    if (data[key].mode !== "scheduled") data[key] = { ...DEFAULT_VIEWING_SETTINGS[key] };
  }
  if (legacyDefaults) {
    data.enforceInternal = true;
    data.enforceFamily = true;
  }
  data.viewingSettingsRevision = 1;
}

export function viewingSettingsOf(data: DemoDomain): ViewingSettings {
  const scheduled = (rule: WindowRule, fallback: WindowRule): WindowRule => ({ ...(rule.mode === "scheduled" ? rule : fallback), mode: "scheduled" });
  return {
    houseWindow: scheduled(data.houseWindow, DEFAULT_VIEWING_SETTINGS.houseWindow),
    internalWindow: scheduled(data.internalWindow, DEFAULT_VIEWING_SETTINGS.internalWindow),
    familyWindow: scheduled(data.familyWindow, DEFAULT_VIEWING_SETTINGS.familyWindow),
    enforceInternal: data.enforceInternal,
    enforceFamily: data.enforceFamily,
    familyLimit: data.familyLimit,
    concurrencyEnforced: data.concurrencyEnforced,
  };
}
