import type { CareSubject } from "../care/types";
import type { PrintSettings } from "../babycam/wristband-print";
import type { DemoScenario } from "../babycam/demo-scenario";

/** 空房房卡可切換的房況（v24 §3）；入住中的房況由住客狀態推導，不存在這裡。 */
export type RoomServiceStatus = "空房" | "打掃中" | "報修中";

export const CASE_STAGES = ["預約", "參觀", "下訂", "合約", "入住前", "入住中", "退房"] as const;
export type CaseStage = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export type ReservationInput = {
  category: string; name: string; phone: string; dueDate: string; parity: string;
  deliveryMethod: string; hospital: string; visitDate: string; visitTime: string;
  source: string; receptionist: string; note: string;
};
export type CaseRecord = {
  id: string; legacyId: number; customerId: string; name: string; phone: string; dueDate: string; idNo: string;
  stage: CaseStage; closed: boolean; forced: boolean; previousStage?: CaseStage;
  owner: string; room: string; roomType: "精緻" | "VIP" | "VILLA"; days: number;
  contractNo: string; deposit: number; tasting: boolean; visitDate: string; visitStatus: string;
  source: string; hospital: string; priceClass: string; corporateCompany: string; note: string;
  category: string; parity: string; deliveryMethod: string; visitTime: string; receptionist: string;
  visitIntent: string; visitNote: string; orderDate: string; paymentMethod: string; orderNote: string;
  quotedAmount: number; overrideAmount: number | null; overrideReason: string;
  signed: boolean; signature?: string; contractVersion: number; contractSnapshot?: string;
  reviewStart: string; signedDate: string; actualAdmission: string;
  dischargedAt: string; settlementDone: boolean;
  /** 返家檢查表（手冊 S-F-012）逐項狀態，key＝checkout.ts 的 INSPECTION_ITEMS。 */
  roomInspection?: Record<string, { status: "正常" | "異常"; reason?: string }>;
  /** 返家指導單的品項發出／歸還數，key＝返家品項主檔的 id。 */
  returnItems?: Record<string, { issued: number; returned: number }>;
  /** 返家指導單的應付款項 A–E。 */
  returnCharges?: { jaundice: number; childcare: number; chinese: number; hair: number; other: number; note: string };
  /** 返家應收已寫進帳務的那一筆 ledger id，避免重複寫入。 */
  returnChargeEntryId?: string;
  prenatalContactDone: boolean; hospitalizationNoticeDone: boolean; dischargeNoticeDone: boolean;
  preAdmissionPapersDone: boolean; admissionGuidanceDone: boolean; admissionPaymentNoticeDone: boolean;
  /** 櫃台單據（入住前關懷、餐飲通知、嬰兒通知、保全資訊、繳款通知），key＝caseDocs.ts 的表單 key。 */
  documents?: Record<string, { values: Record<string, string>; savedAt: string; actor: string }>;
  checkoutNote: string; checkoutStartedAt?: string; checkoutCompletedAt?: string;
  childcare: boolean; childcareEnded: boolean; childcareCar: string; childcareDays: number; childcareFee: number; childcareContact: string;
  completed: number[]; draftAt?: string;
  ledger: { id: string; date: string; label: string; amount: number; adjustsId?: string; before?: number; after?: number; actor?: string; at?: string; /** 指定為贈送日而產生的折讓，值＝該日日期。 */ giftDate?: string }[];
  payments: { id: string; date: string; amount: number; method: string; note: string; actor: string; at: string }[];
  log: { id: string; at: string; actor: string; text: string }[];
  customerDetails?: { level: string; parity: string; birthday: string; referrer: string; mainNurse: string; lineBound: boolean; family: string; address?: string; emergencyContact?: string; emergencyRelation?: string; emergencyPhone?: string; companion?: string; roomingIn?: string; mealSummary?: string };
  addOns?: string[]; bossGift?: string; milkConsent?: boolean; chineseConsent?: boolean;
  milkChoice?: string;
  contractV2Snapshot?: string;
  meal?: { people: number; content: string; at: string; actor: string };
  returnPhotos?: string[]; returnEmail?: string; returnMailLog?: { at: string; actor: string; email: string }[];
  roomMoves?: { from: string; to: string; at: string; reason: string; actor: string }[];
  proxySigned?: boolean; proxyName?: string; contractStamp?: string;
};
/** 返家歸還品項主檔：名稱、單位、單價、預設發出數。 */
export type CheckoutItem = { id: string; name: string; unit: string; price: number; defaultQty: number };
export type CameraRecord = { id: string; code: string; zone: "A" | "B"; enabled: boolean; health: "正常" | "等待" | "異常"; lastShotAt: string; scheduleInternal: WindowRule; scheduleFamily: WindowRule; baseline: boolean; codec?: string; sourceType?: string; sourceLabel?: string; resolution?: string };
export type WindowRule = { mode: "inherit" | "always" | "closed" | "scheduled"; start: string; end: string };
export type DisplayState = {
  key: string;
  name: string;
  masked: boolean;
  /** 院方自行上傳、存在瀏覽器 IndexedDB 的背景圖 id；有值時蓋過 defaultImage。 */
  image?: string;
  /** 內建背景圖的靜態路徑（public/state-backgrounds/*.webp），隨程式一起出貨。 */
  defaultImage?: string;
};
export type BabyBinding = { babyId: string; cameraId: string; cartNo: string; identityCode: string; state: string; careMode: boolean; careSince?: string; birthOrder?: number };
export type ViewingBinding = {
  id: string; caseId: string; room: string; motherName: string; phone: string;
  validFrom: string; validTo: string; familyEnabled: boolean; familyFrom: string; familyTo: string;
  internalWindow: WindowRule; familyWindow: WindowRule;
  internalTicket: string; familyTicket: string; passcode: string; babies: BabyBinding[];
  sessions: { id: string; audience: "internal" | "family"; lastSeen: string }[];
  ended: boolean;
  viewingRevoked?: boolean;
};
export type DemoDomain = {
  /** 示範資料結構版本；不符時 domainStore 會丟棄本機資料重新播種。 */
  version: 4; subjects: CareSubject[]; cases: CaseRecord[]; cameras: CameraRecord[]; bindings: ViewingBinding[];
  /** 監視器與繼電器板的網段前綴；真值不進版控，見 lib/babycam/network.ts 的說明。 */
  networkPrefix?: string;
  displayStates: DisplayState[]; houseWindow: WindowRule; internalWindow: WindowRule; familyWindow: WindowRule;
  enforceInternal: boolean; enforceFamily: boolean; familyLimit: number; concurrencyEnforced: boolean;
  demoAt: string; viewScenario: "normal" | "stale" | "fault" | "cart-away";
  lightColors: Record<string, string>; relayChannels: Record<string, boolean>;
  audit: { id: string; at: string; actor: string; action: string; target: string }[];
  careEvents: { id: string; bindingId: string; babyId: string; start: string; end: string | null; actor: string }[];
  staff: { id: string; name: string; role: string; enabled: boolean }[];
  sectionPermissions: Record<string, string[]>;
  printSettings: PrintSettings;
  rooms: { room: string; roomType: "精緻" | "VIP" | "VILLA"; enabled: boolean; typeId?: string; serviceStatus?: RoomServiceStatus }[];
  roomTypes: { id: string; name: string; priceCategory: "精緻" | "VIP" | "VILLA" }[];
  lightLabels: Record<string, string>;
  viewingHistory: { id: string; bindingId: string; deviceId: string; audience: "internal" | "family"; start: string; lastSeen: string; end: string | null; reason: string }[];
  tasks: { id: string; date: string; category: string; title: string; caseId?: string }[];
  /** 返家品項與單價主檔（後台「基礎主檔設定」維護，手冊第 38 頁）。 */
  checkoutItems?: CheckoutItem[];
  handledTasks: string[];
  contractSettings: { reviewDays: number; templates: { id: number; name: string; version: string; active: boolean; createdDate: string; clauses: string }[] };
  demoScenarios: Record<string, DemoScenario>;
  detection: { enabled: boolean; threshold: number; streak: number; intervalSeconds: number; maxAgeSeconds: number };
  cameraIntervals: { id: string; bindingId: string; babyId: string; cameraId: string; start: string; end: string | null }[];
};
