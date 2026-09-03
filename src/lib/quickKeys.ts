/**
 * 房卡作業頁籤（原房卡快捷鍵）共用型別。
 * 媽媽照護、寶寶照護、房間動態三頁共用，供 CareTabs 與各 CarePanel 使用。
 */
export type QuickKey = {
  key: string;
  label: string;
  core: boolean; // 核心功能＝Phase 1，其餘為 Phase 2
  hasSignature?: boolean; // 含簽名步驟：依總則#9，切換到此頁籤時強制鎖定單一房間
};

/**
 * 作業視窗要顯示的頁籤順序：核心功能一律排左邊、次要功能排右邊，不穿插。
 * 原始陣列是依業務順序排列（核心與次要交錯），故顯示時重新分組，
 * 但兩組內部各自維持原本的業務順序不動。
 */
export function orderedTabs(keys: QuickKey[], showSecondary: boolean): QuickKey[] {
  const core = keys.filter((k) => k.core);
  if (!showSecondary) return core;
  return [...core, ...keys.filter((k) => !k.core)];
}
