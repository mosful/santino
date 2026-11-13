import type { CareField, CareForm, CareRow, CareSection } from "./types";
import { HOSPITALS_SHORT } from "../domain/options";

const text = (key: string, label: string): CareField => ({ key, label });
const note = (key: string, label: string, required = false): CareField => ({ key, label, type: "textarea", required });
const number = (key: string, label: string, min = 0, max?: number): CareField => ({ key, label, type: "number", min, max });
const choice = (key: string, label: string, options: string[]): CareField => ({ key, label, type: "radio", options });
const multiple = (key: string, label: string, options: string[]): CareField => ({ key, label, type: "multiple", options });
const date = (key: string, label: string): CareField => ({ key, label, type: "date" });
const yesNo = (key: string, label: string) => choice(key, label, ["無", "有"]);
const row = (label: string, ...fields: CareField[]) => ({ label, fields });
const section = (label: string, rows: ReturnType<typeof row>[]): CareSection => ({
  label, fields: rows.flatMap((item) => item.fields), rows: rows.map((item) => ({ label: item.label, keys: item.fields.map((field) => field.key) })),
});
function assessment(printTitle: string, sections: CareSection[], printGroups: number[][]): CareForm {
  sections[0].fields.unshift({ ...date("date", "紀錄日期"), required: true }, { key: "time", label: "紀錄時間", type: "time", required: true });
  return { key: "admission", label: "入住評估", layout: "assessment", printTitle, sections, printGroups };
}

const breathing = ["無URI症狀", "鼻塞", "流鼻水", "喉嚨（紅）腫痛", "咳嗽", "有痰"];
const sleeping = ["正常", "日夜顛倒", "易驚醒", "難入眠", "常想睡覺"];
const mental = ["平穩", "愉悅", "疲倦", "易哭", "冷漠", "焦慮"];
const nipple = ["完整", "破皮", "結痂", "短平", "凹陷", "發紅或疼痛"];
const symptom = ["發燒", "腹瀉", "咳嗽", "流鼻水", "出疹子", "其他"];

