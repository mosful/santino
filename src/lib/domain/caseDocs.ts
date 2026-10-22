import type { CaseRecord } from "./types";
import { HOSPITALS } from "./options";
import { caseBalance } from "./rules";
import { DEMO_BABY_NAME, DEMO_MOTHER_NAME, DEMO_PHONE, orDemo } from "../demo/demoDefaults";

/**
 * 櫃台在案件流程裡要填、要印的紙本單據 —— 欄位全部照客戶手冊抄。
 *
 * 來源：`Document/聖帝諾產後護理之家/產後護理系統(櫃台).pdf`
 * 第 26 頁入住前關懷表單（S-F-001）、第 27 頁入住餐飲通知單、第 28 頁嬰兒入住通知單、
 * 第 29 頁入住資訊-保全部、第 35 頁繳款通知單。
 *
 * ⚠️ 五張單共用同一組欄位結構與同一個渲染器，不要各寫一個元件：
 * 它們都是「一張表、一堆欄位、存檔、列印」，分開寫只會讓之後加單愈來愈貴。
 * `prefill` 負責開發總則第 3 條「重複輸入自動帶入」——房號、姓名、入住期間不要再抄一次。
 */

export type DocFieldType = "text" | "date" | "time" | "number" | "select" | "multiple" | "textarea";
export type DocField = { key: string; label: string; type?: DocFieldType; options?: string[]; wide?: boolean };
export type DocSection = { label: string; fields: DocField[] };
export type CaseDoc = {
  key: string;
  label: string;
  /** 對應「入住前時間軸」的哪一個勾選項目；填完存檔會把它打勾。 */
  timelineKey?: keyof Pick<
    CaseRecord,
    "prenatalContactDone" | "hospitalizationNoticeDone" | "dischargeNoticeDone" | "preAdmissionPapersDone" | "admissionGuidanceDone" | "admissionPaymentNoticeDone"
  >;
  /** 沒有對應時間軸項目的單據，掛在案件第幾階段（CASE_STAGES 的索引）。 */
  stage?: number;
  hint: string;
  sections: DocSection[];
  prefill: (record: CaseRecord) => Record<string, string>;
};

const text = (key: string, label: string, wide = false): DocField => ({ key, label, wide });
const date = (key: string, label: string): DocField => ({ key, label, type: "date" });
const select = (key: string, label: string, options: string[]): DocField => ({ key, label, type: "select", options });
const multiple = (key: string, label: string, options: string[]): DocField => ({ key, label, type: "multiple", options, wide: true });
const note = (key: string, label: string): DocField => ({ key, label, type: "textarea", wide: true });

/** 入住期間字串；沒有實際入住日時用預產期提示，不要印出空白。 */
function stayRange(record: CaseRecord) {
  if (!record.actualAdmission) return "";
  const end = new Date(Date.parse(`${record.actualAdmission}T00:00:00+08:00`) + record.days * 86_400_000);
  return `${record.actualAdmission} ～ ${end.toLocaleDateString("en-CA", { timeZone: "Asia/Taipei" })}`;
}

