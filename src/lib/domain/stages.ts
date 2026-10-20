import type { LucideIcon } from "lucide-react";
import { Archive, BedDouble, CalendarCheck, ClipboardCheck, DoorOpen, FileSignature, HandCoins, House } from "lucide-react";
import { CASE_STAGES } from "./types";

/**
 * 案件流程階段 —— 全站唯一的階段用詞來源。
 *
 * ⚠️ 階段名稱只有一組：`CASE_STAGES`（v24 §4.3 的七階段）。
 * 以前首頁漏斗另有一套六階段的叫法（諮詢參觀／簽約／退宿／返家後…），
 * 同一件事在首頁、案件列表與案件流程頁各叫各的，客戶實際回報「用詞非常凌亂」。
 * 要新增或改名階段，**只改這裡與 `types.ts` 的 `CASE_STAGES`**，不要在元件或
 * mock 裡另外寫一組字串。
 *
 * 「已結案」不是第八個階段，是**漏斗專用的收尾欄位**：媽媽退房後案件就結案，
 * 但寶寶可能續留托嬰，仍需要一個位置看得到這些案子。它不會出現在案件流程頁的
 * 七點進度條上。
 */

export type CaseStageName = (typeof CASE_STAGES)[number];
/** 漏斗用的階段鍵：七個正式階段＋收尾的「已結案」。 */
export type JourneyStageKey = CaseStageName | "已結案";

export type StageTone = "sky" | "violet" | "amber" | "emerald" | "orange" | "rose" | "slate" | "teal";

export type StageDefinition = {
  key: JourneyStageKey;
  /** 顯示名稱＝階段鍵本身。全站一律用這個字，沒有第二種叫法。 */
  label: JourneyStageKey;
  description: string;
  icon: LucideIcon;
  color: StageTone;
  /** 這個階段該完成什麼（首頁漏斗的檢核清單）。 */
  checklist: string[];
  links: { label: string; href: string; hint: string }[];
};

