"use client";

import { useDomainStore } from "../demo/domainStore";
import type { Binding, Camera } from "../mock/babycam";
import { effectiveViewingWindow } from "./viewing";

/** 舊頁籤保留原版面，透過轉接層讀取與案件、照護共用的資料。 */
export function useLegacyBabycam() {
  const { data } = useDomainStore();
  const CAMERAS: Camera[] = data.cameras.map((camera) => ({ id: camera.id, code: camera.code, codec: camera.codec === "HEVC" ? "HEVC" : "H.264", addr: camera.sourceLabel || "展示設備（無真實位址）", resolution: camera.resolution || "1920×1080", enabled: camera.enabled, lastShotAt: camera.lastShotAt, lastSyncAt: camera.lastShotAt, abnormal: camera.health === "異常" }));
  const CAM_STATUSES = data.displayStates.map((state) => ({ key: state.key, label: state.name, masked: state.masked }));
  const BINDINGS: Binding[] = data.bindings.filter((binding) => !binding.ended).map((binding) => {
    const camera = data.cameras.find((item) => item.id === binding.babies[0]?.cameraId) ?? data.cameras[0];
    const window = effectiveViewingWindow(data, camera, "internal").window;
    return { id: binding.id, room: binding.room || "托嬰", motherName: binding.motherName, babyName: binding.babies.map((baby) => data.subjects.find((subject) => subject.id === baby.babyId)?.name ?? "寶寶").join("、") || "待指派", camIds: binding.babies.map((baby) => baby.cameraId), statusKey: binding.babies[0]?.state ?? "normal", openFrom: window.start ?? "00:00", openTo: window.end ?? "23:59", validFrom: binding.validFrom, validTo: binding.validTo, mamaPhone: binding.phone, mamaCode: binding.passcode, familyCode: binding.passcode, familyWhitelist: [binding.phone] };
  });
  return {
    CAMERAS, BINDINGS, CAM_STATUSES,
    CAMERA_BY_ID: Object.fromEntries(CAMERAS.map((camera) => [camera.id, camera])),
    STATUS_BY_KEY: Object.fromEntries(CAM_STATUSES.map((state) => [state.key, state])),
    BINDING_BY_ROOM: Object.fromEntries(BINDINGS.map((binding) => [binding.room, binding])),
    CAM_SUMMARY: { total: CAMERAS.length, bound: new Set(BINDINGS.flatMap((binding) => binding.camIds)).size, twins: BINDINGS.filter((binding) => binding.camIds.length > 1).length, abnormal: CAMERAS.filter((camera) => camera.abnormal).length },
  };
}
