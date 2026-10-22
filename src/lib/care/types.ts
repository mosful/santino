export type CareKind = "mama" | "baby";
export type CareSignatureRole = "recipient" | "executor" | "evaluator";
export type CareValues = Record<string, string | string[]>;
export type CareSubject = {
  id: string;
  caseId: string;
  kind: CareKind;
  room: string;
  carNo?: string;
  /**
   * 托嬰寶寶的媽媽退房前住的房號。
   *
   * 托嬰案件沒有房號、只有車號（v24 §4.6），但現場仍要知道「這是哪一房的寶寶」。
   * 退房轉托嬰時 room 會被清空，所以清空前要把原房號留在這裡，不要靠 room 回推。
   */
  previousRoom?: string;
  name: string;
  motherName: string;
  chartNo: string;
  status: string;
  stayDay: number;
  birthDate?: string;
  gender?: string;
  birthOrder?: number;
  historical?: boolean;
  dischargedAt?: string;
};
export type CareDocument = {
  key: string;
  subjectId: string;
  formKey: string;
  values: CareValues;
  dirty: boolean;
  savedAt?: string;
  signedAt?: string;
  author?: string;
  signature?: string;
  signatures?: Partial<Record<CareSignatureRole, string>>;
  staffStamp?: { author: string; at: string };
  viewport?: { sectionIndex: number; scrollY: number };
  /** 正在修改的既有紀錄 id；有值時簽出是「改這一筆」而不是新增一筆。 */
  editingEntryId?: string;
};
export type CareEntry = {
  id: string;
  subjectId: string;
  formKey: string;
  at: string;
  author: string;
  values: CareValues;
  signature?: string;
  signatures?: Partial<Record<CareSignatureRole, string>>;
  staffStamp?: { author: string; at: string };
  historical: boolean;
  /** 簽出後的每次修改：誰、何時、改了哪一張表（客戶要求已簽出紀錄可改但留紀錄）。 */
  revisions?: { at: string; author: string; note: string }[];
};
export type CareEvent = { id: string; at: string; subjectId: string; author: string; action: string };
export type CareState = {
  version: 1;
  documents: Record<string, CareDocument>;
  open: string[];
  active: Record<CareKind, string | null>;
  unlockedCase: string | null;
  entries: CareEntry[];
  events: CareEvent[];
  authorizations: Record<string, { reason: string; author: string; at: string }>;
  personalPhrases: Record<string, string[]>;
  backfillDays: number;
  lastRole?: string;
};
export type CareField = {
  key: string;
  label: string;
  type?: "text" | "number" | "date" | "time" | "textarea" | "select" | "multiple" | "photo";
  options?: string[];
  required?: boolean;
  min?: number;
  max?: number;
};
export type CareSection = { label: string; fields: CareField[] };
export type CareForm = { key: string; label: string; sections: CareSection[]; signature?: boolean };
