"use client";

/*
  寬鬆驗證（客戶 2026-10-30：全站還在需求確認中，檢查只要提醒就好，不要硬擋下來）。

  `guard(條件, 訊息)` 取代 `throw new Error(訊息)`：條件不成立時把訊息收下來、流程照走，
  呼叫端用 `takeWarnings()` 取出顯示成浮出提示。使用者看得到哪裡不合規，但 DEMO 走得下去。

  ⚠️ 只有「業務規則」適合放行——必填、格式、時序、流程順序這類。
  **資料完整性不要用 guard**：找不到記錄、監視器／車號被別人占用、權限不足、
  已簽署合約的保護，這些放行會寫出壞資料，後面的畫面反而會爆掉或顯示錯的東西，
  比擋在這裡更難對客戶解釋。那些仍然 throw。

  ⚠️ 警告是**跨呼叫累積**的，所以每個動作做完都要 takeWarnings()（UI 的 run helper 會做）。
  沒取走的話下一個動作會看到上一個留下的訊息。
*/

let pending: string[] = [];

/** 條件不成立就記一筆警告，但不中斷流程。 */
export function guard(ok: boolean, message: string): void {
  if (!ok && !pending.includes(message)) pending.push(message);
}

/** 取出並清空目前累積的警告。 */
export function takeWarnings(): string[] {
  const out = pending;
  pending = [];
  return out;
}

/** 丟掉累積的警告（動作在更前面就 throw 了，殘留的訊息不該算在下一個動作頭上）。 */
export function clearWarnings(): void {
  pending = [];
}

/**
 * 動作做完後統一回報：有被放行的缺項就顯示黃色警告（動作仍然做了），否則顯示成功訊息。
 * 各頁的 run helper 都走這支，避免每頁各寫一次「要不要取警告」。
 */
export function report(toast: { ok: (message: string) => void; warn: (message: string) => void }, success: string): void {
  const warnings = takeWarnings();
  if (warnings.length) toast.warn(`${success}\n仍待補：${warnings.join("；")}`);
  else toast.ok(success);
}

/**
 * 動作被 throw 擋下時的回報：先丟掉這一輪已收集的警告，再顯示錯誤。
 * 不清掉的話，下一個動作成功時會把上一次的缺項一起報出來。
 */
export function reportFail(toast: { fail: (message: string) => void }, error: unknown, fallback = "操作失敗。"): void {
  clearWarnings();
  toast.fail(error instanceof Error ? error.message : fallback);
}
