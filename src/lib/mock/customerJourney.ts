/**
 * 首頁漏斗用的媽媽案件視圖型別。
 *
 * ⚠️ 階段定義（名稱、說明、圖示、檢核清單）**不在這裡**，在 `lib/domain/stages.ts`。
 * 這個檔案以前自己維護一套六階段的叫法（諮詢參觀／簽約／退宿／返家後…），
 * 與案件流程的七階段各說各話，客戶回報「用詞非常凌亂」——不要再把階段字串寫回來。
 */
import type { JourneyStageKey } from "../domain/stages";

export type { JourneyStageKey };
export { JOURNEY_STAGES, stageDefinition, type StageDefinition } from "../domain/stages";

export type JourneyMother = {
  id: number;
  name: string;
  stage: JourneyStageKey;
  status: string;
  dueDate?: string;
  room?: string;
  stayDay?: string;
  owner: string;
  nextAction: string;
  actionDate: string;
  urgency: "overdue" | "today" | "upcoming" | "normal";
  tags: string[];
};
