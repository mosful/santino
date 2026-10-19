"use client";

import { domainStore } from "./domainStore";
import { careStore, careActions } from "../care/store";
import { clearCarePhotos } from "../care/media";
import { getCurrentRole } from "../roleStore";

export async function resetIntegratedDemo() {
  if (getCurrentRole() !== "管理者") throw new Error("僅管理員可還原整合展示資料。");
  await clearCarePhotos(); domainStore.reset(); careStore.reset(); careActions.syncRole();
}
