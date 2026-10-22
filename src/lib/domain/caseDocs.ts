import type { CaseRecord } from "./types";
import { HOSPITALS } from "./options";
import { caseBalance } from "./rules";

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
      motherName: record.name,
      motherPhone: record.phone,
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
      motherName: record.name,
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
      motherName: record.name,
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
    prefill: (record) => ({ room: record.room, motherName: record.name, stay: stayRange(record) }),
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
      motherName: record.name,
      days: String(record.days),
      balance: String(Math.max(0, caseBalance(record))),
      method: "現金或匯款",
      butler: record.owner,
    }),
  },
];

export const caseDoc = (key: string) => CASE_DOCS.find((doc) => doc.key === key);

/** 表單目前的值：存過就用存的，沒存過用自動帶入值。 */
export function docValues(record: CaseRecord, doc: CaseDoc): Record<string, string> {
  return { ...doc.prefill(record), ...(record.documents?.[doc.key]?.values ?? {}) };
}
