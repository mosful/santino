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
};

/*
  ⚠️ 這裡以前每個階段還掛一組 `links`（3～4 個通往其他模組的捷徑），由首頁漏斗
  右側的「○○階段相關功能」渲染，八個階段合計 26 個連結。客戶回報「入口太多」，
  2026-10-21 連同那個區塊一起移除——那些模組在側邊欄或首頁常用功能列都進得去，
  而且其中 `/admin?tab=visit` 根本不存在，點了只會落到後台第一個頁籤。
  要再加捷徑前請先確認：這個入口在別處是不是已經有了。
*/

export const JOURNEY_STAGES: StageDefinition[] = [
  {
    key: "預約",
    label: "預約",
    description: "建立客戶基本資料與需求，約定參觀時間",
    icon: CalendarCheck,
    color: "sky",
    checklist: ["已建立客戶基本資料", "已記錄預產期與需求", "已約定參觀日期與時段"],
  },
  {
    key: "參觀",
    label: "參觀",
    description: "參觀出席登記、套餐試算與試吃收據",
    icon: DoorOpen,
    color: "violet",
    checklist: ["已完成參觀出席登記", "已出具套餐試算單", "試吃收據已開立（可折抵尾款）"],
  },
  {
    key: "下訂",
    label: "下訂",
    description: "建立收字號、確認房型天數並收取訂金",
    icon: HandCoins,
    color: "amber",
    checklist: ["收字號已建立（即合約編號）", "房型與入住天數已確認", "訂金已收取並入帳"],
  },
  {
    key: "合約",
    label: "合約",
    description: "合約書簽署、審閱期與母乳哺育意願書",
    icon: FileSignature,
    color: "emerald",
    checklist: ["攜回審閱日與簽約日符合審閱期", "合約書已完成簽署", "母乳哺育意願書與哺餵方式已確認"],
  },
  {
    key: "入住前",
    label: "入住前",
    description: "產前關懷、住院通知、排房與入住文件",
    icon: ClipboardCheck,
    color: "orange",
    checklist: ["產前關懷電話已完成", "已取得實際入住日並完成排房", "入住指導單與繳款通知單已備妥"],
  },
  {
    key: "入住中",
    label: "入住中",
    description: "母嬰照護、每日收費、餐食與合約異動",
    icon: BedDouble,
    color: "rose",
    checklist: ["母嬰基本評估已完成", "每日照護與餐食狀態正常", "合約變更與自費項目已登錄"],
  },
  {
    key: "退房",
    label: "退房",
    description: "尾款結算、返家檢查表與房間點交",
    icon: House,
    color: "slate",
    checklist: ["尾款與自費項目已結清", "返家檢查表已完成點交", "返家照片已留存並寄出"],
  },
  {
    key: "已結案",
    label: "已結案",
    description: "返家關懷、寶寶續留托嬰與歷程封存",
    icon: Archive,
    color: "teal",
    checklist: ["已建立返家關懷排程", "寶寶續留時已另立托嬰合約", "本次入住歷程已封存"],
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