/** 欄位與順序依院方入住評估表整理；本次要求的複選及不限短字數另行承接。 */
export const MAMA_ADMISSION = assessment("產婦入住護理評估表", [
  section("病史", [
    row("1 過敏史", yesNo("foodAllergy", "食物"), text("foodAllergyNote", "食物過敏說明"), yesNo("drugAllergy", "藥物"), text("drugAllergyNote", "藥物過敏說明"), text("allergy", "過敏補充")),
    row("2 妊娠中及產後病史", yesNo("pregnancyHistory", "病史"), text("pregnancyHistoryNote", "說明")),
    row("3 出院帶藥", yesNo("dischargeMedicine", "帶藥"), note("medicine", "藥物及服用方式")),
    row("4 內科病史", yesNo("medicalHistory", "內科病史"), text("medicalHistoryNote", "說明"), multiple("history", "既有病史補充", ["無", "高血壓", "糖尿病", "甲狀腺", "其他"])),
    row("5 長期服藥", yesNo("longTermMedicine", "長期用藥"), text("longTermMedicineNote", "說明")),
    row("6 外科病史", yesNo("surgicalHistory", "外科病史"), text("surgicalHistoryNote", "說明")),
  ]),
  section("身體評估", [
    row("1 生命徵象", number("temperature", "BT 體溫（℃）", 30, 45), number("pulse", "HR 心跳（次／分）", 0, 250), number("respiration", "RR 呼吸（次／分）", 0, 100), text("bloodPressure", "BP 血壓（mmHg）")),
    row("2 孕產次", number("gravida", "孕次 G", 0), number("para", "產次 P", 0), number("abortus", "流產次 A", 0), choice("delivery", "生產方式", ["NSD 自然產", "C/S 剖腹產", "VED 真空吸引"]), text("deliveryNote", "生產方式補充")),
    row("3 睡眠狀態", multiple("sleep", "睡眠狀態", sleeping)),
    row("4 精神狀態", multiple("mental", "精神狀態", mental)),
    row("5 呼吸道評估", multiple("respiratorySymptoms", "症狀", breathing), text("respiratoryNote", "症狀說明")),
    row("6 活動能力及四肢", multiple("mobility", "活動能力", ["自由活動", "協助使用輪椅", "協助下床"]), multiple("limbs", "四肢", ["正常", "上肢正常", "下肢正常", "水腫", "上肢水腫", "下肢水腫"])),
    row("7 乳房與乳頭", multiple("breast", "乳房", ["軟", "充盈", "親哺（擠奶）後有硬塊", "脹硬", "退奶"]), multiple("nippleLeft", "左側乳頭", nipple), multiple("nippleRight", "右側乳頭", nipple)),
    row("8 泌乳哺餵", multiple("lactation", "哺餵方式", ["親餵", "手擠瓶餵"]), number("milkAmount", "擠乳量（cc）"), number("milkInterval", "每幾小時一次"), choice("sucking", "親餵嬰兒吸吮狀況", ["佳", "可", "差", "未哺餵過"]), text("suckingNote", "原因")),
    row("9 子宮情形", { key: "fundus", label: "宮底 U−（Fb）", type: "select", options: ["一", "二", "三", "四", "五", "摸不到", "其他"] }, text("fundusNote", "宮底補充"), choice("contraction", "宮縮", ["硬", "鬆軟", "摸不到"]), multiple("lochiaAmount", "產後排出物量", ["微量", "少", "中", "血塊"]), multiple("lochiaColor", "顏色", ["鮮紅", "暗紅", "褐色", "淡紅", "黃色", "無"])),
    row("10 傷口", multiple("perinealWound", "NSD 會陰傷口", ["平整", "紅腫", "滲液", "異味", "使用藥膏"]), text("perinealMedicine", "使用藥膏說明"), multiple("abdominalWound", "C/S 腹部傷口", ["平整", "紅腫", "滲液", "敷料覆蓋"]), text("woundDrainage", "滲液顏色"), text("dressing", "敷料覆蓋說明")),
    row("11 排尿", multiple("urinary", "排尿狀況", ["正常", "失禁", "頻尿", "需加壓", "解尿疼痛或有灼熱感", "尿管留置"])),
    row("12 排便及痔瘡", multiple("bowel", "排便", ["未解", "軟", "硬", "水便", "血便"]), number("noStoolDays", "未解天數"), choice("hemorrhoid", "痔瘡", ["無", "有，無不適", "有不適"]), text("hemorrhoidMedicine", "使用藥膏"), number("sitzBath", "坐浴次數／天")),
    row("13 疼痛", number("painScore", "疼痛分數（0–10）", 0, 10), text("painSource", "疼痛來源")),
  ]),
  section("家庭評估", [
    row("國籍", choice("nationality", "國籍", ["本國", "外國"]), text("nationalityNote", "國籍說明")),
    row("婚姻狀況", choice("marriage", "婚姻狀況", ["未婚", "已婚"])),
    row("家庭型態", multiple("familyType", "家庭型態", ["小家庭", "三代同堂", "單親"])),
    row("經濟狀況", multiple("economy", "經濟狀況", ["普通", "單薪", "雙薪", "小康", "富裕"])),
    row("寶寶主要照顧者", multiple("caregivers", "主要照顧者", ["產婦本人", "祖母", "外婆", "親戚", "保母"]), text("caregiver", "其他照顧者或補充")),
  ]),
  section("入住護理紀錄", [
    row("入住護理紀錄", date("birthDate", "生產日期"), { key: "hospital", label: "生產醫院", type: "select", options: [...HOSPITALS_SHORT] }, note("note", "入住護理紀錄", true)),
  ]),
  section("TOCC", [
    row("1 生產前14天產婦或同住家人疑似感染症狀", yesNo("motherInfection", "媽媽"), multiple("motherSymptoms", "媽媽症狀", symptom), text("motherDiagnosis", "其他症狀或醫生診斷"), yesNo("familyInfection", "同住家人"), text("familyRelation", "寶寶的關係人"), multiple("familySymptoms", "家人症狀", symptom), text("familyDiagnosis", "其他症狀或醫生診斷")),
    row("2 寶寶手足學校傳染病請假或停課", yesNo("schoolInfection", "有無情形"), multiple("schoolDisease", "疾病", ["腸病毒", "流感", "水痘", "其他"]), text("schoolDiseaseNote", "其他說明")),
    row("3 住院期間照顧者目前疑似感染症狀", yesNo("caregiverInfection", "有無症狀"), multiple("caregiverAdvice", "建議", ["請無疑似或確定感染的親友擔任主要照顧者"])),
    row("填表人", text("respondent", "填表人"), choice("respondentIdentity", "身分", ["孕婦本人", "先生", "親友"]), text("respondentRelation", "關係")),
  ]),
], [[2, 3, 4], [0, 1]]);

