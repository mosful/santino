/**
 * 櫃台表單的共用選項清單 —— 全站唯一來源。
 *
 * ⚠️ 這些字串以前散在 CaseWorkspace、ContractSteps、NewContract、customer、care/forms
 * 各寫一份，客戶手冊（`Document/聖帝諾產後護理之家/產後護理系統(櫃台).pdf`）比對後發現
 * 院內兩家醫院與特約企業都寫錯，而且只改到其中幾處。要改就只改這裡。
 */

/**
 * 生產醫院選項。
 *
 * 依客戶手冊第 3 頁「貴賓參觀資料卡」的預定生產醫院欄位：璟馨婦幼醫院／詠馨婦幼中心／其他；
 * 第 20 頁入住須知亦提到「停車位保留 2 位供詠馨婦產科醫師緊急接生使用」。
 * 原本寫的「景星（園內）／永新（園內）」是錯的。
 */
export const HOSPITALS = ["璟馨婦幼醫院（院內）", "詠馨婦幼中心（院內）", "成大", "奇美", "其他"] as const;

/**
 * 櫃台用的生產醫院選單＝內建清單＋院方自行新增的。
 *
 * 櫃台在新增預約選「其他」時可直接打新的院所名，存檔就併進 data.hospitals，
 * 之後所有生產醫院下拉都看得到（客戶 2026-10-29），要改名或移除走
 * 「後台管理 → 基礎主檔設定」。「其他」固定排最後，它是入口不是選項。
 */
export function hospitalOptions(custom: readonly string[] = []): string[] {
  const builtin = HOSPITALS.filter((item) => item !== "其他");
  const extra = custom.filter((item) => item.trim() && !builtin.includes(item as typeof builtin[number]));
  return [...builtin, ...extra, "其他"];
}

/** 判斷是不是「其他」這個入口選項；自行輸入的院所名不算。 */
export const OTHER_HOSPITAL = "其他";

/** 照護表單用的簡短版（欄位寬度有限，不放全名）；不跟著後台自訂清單走，它問的是病歷填寫慣用寫法。 */
export const HOSPITALS_SHORT = ["璟馨（院內）", "詠馨（院內）", "成大", "奇美", "其他"] as const;

/**
 * 特約企業 —— 客戶手冊第 8 頁明列：台積電、台灣康寧、華邦電子、科林研發。
 * 原本清單裡的「宇沛永續」是我方公司，不該出現在客戶的特約名單。
 */
export const CORPORATE_COMPANIES = ["台積電", "台灣康寧", "華邦電子", "科林研發"] as const;

/** 常用住房天數（對應手冊第 47 頁月統計表的天數級距：0-14／15-21／21+1／28+2／30）。 */
export const COMMON_STAY_DAYS = [14, 21, 28, 30] as const;

export type HospitalTier = "院內" | "成大奇美" | "院外";

/** 把生產醫院字串歸到價目表的三個級距；舊資料的「園內」「成大／奇美」也要認得。 */
export function hospitalTier(hospital: string): HospitalTier {
  if (hospital.includes("院內") || hospital.includes("園內")) return "院內";
  if (hospital.includes("成大") || hospital.includes("奇美")) return "成大奇美";
  return "院外";
}