export const JOURNEY_STAGES: StageDefinition[] = [
  {
    key: "預約",
    label: "預約",
    description: "建立客戶基本資料與需求，約定參觀時間",
    icon: CalendarCheck,
    color: "sky",
    checklist: ["已建立客戶基本資料", "已記錄預產期與需求", "已約定參觀日期與時段"],
    links: [
      { label: "建立客戶資料", href: "/customer", hint: "基本資料與需求紀錄" },
      { label: "參觀排程", href: "/admin?tab=visit", hint: "新增與調整預約" },
      { label: "參觀提醒", href: "/care?tab=visit", hint: "行前提醒與未到追蹤" },
    ],
  },
  {
    key: "參觀",
    label: "參觀",
    description: "參觀出席登記、套餐試算與試吃收據",
    icon: DoorOpen,
    color: "violet",
    checklist: ["已完成參觀出席登記", "已出具套餐試算單", "試吃收據已開立（可折抵尾款）"],
    links: [
      { label: "參觀提醒", href: "/care?tab=visit", hint: "行前提醒與未到追蹤" },
      { label: "簽約提醒", href: "/care?tab=contract-reminder", hint: "參觀後意願追蹤" },
      { label: "客戶資料", href: "/customer", hint: "參觀紀錄與需求更新" },
    ],
  },
  {
    key: "下訂",
    label: "下訂",
    description: "建立收字號、確認房型天數並收取訂金",
    icon: HandCoins,
    color: "amber",
    checklist: ["收字號已建立（即合約編號）", "房型與入住天數已確認", "訂金已收取並入帳"],
    links: [
      { label: "合約查詢", href: "/contract?tab=list", hint: "訂金、天數與房型" },
      { label: "房況總覽", href: "/#room-status-title", hint: "確認可排房型與檔期" },
      { label: "客戶資料", href: "/customer", hint: "下訂內容與聯絡紀錄" },
    ],
  },
  {
    key: "合約",
    label: "合約",
    description: "合約書簽署、審閱期與母乳哺育意願書",
    icon: FileSignature,
    color: "emerald",
    checklist: ["攜回審閱日與簽約日符合審閱期", "合約書已完成簽署", "母乳哺育意願書與哺餵方式已確認"],
    links: [
      { label: "新增合約", href: "/contract?tab=new", hint: "建立合約與電子簽名" },
      { label: "合約條款檢視", href: "/contract?tab=terms", hint: "條款版本與簽名" },
      { label: "簽約提醒", href: "/care?tab=contract-reminder", hint: "審閱期與回訪提醒" },
    ],
  },
  {
    key: "入住前",
    label: "入住前",
    description: "產前關懷、住院通知、排房與入住文件",
    icon: ClipboardCheck,
    color: "orange",
    checklist: ["產前關懷電話已完成", "已取得實際入住日並完成排房", "入住指導單與繳款通知單已備妥"],
    links: [
      { label: "入住前關懷", href: "/care?tab=pre-admission", hint: "生產與報到時間確認" },
      { label: "房況總覽", href: "/#room-status-title", hint: "排房、清潔與床位準備" },
      { label: "月子餐設定", href: "/meal?tab=order", hint: "禁忌與首日餐點" },
    ],
  },
  {
    key: "入住中",
    label: "入住中",
    description: "母嬰照護、每日收費、餐食與合約異動",
    icon: BedDouble,
    color: "rose",
    checklist: ["母嬰基本評估已完成", "每日照護與餐食狀態正常", "合約變更與自費項目已登錄"],
    links: [
      { label: "媽媽照護", href: "/mama", hint: "媽媽評估與護理紀錄" },
      { label: "寶寶照護", href: "/baby", hint: "寶寶動態與照護紀錄" },
      { label: "合約變更", href: "/contract?tab=change-order", hint: "續住、換房與加購" },
      { label: "醫師巡診", href: "/doctor", hint: "巡診排程與結果" },
    ],
  },
  {
    key: "退房",
    label: "退房",
    description: "尾款結算、返家檢查表與房間點交",
    icon: House,
    color: "slate",
    checklist: ["尾款與自費項目已結清", "返家檢查表已完成點交", "返家照片已留存並寄出"],
    links: [
      { label: "合約到期", href: "/contract?tab=renewal", hint: "到期、續住或提前退房" },
      { label: "房況總覽", href: "/#room-status-title", hint: "退房、清潔與物品點交" },
      { label: "返家關懷", href: "/care?tab=home-return", hint: "建立返家追蹤排程" },
    ],
  },
  {
    key: "已結案",
    label: "已結案",
    description: "返家關懷、寶寶續留托嬰與歷程封存",
    icon: Archive,
    color: "teal",
    checklist: ["已建立返家關懷排程", "寶寶續留時已另立托嬰合約", "本次入住歷程已封存"],
    links: [
      { label: "托嬰合約", href: "/contract?tab=childcare", hint: "另立合約、車號與接回安排" },
      { label: "寶寶照護", href: "/baby", hint: "續留期間照護與健康紀錄" },
      { label: "返家關懷", href: "/care?tab=home-return", hint: "電話關懷與異常轉介" },
      { label: "客戶資料", href: "/customer", hint: "封存本次入住完整歷程" },
    ],
  },
];

const BY_KEY = new Map(JOURNEY_STAGES.map((stage) => [stage.key, stage]));

export function stageDefinition(key: JourneyStageKey): StageDefinition {
  return BY_KEY.get(key) ?? JOURNEY_STAGES[0];
}

/** 由案件的 stage 索引（0–6）取得階段名稱；結案案件請自行改用「已結案」。 */
export function caseStageName(stage: number): CaseStageName {
  return CASE_STAGES[Math.min(Math.max(stage, 0), CASE_STAGES.length - 1)];
}
