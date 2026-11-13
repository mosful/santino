import type { CareField, CareForm, CareKind, CareValues } from "./types";
import { createPersistentStore } from "../demo/persistentStore";

export type GuidanceItem = { key: string; label: string };
export type GuidanceGroup = { label: string; items: GuidanceItem[] };

/* 指導方式與結果評值的代號、順序抄自舊系統 lcyMama_Baby_milk_experience_2025V1.php；
   媽媽表只有四種方式（實機截圖 2.1.4.12），寶寶表六種。 */
export const GUIDANCE_WAYS: Record<CareKind, string[]> = {
  mama: ["1 口述", "2 實際操作", "3 住房手冊", "4 其他"],
  baby: ["1 口述", "2 實際操作", "3 住房手冊", "4 兒童健康手冊", "5 團體衛教", "6 其他"],
};
export const GUIDANCE_RESULTS = ["完全了解", "部分了解待追蹤", "不了解需重新指導及追蹤"];
/** 指導後幾日內要有結果評值（會中要求七日；起訖計日與例外待院方確認）。 */
export const GUIDANCE_REVIEW_DAYS = 7;

const item = (key: string, label: string): GuidanceItem => ({ key, label });

const MAMA_GROUPS: GuidanceGroup[] = [{ label: "入住24小時內", items: [
  item("uterus_involution", "子宮復原說明及按摩方法指導"),
  item("bed_guidance", "採漸進式下床指導"),
  item("cut_care", "會陰/剖腹產傷口照護"),
  item("sick_control", "預防產後感染"),
  item("lochia", "產後排出物評估"),
  item("Kegels_guidance", "凱格爾運動指導"),
  item("mastitis", "預防乳腺炎"),
  item("sexlife_occasion", "性生活開始時機"),
  item("contraceptive_methods", "避孕方法"),
  item("born_bleeding", "產後大出血"),
  item("mama_sick", "產後就醫的狀況"),
  item("postpartum_fever", "產後發燒"),
] }];

const BABY_GROUPS: GuidanceGroup[] = [
  { label: "個別衛教指導", items: [
    item("handmilk_guide", "手擠奶技巧指導"),
    item("breastpump_guide", "吸奶器使用技巧指導"),
    item("nipplehurt_guide", "乳頭受傷護理指導"),
    item("baby_latching_guide", "寶寶正確含乳指導"),
    item("breastfeedposture_guide", "哺乳姿勢指導"),
    item("333_principle", "母乳保存原則(333原則)"),
    item("lactation_guidance", "持續泌乳指導"),
    item("sufficient_milk", "如何讓奶水充足"),
    item("warmmilk_skill", "溫奶方法"),
    item("change_skill", "瓶餵及拍打嗝"),
    item("formulamilk_risk", "使用配方奶風險及沖泡配方奶"),
    item("buttocks_care", "尿布更換及臀部照護 (洗屁)"),
    item("backhome_guide", "返家照護指導"),
    item("baby_act", "嬰兒發展照護與指導"),
  ] },
  { label: "嬰兒居家照護指導", items: [
    item("vaccination_response", "預防接種的時間與反應"),
    item("vomit_milk", "嗆吐奶處理"),
    item("emergency_response", "緊急狀況處理"),
    item("sleeping", "安全睡眠環境"),
    item("medical_timing", "何時需就醫"),
    item("diaper_look", "大便卡的判別"),
    item("jaundice", "黃疸的觀察"),
    item("shakenbaby_syndrome", "嬰兒搖晃症候群"),
    item("temperature_processing", "體溫監測處理"),
    item("colic", "腸絞痛"),
    item("baby_appease", "如何安撫寶寶"),
    item("supplementary_food", "副食品添加原則"),
    item("Enterovirus", "腸病毒"),
    item("preventing_infection", "預防感染"),
    item("mamababy_reading", "親子共讀"),
    item("newborn_bath", "新生兒沐浴"),
  ] },
];

type GuidanceExtras = { version: 1; mama: GuidanceItem[]; baby: GuidanceItem[] };
const initialExtras: GuidanceExtras = { version: 1, mama: [], baby: [] };
/**
 * 院方自行新增的衛教項目（需求 G07「支援日後增加項目」）。
 *
 * 只存新增的項目，原表 12／30 項仍以程式常數為準；已簽出紀錄用項目代號存值，
 * 之後改名或再新增都不會改寫舊紀錄的內容與簽名。
 */
