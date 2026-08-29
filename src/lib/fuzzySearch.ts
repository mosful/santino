/**
 * 輕量模糊搜尋：優先比對「包含子字串」，找不到再退回「依序子序列」比對
 * （例如查詢字「王婷」可模糊比對到「王雅婷」），不需要額外套件。
 */
export function fuzzyMatch(query: string, target: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const t = target.toLowerCase();
  if (t.includes(q)) return true;

  let qi = 0;
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) qi++;
  }
  return qi === q.length;
}

/** 查詢字串是否模糊比對到 row 的任一欄位值 */
export function rowMatchesQuery(row: Record<string, unknown>, query: string): boolean {
  const q = query.trim();
  if (!q) return true;
  return Object.values(row).some((v) => fuzzyMatch(q, String(v ?? "")));
}