const screenRow = (name: string, key: string) => row(name, choice(key, "檢查", ["未做", "已做"]), date(`${key}Date`, "日期"), choice(`${key}Result`, "結果", ["正常", "異常"]), text(`${key}Report`, "檢查報告"));
export const BABY_ADMISSION = assessment("新生兒入住護理評估表", [
  section("基本資料", [
    row("1 出生日期與性別", date("birthDate", "出生日期"), choice("sex", "寶寶性別", ["男", "女"]), text("birthOrder", "寶寶順序／暱稱")),
    row("2 入住及生產資料", number("stayDays", "入住天數"), text("gestation", "出生週數（週＋天）"), text("hospital", "生產醫院")),
    row("3 生產方式", choice("delivery", "生產方式", ["NSD", "VED", "C/S"]), text("deliveryNote", "生產方式補充")),
    row("4 出生阿帕嘉", number("apgar1", "Apgar 1 分鐘", 0, 10), number("apgar5", "Apgar 5 分鐘", 0, 10)),
    row("5 體重", number("birthWeight", "出生體重（g）", 300, 7000), number("dischargeWeight", "出院體重（g）", 300, 10000), number("weight", "入住體重（g）", 300, 10000)),
    row("6 餵奶資料", multiple("feeding", "餵奶方式", ["母乳", "配方奶", "其他"]), text("feedingNote", "其他餵奶方式"), text("milkType", "入住奶別"), number("milk", "入住奶量（cc）")),
  ]),
  section("新生兒檢查", [
    row("一 疫苗注射", choice("hbig", "B型肝炎免疫球蛋白", ["不需施打", "已施打"]), date("hbigDate", "施打日期"), choice("hepatitis", "B型肝炎", ["未施打", "已施打"]), date("hepatitisDate", "B肝日期")),
    row("二 新生兒篩檢", choice("screening", "新生兒篩檢", ["未做", "已做"]), date("screeningDate", "篩檢日期"), text("bloodType", "血型")),
    row("三 聽力篩檢", choice("hearing", "篩檢狀態", ["未做", "已做"]), date("hearingDate", "篩檢日期"), choice("hearingLeft", "左耳", ["正常", "異常"]), date("hearingLeftDate", "左耳複檢日期"), choice("hearingRight", "右耳", ["正常", "異常"]), date("hearingRightDate", "右耳複檢日期")),
    screenRow("腦部超音波", "brainUltrasound"), screenRow("心臟超音波", "heartUltrasound"), screenRow("腹部超音波", "abdomenUltrasound"), screenRow("腎臟超音波", "kidneyUltrasound"), screenRow("髖部超音波", "hipUltrasound"),
    row("四 藥物治療及營養添加物", yesNo("medication", "藥物"), multiple("medicationTypes", "種類", ["鐵劑", "維他命", "其他"]), note("medicationNote", "藥物備註"), yesNo("supplement", "添加物"), text("supplementNote", "添加物說明")),
  ]),
  section("入住護理紀錄", [row("護理紀錄", note("note", "入住護理紀錄", true))]),
  section("身體評估", [
    row("生命徵象", number("temperature", "體溫（℃）", 30, 45), number("pulse", "心跳（次／分）", 0, 300), number("respiration", "呼吸（次／分）", 0, 150), number("oxygen", "血氧（%）", 0, 100)),
    row("頭部", number("head", "頭圍（cm）"), number("height", "身長（cm）"), choice("caput", "頭產瘤", ["正常", "有"]), text("caputLocation", "部位"), choice("cephalohematoma", "頭血腫", ["正常", "有"]), text("cephalohematomaLocation", "部位"), multiple("fontanelle", "前囟門", ["正常", "凸起", "凹陷", "裂痕過大"]), multiple("skull", "顱骨", ["正常", "重疊", "凹陷"])),
    row("臉部", multiple("ears", "耳朵", ["正常", "外耳廓分裂", "耳垂瘜肉", "其他"]), text("earsNote", "耳側別與說明"), multiple("eyes", "眼睛", ["正常", "鞏膜出血", "分泌物", "其他"]), text("eyesNote", "眼側別與說明"), multiple("mouth", "嘴", ["正常", "珍珠瘤", "兔唇", "腭裂", "鵝口瘡", "其他"]), text("mouthNote", "口腔部位與說明"), multiple("face", "顏面", ["正常", "左右臉不對稱", "壓迫性出血點"])),
    row("胸部", multiple("chest", "胸", ["正常", "乳頭下有瘜肉", "乳頭凹陷", "魔乳", "胸骨凹陷"]), multiple("breathing", "呼吸型態", ["正常", "淺快"]), text("breathingNote", "呼吸說明")),
    row("腹部", multiple("cord", "臍帶", ["已脫落", "未脫落", "臍膨出"]), text("cordNote", "情況"), yesNo("abdominalDistension", "腹脹")),
    row("臀部及排泄", yesNo("redButtock", "紅臀"), text("redButtockNote", "說明"), multiple("stoolColor", "大便顏色", ["黃", "綠", "黃綠", "其他"]), multiple("stoolConsistency", "大便型態", ["糊", "軟", "稀", "滲便"]), choice("stoolAmount", "大便量", ["多", "中", "少"]), choice("urineColor", "小便顏色", ["正常", "結晶尿"]), choice("urineAmount", "小便量", ["多", "中", "少"])),
    row("生殖器", multiple("scrotum", "男孩陰囊", ["正常", "水腫"]), multiple("testis", "睪丸位置", ["正常", "未下降"]), text("testisNote", "睪丸側別與說明"), multiple("labia", "女孩外陰唇", ["正常", "水腫"])),
    row("皮膚", multiple("skin", "膚色", ["正常", "黃疸", "嘴唇發紺", "末端肢體發紺", "其他"]), number("jaundice", "黃疸值（mg/dL）", 0, 50), text("skinLocation", "其他部位"), yesNo("mongolianSpot", "蒙古斑"), text("mongolianSpotLocation", "蒙古斑部位"), yesNo("hemangioma", "血管瘤"), text("hemangiomaLocation", "血管瘤部位"), yesNo("rash", "紅疹"), text("rashLocation", "紅疹部位"), yesNo("pustule", "膿疱"), text("pustuleLocation", "膿疱部位"), note("skinNote", "其他皮膚說明")),
    row("四肢及活動", multiple("limbs", "四肢", ["正常", "多指", "畸形"]), text("limbsLocation", "部位"), multiple("cry", "哭聲", ["適中", "宏亮", "弱", "其他"]), text("cryNote", "哭聲說明"), choice("activity", "活動力", ["適中", "強", "須刺激"])),
  ]),
], [[0, 1], [2, 3]]);