export const CASE_DOCS: CaseDoc[] = [
  {
    key: "prenatal-care",
    label: "入住前關懷表單",
    timelineKey: "prenatalContactDone",
    hint: "預產期前 1 個月致電；手冊 S-F-001。",
    sections: [
      {
        label: "基本資料",
        fields: [
          text("motherName", "產婦姓名"),
          text("motherPhone", "產婦聯絡電話"),
          text("husbandName", "先生姓名"),
          text("husbandPhone", "先生聯絡電話"),
          date("dueDate", "預產期"),
          select("hospital", "生產醫院", [...HOSPITALS]),
        ],
      },
      {
        label: "生產前關懷",
        fields: [
          select("reminded", "已提醒產兆注意事項", ["是", "否"]),
          select("delivery", "生產方式", ["NSD 自然產", "C/S 剖腹產", "未定"]),
          date("deliveryDate", "待產／剖腹日"),
          text("checkupHospital", "產檢醫院"),
          text("checkupDoctor", "產檢醫師"),
          multiple("supplies", "坐月子所需物品", ["個人衛生用品", "個人盥洗用具", "個人衣物", "寶寶返家衣物"]),
          select("feeding", "Baby 餵食計畫", ["母乳", "配方奶", "母乳＋配方奶"]),
        ],
      },
      {
        label: "生產後連繫",
        fields: [
          select("transport", "交通方式", ["自行前往", "輪椅接送"]),
          select("babyCompany", "嬰兒", ["一同入住", "護理人員協助"]),
          select("luggage", "行李", ["門口運送", "到院協助", "需要時連絡"]),
          select("dietType", "飲食", ["葷食", "素食"]),
          multiple("dietAvoid", "飲食禁忌", ["畜肉類", "海鮮類", "蔬果類", "無"]),
          text("dietNote", "其他飲食說明"),
          date("plannedAdmission", "預定入住日"),
          text("butler", "服務管家"),
          text("roomRequest", "借房需求"),
          note("note", "備註"),
        ],
      },
      { label: "簽核", fields: [text("staff", "客房專員"), date("staffDate", "日期"), text("approver", "副總簽核")] },
    ],
    prefill: (record) => ({
      motherName: orDemo(record.name, DEMO_MOTHER_NAME),
      motherPhone: orDemo(record.phone, DEMO_PHONE),
      husbandPhone: DEMO_PHONE,
      dueDate: record.dueDate,
      hospital: record.hospital,
      delivery: record.deliveryMethod === "自然產" ? "NSD 自然產" : record.deliveryMethod === "剖腹產" ? "C/S 剖腹產" : "未定",
      plannedAdmission: record.actualAdmission,
      butler: record.owner,
      staff: record.receptionist,
    }),
  },
  {
    key: "meal-notice",
    label: "入住餐飲通知單",
    timelineKey: "preAdmissionPapersDone",
    hint: "入住前 1 天交餐飲部；加餐每餐 450 元（不含點心）。",
    sections: [
      {
        label: "通知內容",
        fields: [
          text("room", "房號"),
          text("motherName", "媽媽姓名"),
          text("signature", "通知簽章"),
          text("stay", "入住期間", true),
          date("deliveryDate", "生產日"),
          select("delivery", "生產方式", ["自然產", "剖腹產"]),
          text("dietAvoid", "飲食禁忌", true),
          multiple("extraMeals", "加餐（每餐 450 元，不含點心）", ["早餐", "午餐", "晚餐"]),
          note("note", "備註"),
        ],
      },
    ],
    prefill: (record) => ({
      room: record.room,
      motherName: orDemo(record.name, DEMO_MOTHER_NAME),
      stay: stayRange(record),
      delivery: record.deliveryMethod === "剖腹產" ? "剖腹產" : "自然產",
      dietAvoid: record.customerDetails?.mealSummary ?? "",
    }),
  },
  {
    key: "baby-notice",
    label: "嬰兒入住通知單",
    timelineKey: "preAdmissionPapersDone",
    hint: "入住前 1 天交嬰兒室。",
    sections: [
      {
        label: "通知內容",
        fields: [
          text("room", "房號"),
          text("motherName", "媽媽姓名"),
          text("babyName", "寶寶姓名"),
          text("signature", "通知簽章"),
          text("weeks", "週數"),
          select("sex", "性別", ["男", "女"]),
          text("hospitalDoctor", "生產醫院／醫師", true),
          date("birthDate", "生產日"),
          { key: "weight", label: "體重（g）", type: "number" },
          text("birthOrder", "胎次"),
          select("chinese", "中醫", ["是", "否"]),
          text("chineseNote", "中醫備註"),
          select("delivery", "生產方式", ["C/S", "NSD"]),
          select("together", "是否同行", ["是", "否"]),
          text("stay", "入住日期", true),
        ],
      },
    ],
    prefill: (record) => ({
      room: record.room,
      motherName: orDemo(record.name, DEMO_MOTHER_NAME),
      babyName: DEMO_BABY_NAME,
      hospitalDoctor: record.hospital,
      delivery: record.deliveryMethod === "剖腹產" ? "C/S" : "NSD",
      chinese: record.chineseConsent ? "是" : "否",
      stay: stayRange(record),
    }),
  },
  {
    key: "security-notice",
    label: "入住資訊－保全部",
    timelineKey: "preAdmissionPapersDone",
    hint: "入住前 1 天交保全部；車號供停車場識別。",
    sections: [
      {
        label: "通知內容",
        fields: [
          text("room", "房號"),
          text("motherName", "媽媽姓名"),
          text("fatherName", "爸爸姓名"),
          text("carNo", "登記車號"),
          text("stay", "住宿期間", true),
          note("note", "備註事項"),
        ],
      },
    ],
    prefill: (record) => ({ room: record.room, motherName: orDemo(record.name, DEMO_MOTHER_NAME), stay: stayRange(record) }),
  },
  {
    key: "payment-notice",
    label: "繳款通知單",
    timelineKey: "admissionPaymentNoticeDone",
    hint: "入住當天交住戶；餘額以案件應收帶入。",
    sections: [
      {
        label: "通知內容",
        fields: [
          text("motherName", "姓名"),
          { key: "days", label: "住房天數", type: "number" },
          { key: "balance", label: "費用餘額", type: "number" },
          select("method", "繳款方式", ["現金", "匯款", "現金或匯款"]),
          date("dueDate", "繳清期限"),
          text("butler", "管家"),
          date("noticeDate", "通知日期"),
          note("note", "備註"),
        ],
      },
    ],
    prefill: (record) => ({
      motherName: orDemo(record.name, DEMO_MOTHER_NAME),
      days: String(record.days),
      balance: String(Math.max(0, caseBalance(record))),
      method: "現金或匯款",
      butler: record.owner,
    }),
  },
  {
    key: "tcm-survey",
    label: "中醫看診調查單",
    stage: 2,
    hint: "下訂時填寫；入住前如有變更再填一張（手冊第 23 頁）。",
    sections: [
      {
        label: "基本與病史",
        fields: [
          text("motherName", "姓名"),
          text("parity", "第幾胎"),
          multiple("gyn", "婦科相關疾病", ["子宮肌瘤", "子宮內膜異位", "多囊性卵巢", "巧克力囊腫", "尿道炎", "無"]),
          multiple("obstetric", "產科相關疾病", ["妊娠糖尿病", "妊娠高血壓", "子癲前症", "產後大出血", "無"]),
          multiple("internal", "內科相關疾病", ["心臟疾病", "高血壓", "低血壓", "糖尿病", "胃痛", "胃食道逆流", "氣喘", "痔瘡", "便祕", "經常性腹瀉", "無"]),
          multiple("other", "其他", ["貧血", "蕁麻疹", "鼻過敏", "偏頭痛", "皮膚過敏", "無"]),
        ],
      },
      {
        label: "過敏與家族史",
        fields: [
          text("babyNote", "胎兒或前一胎寶寶特殊情況"),
          text("genetic", "夫妻雙方遺傳性疾病"),
          text("foodAllergy", "食物過敏"),
          text("drugAllergy", "藥物過敏"),
          text("religionDiet", "宗教性飲食禁忌"),
          text("medicalDiet", "醫療性飲食禁忌（產檢醫師告知）"),
          text("cancerSelf", "本人癌症病史"),
          text("cancerFamily", "家族癌症病史與關係"),
          text("diabetesFamily", "家族糖尿病病史"),
        ],
      },
      { label: "填表", fields: [date("filledAt", "填表日期"), text("filledBy", "填表人")] },
    ],
    prefill: (record) => ({ motherName: orDemo(record.name, DEMO_MOTHER_NAME), parity: record.parity, filledBy: orDemo(record.name, DEMO_MOTHER_NAME) }),
  },
  {
    key: "pediatric-consult",
    label: "兒科醫師諮詢單",
    stage: 5,
    hint: "住戶填寫後由兒科醫師以書面或電話回覆（手冊第 32 頁）。",
    sections: [
      {
        label: "諮詢內容",
        fields: [
          text("room", "房號"),
          text("motherName", "姓名"),
          date("askedAt", "日期"),
          note("question", "想詢問兒科醫師的內容"),
          select("replyBy", "回覆方式", ["書面", "電話"]),
          note("reply", "回覆紀錄"),
          text("doctor", "回覆醫師"),
        ],
      },
    ],
    prefill: (record) => ({ room: record.room, motherName: orDemo(record.name, DEMO_MOTHER_NAME) }),
  },
];

/** 掛在某個時間軸項目底下的單據（可能不只一張，例如入住前 1 天有三張）。 */
export const docsForTimeline = (keys: readonly string[]) => CASE_DOCS.filter((doc) => doc.timelineKey && keys.includes(doc.timelineKey));
/** 掛在某個階段、但不屬於入住前時間軸的單據。 */
export const docsForStage = (stage: number) => CASE_DOCS.filter((doc) => doc.stage === stage);

export const caseDoc = (key: string) => CASE_DOCS.find((doc) => doc.key === key);

/** 表單目前的值：存過就用存的，沒存過用自動帶入值。 */
export function docValues(record: CaseRecord, doc: CaseDoc): Record<string, string> {
  return { ...doc.prefill(record), ...(record.documents?.[doc.key]?.values ?? {}) };
}
