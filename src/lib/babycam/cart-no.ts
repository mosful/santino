/**
 * 嬰兒車編號。
 *
 * 院方 10/12 會議的歸位流程要比對「寶寶 ↔ 車號 ↔ 監視器」三者是否一致，所以
 * 指派時與掃碼核對時必須用**同一套**正規化規則——兩邊各寫一份，遲早會在
 * 「A-07 和 a07 是不是同一台」這種地方對不起來。
 *
 * ⚠️ 實際的編號規則尚未向院方確認，目前採寬鬆格式（英數與連字號，1–10 碼）。
 * 確認後把 PATTERN 收緊即可，呼叫端不受影響。
 */

const PATTERN = /^[A-Z0-9-]{1,10}$/;

/**
 * 正規化使用者輸入的車號；格式不符時回 null。
 *
 * 去掉所有空白而不只是頭尾：現場用平板輸入，「A - 07」這種中間多敲一格的情況
 * 比想像中常見，而它和「A-07」指的是同一台車。
 */
export function normalizeCartNo(raw: string): string | null {
  const compact = raw.replace(/\s+/g, "").toUpperCase();
  if (!compact) return null;
  return PATTERN.test(compact) ? compact : null;
}