export const FEEDING_GROUPS = [
  { code: "B", label: "身體姿勢", rows: [["母親放鬆而舒服", "肩膀僵硬，身體傾向新生兒"], ["嬰兒身體緊貼母親，臉朝向乳房", "嬰兒身體離開母親"], ["嬰兒頭部及下巴呈一直線", "嬰兒頭部扭轉"], ["嬰兒下巴貼著乳房", "嬰兒下巴沒有貼著乳房"], ["嬰兒臀部受支撐", "只有托著頭和肩膀"]] },
  { code: "R", label: "反應", rows: [["餓的時候嬰兒會朝向乳房", "對乳房無反應"], ["嬰兒會尋找乳房", "看不到尋乳反射"], ["嬰兒以舌頭探索乳房", "嬰兒對乳房無興趣"], ["嬰兒接觸乳房時平靜而清醒", "嬰兒哭鬧或煩躁"], ["嬰兒持續含住乳房", "嬰兒放開乳房"], ["噴乳的表現（漏奶、子宮收縮痛）", "無噴乳的表現"]] },
  { code: "E", label: "情感交流", rows: [["穩定，有自信的擁抱", "神經質的，或無力的擁抱"], ["母親給予臉對臉的注視", "沒有母子眼神的接觸"], ["母親給予很多的撫摸", "搖晃或戳嬰兒"]] },
  { code: "A", label: "解剖", rows: [["餵奶後乳房變軟", "乳房腫脹"], ["乳頭突出，有彈性", "乳頭平，或凹陷"], ["皮膚看起來很健康", "皮膚發紅或有皺摺"], ["餵奶時乳房看起來圓圓的", "乳房看起來被拉扯的樣子"]] },
  { code: "S", label: "含乳房", rows: [["嘴巴張大", "嘴巴張不夠大，嘴巴噘起"], ["下唇外翻", "下唇內翻"], ["舌頭繞著乳房", "看不到舌頭"], ["兩頰圓鼓", "兩頰凹入"], ["嬰兒嘴巴上方之乳暈較多", "嬰兒嘴巴下方之乳暈較多"], ["慢慢地深吸奶，一陣子後間隔有休息", "只有快速的吸奶"], ["可看到或聽到吞嚥", "可聽到咂咂聲"]] },
  { code: "T", label: "含奶的時間", rows: [["嬰兒自己鬆開乳房", "母親將嬰兒抱離開乳房"]] },
];
export const FEEDING_FORM: CareForm = {
  key: "feeding", label: "哺餵母乳評估", layout: "feeding", printTitle: "哺餵母乳觀察紀錄表",
  sections: [{ label: "哺餵母乳評估", fields: [
    { ...date("date", "紀錄日期"), required: true }, { key: "time", label: "紀錄時間", type: "time", required: true },
    ...FEEDING_GROUPS.flatMap((group) => group.rows.map((_, index) => choice(`breast-${group.code}${index + 1}`, `${group.label} ${index + 1}`, ["順利", "困難"]))),
    number("leftMinutes", "左乳房吸吮分鐘"), number("rightMinutes", "右乳房吸吮分鐘"), choice("feedingResult", "評估結果", ["哺乳順利", "再評估"]), note("feedingNote", "評估補充"),
  ] }],
};