export const guidanceExtraStore = createPersistentStore("santino_care_guidance_items_v1", initialExtras,
  (value): value is GuidanceExtras => !!value && typeof value === "object" && (value as GuidanceExtras).version === 1 && Array.isArray((value as GuidanceExtras).mama) && Array.isArray((value as GuidanceExtras).baby));

export const guidanceActions = {
  add(kind: CareKind, label: string) {
    const text = label.trim();
    if (!text) throw new Error("請先輸入衛教項目名稱。");
    guidanceExtraStore.update((state) => {
      if (guidanceGroups(kind, state).flatMap((group) => group.items).some((existing) => existing.label === text)) throw new Error("已有同名的衛教項目。");
      state[kind].push({ key: `extra-${crypto.randomUUID().slice(0, 8)}`, label: text });
    });
  },
  remove(kind: CareKind, key: string) {
    guidanceExtraStore.update((state) => { state[kind] = state[kind].filter((existing) => existing.key !== key); });
  },
};

/** 新增項目一律接在該角色最後一個群組，不插進院方原表的題序。 */
export function guidanceGroups(kind: CareKind, extras: GuidanceExtras = guidanceExtraStore.get()): GuidanceGroup[] {
  const groups = (kind === "baby" ? BABY_GROUPS : MAMA_GROUPS).map((group) => ({ label: group.label, items: [...group.items] }));
  const added = extras[kind];
  if (added.length) groups[groups.length - 1].items.push(...added);
  return groups;
}

export const guidanceKeys = (key: string) => ({
  ways: `${key}-ways`, date: `${key}-date`, executor: `${key}-executor`, signed: `${key}-signed`,
  evalDate: `${key}-evalDate`, evaluator: `${key}-evaluator`, result: `${key}-result`, understandDate: `${key}-understandDate`,
});

/** 衛教指導單：每個項目一列，欄位與院方護理指導記錄單相同。 */
export function guidanceForm(kind: CareKind, extras?: GuidanceExtras): CareForm {
  const groups = guidanceGroups(kind, extras);
  const fields: CareField[] = [
    { key: "date", label: "執行日期", type: "date", required: true },
    { key: "executor", label: "執行者" },
  ];
  for (const group of groups) {
    for (const entry of group.items) {
      const keys = guidanceKeys(entry.key);
      fields.push(
        { key: keys.ways, label: `${entry.label}－指導方式`, type: "multiple", options: GUIDANCE_WAYS[kind] },
        { key: keys.date, label: `${entry.label}－執行日期`, type: "date" },
        { key: keys.executor, label: `${entry.label}－執行者` },
        { key: keys.signed, label: `${entry.label}－產婦簽名`, type: "multiple", options: ["已簽名"] },
        { key: keys.evalDate, label: `${entry.label}－評值日期`, type: "date" },
        { key: keys.evaluator, label: `${entry.label}－評值者` },
        { key: keys.result, label: `${entry.label}－結果評值`, type: "select", options: GUIDANCE_RESULTS },
        { key: keys.understandDate, label: `${entry.label}－瞭解日期`, type: "date" },
      );
    }
  }
  // 寶寶表保留備註頁；媽媽表本次明確表示不另加備註。
  if (kind === "baby") fields.push({ key: "baby_note", label: "備註", type: "textarea" });
  return { key: "guidance", label: "護理指導單", layout: "guidance", printTitle: "護理指導記錄單", signature: true, sections: [{ label: "衛教指導", fields }] };
}

/**
 * 已指導但超過 N 日仍無結果評值的項目（需求 G07）。
 *
 * 只提醒、不擋簽出：起訖計日與例外規則院方尚未核定，擋下來會讓現場無法記錄。
 */
export function guidanceOverdue(kind: CareKind, values: CareValues, today: string, days = GUIDANCE_REVIEW_DAYS, extras?: GuidanceExtras) {
  // 用 UTC 做日期加法再取日期字串，避免換算時區時整個日期差一天。
  const deadline = (date: string) => { const at = new Date(`${date}T00:00:00Z`); at.setUTCDate(at.getUTCDate() + days); return at.toISOString().slice(0, 10); };
  return guidanceGroups(kind, extras).flatMap((group) => group.items).filter((entry) => {
    const keys = guidanceKeys(entry.key);
    const done = String(values[keys.date] ?? "");
    return !!done && !String(values[keys.evalDate] ?? "").trim() && deadline(done) < today;
  });
}
