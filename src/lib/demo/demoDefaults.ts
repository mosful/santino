/**
 * DEMO 展示用的預設填寫值。
 *
 * 客戶 2026-10-22 指示：展示時每開一張單都要重打姓名電話很費事，
 * 所有「要填資料」的畫面一律先帶好同一組假資料，點開就能往下走。
 *
 * ⚠️ 這是示範值不是驗證規則：欄位仍可改、仍會驗必填；
 * 真資料（案件既有的姓名電話）一律優先，只有空白時才補這組。
 * 全部走這個檔，不要在各頁面各打一組字串。
 */
export const DEMO_PHONE = "0912345678";
export const DEMO_MOTHER_NAME = "王OO媽媽";
export const DEMO_BABY_NAME = "王OO之子";

/** 有值就用有值的，空白才帶 DEMO 預設。 */
export const orDemo = (value: string | undefined | null, fallback: string) => (value && value.trim() ? value : fallback);