export function sectionRows(section: CareSection): CareRow[] {
  const defined = section.rows ?? [];
  const used = new Set(defined.flatMap((item) => item.keys));
  return [...defined, ...section.fields.filter((field) => !used.has(field.key) && !["date", "time"].includes(field.key)).map((field) => ({ label: field.label, keys: [field.key] }))];
}

/* ───────── 每日照護、I/O 與成長日記（需求規格 B03–B08、G05、M02–M05） ───────── */

export const SHIFTS = ["白班 07–15", "小夜 15–23", "大夜 23–07"];
/** 紅臀分級沿用院方原表說明，不改成單純代號。 */
export const RED_BOTTOM = ["0 無", "A 臀部發紅", "B 發紅且範圍擴大", "C 破皮或潰瘍"];
const STOOL_FORMS = ["黃糊便", "綠糊便", "黃滲便", "綠滲便", "水便", "胎便", "血便", "其他"];
const measurement = [number("height", "身長（cm）", 10, 100), number("weight", "體重（g）", 300, 15000), number("head", "頭圍（cm）", 10, 70)];

/** 新生兒每日評估照護單：一筆＝一個班別，列印以連續五天呈現各班。 */
export const BABY_DAILY: CareForm = {
  key: "daily", label: "每日照護", layout: "daily", printTitle: "新生兒每日評估照護單",
  sections: [section("每日評估照護", [
    row("紀錄", { ...date("date", "紀錄日期"), required: true }, text("stayDay", "入住日數"), { ...choice("shift", "班別", SHIFTS), required: true }, { key: "time", label: "紀錄時間", type: "time", required: true }),
    row("生命徵象", number("temperature", "體溫（℃）", 30, 45), number("pulse", "心跳（次／分）", 0, 300), number("respiration", "呼吸（次／分）", 0, 150)),
    row("活動與吸吮", choice("activity", "活動力", ["佳", "可", "差"]), choice("sucking", "吸吮力", ["佳", "可", "差"])),
    row("皮膚與臍帶", multiple("skin", "皮膚", ["正常", "黃疸", "紅疹", "脫皮", "瘀青", "其他"]), text("skinNote", "皮膚說明"), choice("cord", "臍帶", ["未脫落乾燥", "未脫落滲液", "發紅", "已脫落"])),
    row("紅臀", { key: "redBottom", label: "紅臀分級", type: "select", options: RED_BOTTOM }, text("redBottomNote", "部位與處理")),
    row("親子同室", { key: "roomingStart", label: "開始時間", type: "time" }, { key: "roomingEnd", label: "結束時間", type: "time" }, number("roomingHours", "時數（小時）", 0, 24)),
    row("量測", ...measurement),
    row("照護問題", note("careIssue", "照護問題與處置")),
  ])],
};

