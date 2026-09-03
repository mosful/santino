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
