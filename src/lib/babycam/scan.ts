import type { DemoDomain, ViewingBinding } from "@/lib/domain/types";

/** 選擇限於目前案件；單胞胎自動帶入，多胞胎保留標籤深連結或人工選擇。 */
export function expectedReturnBaby(binding: ViewingBinding | undefined, selectedId: string, initialCode = "") {
  if (!binding) return undefined;
  return binding.babies.find((baby) => baby.babyId === selectedId)
    ?? (binding.babies.length === 1 ? binding.babies[0] : undefined)
    ?? binding.babies.find((baby) => initialCode && baby.identityCode === initialCode);
}

/** QR 可能包含識別碼或既有標籤網址；僅讀取內容，不導向掃到的網址。 */
export function readIdentityCode(value: string) {
  const raw = value.trim();
  if (!raw) throw new Error("請先掃描標籤或輸入識別碼。");
  if (/^https?:\/\//i.test(raw) || raw.startsWith("/")) {
    const url = new URL(raw, "https://label.invalid");
    const code = url.searchParams.get("code")?.trim();
    if (!/\/babycam\/scan\/?$/.test(url.pathname) || !code || !/^[a-z0-9-]+$/i.test(code)) {
      throw new Error("這不是寶寶識別標籤，請掃描手圈或嬰兒車上的 QRCode。");
    }
    return code;
  }
  if (!/^[a-z0-9-]+$/i.test(raw)) throw new Error("識別碼格式不正確，請重新掃描或輸入標籤上的識別碼。");
  return raw;
}

/** 依識別碼找出入住中的寶寶（忽略大小寫與符號）；離開與歸位掃碼共用同一套比對。 */
export function findBabyByCode(data: Pick<DemoDomain, "bindings">, code: string) {
  const normalize = (value: string) => value.toUpperCase().replace(/\W/g, "");
  const target = normalize(code);
  return data.bindings.filter((binding) => !binding.ended).flatMap((binding) => binding.babies.map((baby) => ({ binding, baby }))).find((item) => normalize(item.baby.identityCode) === target);
}