/** 新生兒照護紀錄單：餵食與排泄逐筆記錄，量測與成長日記共用同一筆數值。 */
export const BABY_IO: CareForm = {
  key: "io", label: "I/O", layout: "io", printTitle: "新生兒照護紀錄單",
  sections: [section("餵食與排泄", [
    row("紀錄", { ...date("date", "紀錄日期"), required: true }, { key: "time", label: "紀錄時間", type: "time", required: true }),
    row("量測", number("temperature", "體溫（℃）", 30, 45), number("weight", "體重（g）", 300, 15000)),
    row("親餵", number("leftMinutes", "左乳（分鐘）", 0, 120), number("rightMinutes", "右乳（分鐘）", 0, 120)),
    row("瓶餵", choice("milkType", "奶別", ["母乳", "配方奶", "母乳加配方奶"]), number("bottleAmount", "瓶餵量（cc）", 0, 500)),
    row("餵食情形", choice("condition", "餵食情形", ["可", "溢奶", "吐奶"]), choice("sucking", "吸吮力", ["佳", "可", "差"])),
    row("排尿", choice("urine", "排尿", ["未解", "自解"]), number("urineTimes", "次數", 0, 30), choice("urineColor", "顏色", ["淡黃", "深黃", "結晶尿", "其他"])),
    row("排便", choice("stool", "排便", ["未解", "自解"]), number("stoolTimes", "次數", 0, 30), choice("stoolAmount", "量", ["少量", "中量", "多量"]), multiple("stoolForm", "性狀", STOOL_FORMS)),
    row("備註", note("note", "備註")),
  ])],
};

/** 成長日記：量測與餵食排泄由每日照護及 I/O 帶入，家屬版不列體溫心跳呼吸。 */
export const BABY_GROWTH: CareForm = {
  key: "growth", label: "成長日記", layout: "growth", printTitle: "寶寶成長紀錄（家屬版）",
  sections: [section("今日量測與紀錄", [
    row("紀錄", { ...date("date", "紀錄日期"), required: true }),
    row("量測", ...measurement),
    row("成長紀錄", note("note", "成長紀錄")),
  ])],
};

