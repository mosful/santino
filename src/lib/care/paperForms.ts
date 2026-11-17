import type { CareField, CareForm, CareSection, PaperTemplateId } from "./types";

export const PAPER_VERSION = "20261113";
export const NATIVE_MAMA_PRINT_VERSION = "20261117-native";
type RowSpec = [string, ...(string | CareField)[]];
const text = (key: string, label: string): CareField => ({ key, label });
const note = (key: string, label: string): CareField => ({ key, label, type: "textarea" });
const num = (key: string, label: string, max?: number): CareField => ({ key, label, type: "number", min: 0, max });
const choice = (key: string, label: string, options: string[]): CareField => ({ key, label, type: "radio", options });
const multi = (key: string, label: string, options: string[]): CareField => ({ key, label, type: "multiple", options });
const yn = (key: string, label: string) => choice(key, label, ["無", "有"]);
const date = (key: string, label: string): CareField => ({ key, label, type: "date" });

/** 依新紙本重排；原來額外的欄位留下，不移除舊草稿或歷史資料。 */
function align(form: CareForm, template: PaperTemplateId, title: string, groups: [string, RowSpec[]][]) {
  const old = new Map(form.sections.flatMap((section) => section.fields).map((field) => [field.key, field]));
  const used = new Set<string>(["date", "time"]);
  const sections: CareSection[] = groups.map(([label, specs]) => {
    const fields: CareField[] = [];
    const rows = specs.map(([rowLabel, ...items]) => {
      const rowFields = items.map((item) => typeof item === "string" ? old.get(item) : item);
      for (const field of rowFields) {
        if (!field) throw new Error(`紙本欄位不存在：${rowLabel}`);
        if (used.has(field.key)) throw new Error(`紙本欄位重複：${field.key}`);
        used.add(field.key); fields.push(field);
      }
      return { label: rowLabel, keys: rowFields.map((field) => field!.key) };
    });
    return { label, rows, fields };
  });
  sections[0].fields.unshift(old.get("date") ?? { ...date("date", "紀錄日期"), required: true }, old.get("time") ?? { key: "time", label: "紀錄時間", type: "time", required: true });
  if (template.endsWith("daily")) {
    sections[0].fields.push(date("birthDate", "生產日期"));
    sections[0].rows!.unshift({ label: "頁首資料", keys: ["birthDate"] });
    used.add("birthDate");
  }
  const remaining = [...old.values()].filter((field) => !used.has(field.key));
  if (remaining.length) sections.push({ label: "入住護理紀錄", fields: remaining });
  Object.assign(form, { sections, printTitle: title, paperTemplate: template, templateVersion: PAPER_VERSION, supplementalKeys: remaining.map((field) => field.key), printGroups: [sections.map((_, i) => i)] });
  const extra: Partial<Record<PaperTemplateId, string[]>> = {
    "mama-admission": ["respiratoryNote", "caregiver", "caregiverAdvice", "respondent"],
    "mama-daily": [],
    "baby-admission": ["date", "time"],
    "baby-daily": ["redBottomNote", "height", "weight", "head", "roomingStart", "roomingEnd", "roomingHours"],
  };
  form.supplementalKeys = [...new Set([...form.supplementalKeys!, ...(extra[template] ?? [])])];
}

