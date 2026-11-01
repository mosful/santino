"use client";

import { useEffect, useSyncExternalStore } from "react";
import { domainStore, useDomainStore } from "../demo/domainStore";
import { demoNow } from "./clock";

function subscribe(listener: () => void) {
  const timer = window.setInterval(listener, 1000);
  const resume = () => listener();
  window.addEventListener("focus", resume);
  document.addEventListener("visibilitychange", resume);
  return () => { window.clearInterval(timer); window.removeEventListener("focus", resume); document.removeEventListener("visibilitychange", resume); };
}

/** 只更新畫面時鐘；不每秒覆寫整份案件與帳務資料。 */
export function useLiveBabycamData() {
  const snapshot = useDomainStore();
  const tick = useSyncExternalStore(subscribe, () => Math.floor(Date.now() / 1000), () => 0);
  useEffect(() => {
    if (!domainStore.get().demoClockStartedAt) domainStore.update((data) => { data.demoClockStartedAt ??= new Date().toISOString(); });
  }, []);
  return {
    ...snapshot,
    data: tick ? { ...snapshot.data, demoAt: demoNow(snapshot.data, tick * 1000).toISOString(), demoClockStartedAt: undefined } : snapshot.data,
  };
}