const mamaSymptom = ["無", "發燒", "頭痛", "頭暈", "噁心", "嘔吐", "腹瀉", "咳嗽", "有痰", "流鼻水", "喉嚨痛", "其他"];
/** 媽媽每日照護（原「持續護理」）：可並存的狀況改複選，宮底改選單。 */
export const MAMA_DAILY: CareForm = {
  key: "ongoing", label: "每日照護", layout: "assessment", printTitle: "產婦每日照護紀錄",
  sections: [
    section("每日評估", [
      row("紀錄", { ...date("date", "紀錄日期"), required: true }, { key: "time", label: "紀錄時間", type: "time", required: true }),
      row("生命徵象", number("temperature", "體溫（℃）", 30, 45), number("pulse", "脈搏（次／分）", 0, 250), number("respiration", "呼吸（次／分）", 0, 100), text("bloodPressure", "血壓（mmHg）")),
      row("精神與睡眠", multiple("mood", "精神狀態", mental), multiple("sleep", "睡眠狀態", sleeping)),
      row("症狀", multiple("symptoms", "症狀", mamaSymptom), text("symptomNote", "症狀說明")),
      row("子宮情形", { key: "fundus", label: "宮底 U−（Fb）", type: "select", options: ["一", "二", "三", "四", "五", "摸不到", "其他"] }, text("fundusNote", "宮底補充"), choice("contraction", "宮縮", ["硬", "鬆軟", "摸不到"]), multiple("lochiaAmount", "產後排出物量", ["微量", "少", "中", "血塊"]), multiple("lochiaColor", "顏色", ["鮮紅", "暗紅", "褐色", "淡紅", "黃色", "無"])),
      row("乳房與泌乳", multiple("breast", "乳房", ["軟", "充盈", "親哺（擠奶）後有硬塊", "脹硬", "退奶"]), multiple("nippleLeft", "左側乳頭", nipple), multiple("nippleRight", "右側乳頭", nipple), multiple("lactation", "哺餵方式", ["親餵", "手擠瓶餵"]), number("pumping", "擠乳次數／日", 0, 30)),
      row("傷口", multiple("perinealWound", "NSD 會陰傷口", ["無傷口", "平整", "紅腫", "滲液", "異味", "使用藥膏"]), multiple("abdominalWound", "C/S 腹部傷口", ["無傷口", "平整", "紅腫", "滲液", "敷料覆蓋"])),
      row("排泄", multiple("urinary", "排尿狀況", ["正常", "失禁", "頻尿", "需加壓", "解尿疼痛或有灼熱感", "尿管留置"]), multiple("bowel", "排便", ["未解", "軟", "硬", "水便", "血便"]), choice("hemorrhoid", "痔瘡", ["無", "有，無不適", "有不適"])),
      row("疼痛", multiple("painSites", "疼痛部位", ["無", "乳房", "會陰傷口", "腹部傷口", "腹痛", "頭痛", "其他"]), number("painScore", "疼痛分數（0–10）", 0, 10)),
    ]),
    section("敘述性護理", [row("敘述性護理", note("note", "敘述性護理紀錄", true))]),
  ],
};

/** 媽媽護理紀錄：移除產後週數，分執行性護理、產後持續照護、身心異常三類。 */
export const MAMA_RECORD: CareForm = {
  key: "record", label: "媽媽護理紀錄", layout: "assessment", printTitle: "產婦護理紀錄",
  sections: [section("護理紀錄", [
    row("紀錄", { ...date("date", "紀錄日期"), required: true }, { key: "time", label: "紀錄時間", type: "time", required: true }),
    row("一 執行性護理紀錄", note("executionNote", "入住、退房等作業及執行性護理")),
    row("二 產後持續照護紀錄", note("continuousNote", "產後持續問題的觀察與處置")),
    row("三 身心異常及特殊狀況處理", note("abnormal", "身心異常、特殊狀況與後續追蹤")),
  ])],
};