export function alignPaperForms(mama: CareForm, baby: CareForm, mamaDaily: CareForm, babyDaily: CareForm) {
  align(mama, "mama-admission", "產婦入住護理評估表", [
    ["病史", [
      ["1 過敏史", "foodAllergy", "foodAllergyNote", "drugAllergy", "drugAllergyNote"],
      ["2 妊娠中及產後病史", "pregnancyHistory", "pregnancyHistoryNote", "dischargeMedicine", "medicine"],
      ["3 內科病史及長期服藥", "medicalHistory", "medicalHistoryNote", "longTermMedicine", "longTermMedicineNote"],
      ["4 外科病史", "surgicalHistory", "surgicalHistoryNote"],
    ]],
    ["身體評估", [
      ["1 生命徵象", "temperature", "pulse", "respiration", "bloodPressure"],
      ["2 孕產次及生產方式", "gravida", "para", "abortus", choice("delivery", "生產方式", ["NSD 自然產", "C/S 剖腹產"]), "deliveryNote"],
      ["3 睡眠狀態", "sleep"], ["4 精神狀態", multi("mental", "精神狀態", ["平靜", "愉悅", "疲倦", "易哭", "冷漠", "焦慮"])],
      ["5 呼吸道評估", "respiratorySymptoms", "respiratoryNote"],
      ["6 活動能力及四肢", "mobility", "limbs"],
      ["7 乳房及乳頭", "breast", "nippleLeft", "nippleRight"],
      ["8 泌乳情形", choice("lactationAmount", "泌乳程度", ["多", "中", "少", "無"]), "milkAmount", "milkInterval", "lactation"],
      ["9 子宮情形", "fundus", choice("fundusPosition", "宮底位置", ["U−", "pelvic"]), "fundusNote", "contraction", "lochiaAmount", "lochiaColor"],
      ["10 傷口", "perinealWound", "perinealMedicine", "abdominalWound", "woundDrainage", "dressing"],
      ["11 排尿", "urinary"],
      ["12 排便及痔瘡", multi("bowel", "排便", ["未解", "有，軟", "有，硬", "水便", "血便", "已服軟便劑"]), "noStoolDays", choice("hemorrhoid", "痔瘡", ["無", "有，無不適"]), yn("hemorrhoidMedication", "使用痔瘡藥膏"), "hemorrhoidMedicine", "sitzBath"],
      ["13 疼痛", "painScore", "painSource"],
    ]],
    ["家庭評估", [["國籍", "nationality", "nationalityNote"], ["婚姻狀況", "marriage"], ["家庭型態", "familyType"], ["經濟狀況", "economy"], ["主要照顧者", "caregivers", "caregiver"]]],
    ["疫情之防疫作為", [
      ["1 媽媽及同住家人", "motherInfection", "motherSymptoms", text("motherOtherSymptoms", "媽媽其他症狀"), "motherDiagnosis", "familyInfection", "familyRelation", "familySymptoms", text("familyOtherSymptoms", "同住家人其他症狀"), "familyDiagnosis"],
      ["2 手足學校傳染病", "schoolInfection", "schoolDisease", "schoolDiseaseNote"],
      ["3 主要照顧者", "caregiverInfection", "caregiverAdvice"],
      ["填表人", "respondent", "respondentIdentity", "respondentRelation"],
    ]],
  ]);
  // 原入住護理紀錄仍為必要內容，與紙本主表分開保存。
  const mamaExtras = mama.sections.at(-1)!;
  mamaExtras.fields = [...mamaExtras.fields.filter((field) => !["birthDate", "hospital"].includes(field.key)), date("birthDate", "生產日期"), text("hospital", "生產醫院")];

  align(baby, "baby-admission", "新生兒入住評估單", [
    ["基本資料", [
      ["性別及入住天數", "birthDate", "sex", choice("stayPlan", "入住天數選項", ["21", "30", "其它"]), "stayDays", "gestation", choice("hospital", "生產醫院", ["璟馨", "詠馨", "其它"]), text("hospitalOther", "其它生產醫院")],
      ["生產方式及 Apgar", "delivery", "deliveryNote", "apgar1", "apgar5"],
      ["體重", "birthWeight", "dischargeWeight", "weight"],
      ["餵奶方式", "feeding", "feedingNote", choice("formulaBrand", "配方廠牌", ["亞培", "優生", "雀巢", "S-26", "其它"]), text("formulaBrandOther", "其它配方廠牌"), "milk"],
    ]],
    ["疫苗注射", [["B 型肝炎免疫球蛋白", "hbig", "hbigDate"], ["B 肝第一劑", "hepatitis", "hepatitisDate", date("hepatitisReturn", "未注射回診日期")]]],
    ["檢驗", [["新生兒篩檢", "screening", date("screeningReturn", "未完成回診時間"), multi("screeningItems", "篩檢項目", ["LSD", "SCID＋SMA＋BD", "MPS＋ALD"])], ["血型及 IgE", "bloodType", num("ige", "IgE（mg/dl）")]]],
    ["檢查", [
      ["聽力篩檢", "hearingLeft", "hearingRight", date("hearingReviewDate", "聽篩複檢日期")],
      ["腦部超音波", choice("brainUltrasoundResult", "腦部超音波結果", ["正常", "其它"]), "brainUltrasoundReport"],
      ["心臟超音波", multi("heartFindings", "心臟超音波結果", ["正常", "PDA", "PFO", "VSD", "ASD", "其它"]), "heartUltrasoundReport"],
      ["腹部超音波", choice("abdomenUltrasoundResult", "腹部超音波結果", ["正常", "其它"]), "abdomenUltrasoundReport"],
      ["腎臟超音波", choice("kidneyUltrasoundResult", "腎臟超音波結果", ["正常", "其它"]), "kidneyUltrasoundReport"],
      ["髖部超音波", choice("hipUltrasoundResult", "髖部超音波結果", ["正常", "其它"]), "hipUltrasoundReport"],
    ]],
    ["藥物治療及營養添加物", [
      ["藥物", "medicationTypes", num("ironFrequency", "鐵劑一天次數"), num("ironDrops", "鐵劑每次滴數"), num("vitaminFrequency", "維他命一天次數"), num("vitaminDrops", "維他命每次滴數"), "medicationNote"],
      ["添加物", multi("supplementTypes", "添加物", ["母乳添加劑", "其它"]), num("supplementMilk", "每包添加的母乳量（c.c.）"), "supplementNote"],
      ["媽媽主訴", note("motherComplaint", "媽媽主訴")],
    ]],
    ["身體評估", [
      ["評估日期時間及生命徵象", date("bodyDate", "身體評估日期"), { key: "bodyTime", label: "身體評估時間", type: "time" }, choice("temperatureSite", "體溫測量部位", ["腋溫", "肛溫"]), "temperature", "pulse", "respiration", "oxygen"],
      ["頭部", "head", "height", "caput", "caputLocation", "cephalohematoma", "cephalohematomaLocation", "fontanelle", "skull"],
      ["臉部", multi("ears", "耳朵", ["正常", "外耳廓分裂", "耳垂瘜肉"]), "earsNote", multi("eyes", "眼睛", ["正常", "鞏膜出血", "分泌物"]), "eyesNote", multi("mouth", "嘴", ["正常", "兔唇", "腭裂", "鵝口瘡"]), "mouthNote", "face"],
      ["胸部", "chest", "breathing", "breathingNote"],
      ["腹部", "cord", "cordNote", "abdominalDistension"],
      ["臀部", "redButtock", "redButtockNote", multi("stoolColor", "大便顏色", ["黃", "綠", "其他"]), text("stoolColorOther", "其它大便顏色"), "stoolConsistency", "stoolAmount"],
      ["生殖器", "scrotum", "labia", "testis", "testisNote", "urineColor", "urineAmount"],
      ["皮膚", "skin", "skinLocation", "mongolianSpot", "mongolianSpotLocation", "hemangioma", "hemangiomaLocation", "rash", "rashLocation", "pustule", "pustuleLocation"],
      ["四肢", "limbs", "limbsLocation", "cry", "cryNote", "activity"],
    ]],
  ]);
  align(mamaDaily, "mama-daily", "產婦每日護理評估表", [
    ["每日評估", [
      ["生產方式及生命徵象", choice("delivery", "生產方式", ["NSD", "C/S"]), "temperature", "pulse", "respiration", "bloodPressure"],
      ["精神", multi("mood", "精神狀態", ["平靜", "愉悅", "疲倦", "易哭", "冷漠", "焦慮"])],
      ["URI 症狀", yn("uriStatus", "URI 症狀"), "symptoms", "symptomNote"],
      ["疼痛", multi("painSites", "疼痛部位", ["乳房", "宮縮", "傷口", "痔瘡", "其他"]), text("painOther", "其他疼痛"), "painScore"],
      ["宮底及宮縮", "fundus", choice("fundusPosition", "宮底位置", ["U−", "pelvic"]), "fundusNote", choice("contraction", "宮縮", ["硬", "鬆軟", "按摩後硬"])],
      ["產婦排出物", multi("lochiaAmount", "產婦排出物量", ["微量", "少", "中", "大量", "無", "血塊"]), multi("lochiaColor", "產婦排出物色", ["鮮紅", "暗紅", "褐", "淡紅", "淡黃", "無"])],
      ["乳房及泌乳", multi("breast", "乳房", ["軟", "充盈", "發紅", "局部硬塊", "退奶"]), "lactation", "pumping"],
      ["傷口", multi("woundSite", "傷口部位", ["會陰", "腹部"]), multi("woundStatus", "傷口狀況", ["乾淨平整", "紅腫", "發紅", "分泌物"]), multi("dressingTypes", "覆蓋物", ["美容膠", "防水敷", "人工皮", "矽膠貼", "凝膠", "其它"]), text("dressingOther", "其它覆蓋物")],
      ["小便", multi("urinary", "小便", ["正常", "需加壓", "失禁", "頻尿", "Foley", "小便灼熱、刺痛"])],
      ["大便", multi("bowel", "大便", ["有，正常", "腹瀉", "未解"]), num("diarrheaTimes", "腹瀉次數／天"), num("noStoolDays", "未解天數")],
      ["活動", choice("mobility", "活動", ["自如", "需協助"])],
    ]],
    ["護理指導紀錄", [["護理指導紀錄", { key: "note", label: "敘述性護理紀錄", type: "textarea", required: true }]]],
  ]);
  if (mamaDaily.sections.at(-1)?.label === "入住護理紀錄") mamaDaily.sections.at(-1)!.label = "既有資料與補充評估";
  align(babyDaily, "baby-daily", "新生兒每日評估照護單", [
    ["每日評估照護", [
      ["入住日數與班別", "stayDay", "shift", choice("delivery", "生產方式", ["NSD", "C/S"]), multi("feedingType", "哺餵方式", ["母奶", "配方奶"]), text("feedingOther", "哺餵方式補充")],
      ["生命徵象", "temperature", "pulse", "respiration"],
      ["活動與吸吮", choice("activity", "活動力", ["強", "適中", "弱"]), choice("sucking", "吸吮力", ["強", "適中", "弱"])],
      ["皮膚", multi("skinFindings", "皮膚狀況", ["乾燥", "臉疹", "身疹", "腋下浸潤", "股溝浸潤"])],
      ["臍帶", choice("cordPresent", "臍帶存無", ["存", "無"]), text("cordAppearance", "臍帶顏色味道")],
      ["紅臀", yn("redBottomPresent", "紅臀有無"), "redBottom", "redBottomNote"],
      ["每日親子同室", choice("roomingDailyStatus", "當日親子同室原表勾選", ["≥8hrs", "其他時數"]), num("roomingDailyHours", "當日合計時數（人工核對）", 24)],
      ["照護問題", "careIssue"],
    ]],
    ["量測與出入紀錄", [["每日量測", "height", "weight", "head"], ["本次親子同室出入", "roomingStart", "roomingEnd", "roomingHours"]]],
  ]);
  babyDaily.sections.at(-1)!.label = "既有資料與補充評估";

  // 產婦兩張評估表保留紙本題目與欄位排列，但列印必須由系統原生排版，
  // 不再把資料疊到掃描 PDF 母版上。實際分頁由 CarePrintSheet 的產婦專用版型處理。
  for (const nativeForm of [mama, mamaDaily]) {
    delete nativeForm.paperTemplate;
    delete nativeForm.supplementalKeys;
    nativeForm.templateVersion = NATIVE_MAMA_PRINT_VERSION;
  }
}
