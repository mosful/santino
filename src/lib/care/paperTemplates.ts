import type { PaperTemplateId } from "./types";
import checkboxPositions from "./paperCheckboxes.json";

/** 座標以原 PDF 的 1.65 倍預覽（954 × 1361）左上角為原點。 */
export type PaperSlot = { key: string; x: number; y: number; w: number; h: number; kind?: "check" | "signature"; option?: string; format?: "year" | "month" | "day" | "shortDate" | "weeks" | "days"; size?: number };
export type PaperPage = { source: string; page: number; title: string; slots: PaperSlot[] };
const t = (key: string, x: number, y: number, w: number, h = 23, size = 10): PaperSlot => ({ key, x, y, w, h, size });
const c = (key: string, option: string, x: number, y: number): PaperSlot => ({ key, option, x, y, w: 15, h: 15, kind: "check" });
const checks = (key: string, options: string[], xs: number[], y: number) => options.map((option, i) => c(key, option, xs[i], y));
const yesNo = (key: string, x: number, y: number) => [c(key, "無", x, y), c(key, "有", x + 49, y)];
const signature = (x: number, y: number, w: number, h = 35): PaperSlot => ({ key: "$signature", x, y, w, h, kind: "signature" });
const identity = (x: number, y: number, w: number, birthX = x + 22, step = 29) => [t("$room", x, y, w), t("$name", x, y + step, w), t("$birth", birthX, y + step * 2 + 3.3, x + w - birthX, 23, 8)];
const dateParts = (key: string, xs: number[], y: number) => (["year", "month", "day"] as const).map((format, i) => ({ ...t(key, xs[i], y, i ? 31 : 45), format }));
const monthDay = (key: string, xs: number[], y: number) => (["month", "day"] as const).map((format, i) => ({ ...t(key, xs[i], y, 39), format }));

const mamaAdmission: PaperPage[] = [
  { source: "mama-admission", page: 0, title: "產婦入住護理評估表", slots: [
    ...identity(796, 49, 131, 842, 34), ...dateParts("date", [571, 640, 688], 176), t("time", 840, 176, 84),
    ...yesNo("foodAllergy", 271, 220), t("foodAllergyNote", 350, 213, 175), ...yesNo("drugAllergy", 271, 248), t("drugAllergyNote", 350, 243, 175),
    ...yesNo("pregnancyHistory", 313, 279), t("pregnancyHistoryNote", 395, 274, 235), ...yesNo("dischargeMedicine", 244, 307), t("medicine", 320, 302, 451),
    ...yesNo("medicalHistory", 244, 339), t("medicalHistoryNote", 325, 333, 204), ...yesNo("longTermMedicine", 244, 367), t("longTermMedicineNote", 324, 362, 202),
    ...yesNo("surgicalHistory", 244, 399), t("surgicalHistoryNote", 581, 393, 275),
    t("temperature", 260, 444, 60), t("pulse", 395, 444, 61), t("respiration", 539, 444, 63), t("bloodPressure", 694, 444, 100),
    t("gravida", 239, 473, 36), t("para", 303, 473, 36), t("abortus", 370, 473, 44), ...checks("delivery", ["NSD 自然產", "C/S 剖腹產"], [533, 616], 477), t("deliveryNote", 737, 471, 140),
    ...checks("sleep", ["正常", "日夜顛倒", "易驚醒", "難入眠", "常想睡覺"], [243, 306, 406, 489, 570], 504),
    ...checks("mental", ["平靜", "愉悅", "疲倦", "易哭", "冷漠", "焦慮"], [241, 307, 370, 433, 497, 558], 533),
    ...checks("respiratorySymptoms", ["無URI症狀", "鼻塞", "流鼻水", "喉嚨（紅）腫痛", "咳嗽", "有痰"], [261, 370, 434, 516, 653, 716], 564),
    ...checks("mobility", ["自由活動", "協助使用輪椅", "協助下床"], [242, 343, 479], 593),
    ...checks("limbs", ["正常", "上肢正常", "下肢正常", "水腫", "上肢水腫", "下肢水腫"], [206, 270, 333, 406, 470, 534], 623),
    ...checks("breast", ["軟", "充盈", "親哺（擠奶）後有硬塊", "脹硬", "退奶"], [206, 251, 315, 506, 570], 653),
    ...["完整", "破皮", "結痂", "短平", "凹陷", "發紅或疼痛"].flatMap((option, index) => {
      const x = [242, 388, 534, 680, 242, 388][index]; const y = index < 4 ? 683 : 712;
      return [c("nippleLeft|nippleRight", option, x, y), c("nippleRight", option, [315,461,607,744,306,506][index], y), c("nippleLeft", option, [343,488,634,771,333,534][index], y)];
    }),
    ...checks("lactationAmount", ["多", "中", "少", "無"], [233, 288, 343, 397], 742), t("milkAmount", 569, 731, 95), t("milkInterval", 720, 731, 96),
    ...checks("lactation", ["親餵", "手擠瓶餵"], [224, 305], 768),
    c("fundusPosition", "U−", 241, 798), t("fundus", 310, 790, 60), c("fundusPosition", "pelvic", 396, 798),
    ...checks("contraction", ["硬", "鬆軟", "摸不到"], [561, 607, 671], 802),
    ...checks("lochiaAmount", ["微量", "少", "中", "血塊"], [292, 358, 407, 456], 829),
    ...checks("lochiaColor", ["鮮紅", "暗紅", "褐色", "淡紅", "黃色", "無"], [299, 368, 432, 499, 566, 632], 858),
    ...checks("perinealWound", ["平整", "紅腫", "滲液", "異味", "使用藥膏"], [261, 324, 388, 452, 552], 891), t("perinealMedicine", 705, 880, 175),
    ...checks("abdominalWound", ["平整", "紅腫", "滲液", "敷料覆蓋"], [261, 324, 388, 552], 920), t("woundDrainage", 501, 910, 44), t("dressing", 705, 910, 174),
    ...checks("urinary", ["正常", "失禁", "頻尿", "需加壓", "解尿疼痛或有灼熱感", "尿管留置"], [215, 279, 342, 406, 488, 680], 950),
    c("bowel", "未解", 215, 979), t("noStoolDays", 287, 968, 56), ...checks("bowel", ["有，軟", "有，硬", "水便", "血便", "已服軟便劑"], [370, 452, 534, 598, 661], 980),
    ...checks("hemorrhoid", ["無", "有，無不適"], [230, 269], 1005), c("hemorrhoidMedication", "有", 385, 1005), t("hemorrhoidMedicine", 520, 997, 79), t("sitzBath", 719, 997, 64),
    t("painScore", 210, 1027, 153), t("painSource", 485, 1027, 397),
    ...checks("nationality", ["本國", "外國"], [188, 251], 1081), t("nationalityNote", 348, 1070, 185),
    ...checks("marriage", ["未婚", "已婚"], [224, 288], 1110), ...checks("familyType", ["小家庭", "三代同堂", "單親"], [224, 306, 406], 1140),
    ...checks("economy", ["普通", "單薪", "雙薪", "小康", "富裕"], [224, 288, 352, 415, 479], 1170),
    ...checks("caregivers", ["產婦本人", "祖母", "外婆", "親戚", "保母"], [278, 379, 442, 506, 570], 1200),
    t("$author", 598, 1280, 270, 30),
  ] },
  { source: "mama-admission", page: 1, title: "疫情之防疫作為", slots: [
    c("motherInfection", "無", 390, 267), ...checks("motherSymptoms", ["發燒", "腹瀉", "咳嗽", "流鼻水", "出疹子"], [498, 558, 619, 695, 776], 232), c("motherSymptoms", "其他", 452, 268),
    t("motherOtherSymptoms", 533, 264, 328), t("motherDiagnosis", 547, 295, 314),
    c("familyInfection", "無", 390, 402), t("familyRelation", 550, 350, 300),
    ...checks("familySymptoms", ["發燒", "腹瀉", "咳嗽", "流鼻水", "出疹子"], [507, 580, 647, 717, 805], 384),
    t("familyOtherSymptoms", 528, 418, 332), t("familyDiagnosis", 550, 450, 310),
    c("schoolInfection", "無", 390, 549), ...checks("schoolDisease", ["腸病毒", "流感", "水痘"], [496, 582, 650], 530), c("schoolDisease", "其他", 452, 563), t("schoolDiseaseNote", 536, 562, 321),
    c("caregiverInfection", "無", 390, 702), c("caregiverInfection", "有", 452, 670),
    signature(153, 837, 195), ...checks("respondentIdentity", ["孕婦本人", "先生", "親友"], [372, 535, 651], 849), t("respondentRelation", 790, 838, 105),
  ] },
];

const babyAdmission: PaperPage[] = [
  { source: "baby-admission", page: 0, title: "新生兒入住評估單", slots: [
    ...identity(810, 49, 116), ...checks("sex", ["男", "女"], [152, 232], 160), ...checks("stayPlan", ["21", "30", "其它"], [438, 491, 545], 160), t("stayDays", 614, 152, 42), { ...t("gestation", 775, 152, 43), format: "weeks" }, { ...t("gestation", 856, 152, 43), format: "days" },
    ...checks("hospital", ["璟馨", "詠馨"], [152, 233], 203), c("hospital", "其它", 152, 233), t("hospitalOther", 229, 230, 111),
    ...checks("delivery", ["NSD", "VED"], [438, 522], 201), c("delivery", "C/S", 438, 233), t("deliveryNote", 532, 227, 115), t("apgar1", 766, 207, 48), t("apgar5", 835, 207, 63),
    t("birthWeight", 154, 277, 145), t("dischargeWeight", 438, 277, 151), t("weight", 757, 277, 120),
    ...checks("feeding", ["母乳", "配方奶"], [153, 232], 334), c("feeding", "其他", 153, 363), t("feedingNote", 235, 356, 103),
    ...checks("formulaBrand", ["亞培", "優生", "雀巢"], [438, 522, 591], 334), c("formulaBrand", "S-26", 438, 362), c("formulaBrand", "其它", 522, 362), t("formulaBrandOther", 595, 356, 55), t("milk", 749, 339, 126),
    ...checks("hbig", ["已施打", "不需施打"], [300, 628], 438), ...monthDay("hbigDate", [493, 556], 429),
    c("hepatitis", "已施打", 221, 468), c("hepatitis", "未施打", 556, 468), ...monthDay("hepatitisDate", [414, 478], 461), ...monthDay("hepatitisReturn", [778, 845], 461),
    ...checks("screening", ["已做", "未做"], [230, 296], 548), ...monthDay("screeningReturn", [510, 572], 537),
    c("screeningItems", "LSD", 637, 548), c("screeningItems", "SCID＋SMA＋BD", 721, 548), c("screeningItems", "MPS＋ALD", 637, 580), t("bloodType", 177, 574, 200), t("ige", 166, 605, 107),
    c("hearingLeft", "正常", 193, 686), c("hearingRight", "正常", 193, 686), c("hearingLeft", "正常", 270, 686), c("hearingRight", "正常", 342, 686),
    c("hearingLeft", "異常", 459, 686), c("hearingRight", "異常", 459, 686), c("hearingLeft", "異常", 545, 686), c("hearingRight", "異常", 621, 686), t("hearingReviewDate", 801, 678, 104, 23, 8),
    c("brainUltrasoundResult", "正常", 261, 716), c("brainUltrasoundResult", "其它", 330, 716), t("brainUltrasoundReport", 408, 708, 488),
    ...checks("heartFindings", ["正常", "PDA", "PFO"], [262, 331, 553], 745), ...checks("heartFindings", ["VSD", "ASD", "其它"], [262, 464, 665], 774), t("heartUltrasoundReport", 762, 770, 130),
    c("abdomenUltrasoundResult", "正常", 261, 805), c("abdomenUltrasoundResult", "其它", 330, 805), t("abdomenUltrasoundReport", 409, 798, 483), c("kidneyUltrasoundResult", "正常", 261, 836), c("kidneyUltrasoundResult", "其它", 330, 836), t("kidneyUltrasoundReport", 409, 829, 483), c("hipUltrasoundResult", "正常", 261, 866), c("hipUltrasoundResult", "其它", 330, 866), t("hipUltrasoundReport", 409, 857, 483),
    c("medicationTypes", "鐵劑", 193, 950), t("ironFrequency", 384, 942, 37), t("ironDrops", 543, 942, 35), c("medicationTypes", "維他命", 193, 980), t("vitaminFrequency", 384, 974, 37), t("vitaminDrops", 543, 974, 35), c("medicationTypes", "其他", 193, 1010), t("medicationNote", 272, 1004, 616, 28),
    c("supplementTypes", "母乳添加劑", 193, 1041), t("supplementMilk", 382, 1032, 43), c("supplementTypes", "其它", 193, 1071), t("supplementNote", 274, 1064, 614, 27),
    t("motherComplaint", 91, 1141, 816, 150, 10),
  ] },
  { source: "baby-admission", page: 1, title: "新生兒入住身體狀況評估單", slots: [
    ...identity(767, 45, 109, 802), ...dateParts("bodyDate", [29, 105, 174], 162), t("bodyTime", 397, 161, 98),
    ...checks("temperatureSite", ["腋溫", "肛溫"], [98, 160], 209), t("temperature", 231, 200, 47), t("pulse", 401, 200, 47), t("respiration", 596, 200, 42), t("oxygen", 817, 200, 36),
    t("head", 180, 251, 94), t("height", 370, 251, 91),
    ...checks("caput", ["正常", "有"], [163, 233], 282), t("caputLocation", 333, 272, 96), ...checks("cephalohematoma", ["正常", "有"], [163, 233], 310), t("cephalohematomaLocation", 333, 301, 96),
    ...checks("fontanelle", ["正常", "凸起", "凹陷", "裂痕過大"], [163, 233, 301, 369], 338), ...checks("skull", ["正常", "重疊", "凹陷"], [163, 233, 301], 367),
    ...checks("ears", ["正常", "外耳廓分裂", "耳垂瘜肉"], [162, 232, 360], 433), t("earsNote", 543, 427, 324),
    ...checks("eyes", ["正常", "鞏膜出血", "分泌物"], [162, 232, 489], 459), t("eyesNote", 406, 453, 63),
    ...checks("mouth", ["正常", "兔唇", "腭裂", "鵝口瘡"], [163, 233, 301, 369], 491), t("mouthNote", 524, 481, 85),
    ...checks("face", ["正常", "左右臉不對稱", "壓迫性出血點"], [162, 232, 380], 512),
    ...checks("chest", ["正常", "乳頭下有瘜肉", "乳頭凹陷", "魔乳", "胸骨凹陷"], [163, 233, 382, 497, 564], 586), ...checks("breathing", ["正常", "淺快"], [163, 233], 615), t("breathingNote", 378, 605, 290),
    ...checks("cord", ["臍膨出", "已脫落", "未脫落"], [163, 251, 341], 683), t("cordNote", 460, 673, 187), ...checks("abdominalDistension", ["無", "有"], [163, 251], 711),
    ...yesNo("redButtock", 163, 778), t("redButtockNote", 338, 768, 516),
    ...checks("stoolColor", ["黃", "綠", "其他"], [211, 266, 304], 806), t("stoolColorOther", 386, 797, 68),
    ...checks("stoolConsistency", ["糊", "軟", "稀", "滲便"], [530, 570, 609, 649], 803), ...checks("stoolAmount", ["多", "中", "少"], [758, 798, 837], 803),
    ...checks("scrotum", ["正常", "水腫"], [163, 251], 875), ...checks("labia", ["正常", "水腫"], [163, 251], 902), ...checks("testis", ["正常", "未下降"], [163, 251], 930), t("testisNote", 380, 921, 450),
    ...checks("urineColor", ["正常", "結晶尿"], [214, 273], 954), ...checks("urineAmount", ["多", "中", "少"], [402, 441, 481], 954),
    ...checks("skin", ["正常", "黃疸", "嘴唇發紺", "末端肢體發紺", "其他"], [159, 229, 298, 407, 556], 1025), t("skinLocation", 690, 1017, 175),
    ...yesNo("mongolianSpot", 163, 1054), t("mongolianSpotLocation", 337, 1044, 265), ...yesNo("hemangioma", 163, 1082), t("hemangiomaLocation", 337, 1072, 265), ...yesNo("rash", 163, 1110), t("rashLocation", 337, 1100, 265), ...yesNo("pustule", 163, 1138), t("pustuleLocation", 337, 1128, 265),
    ...checks("limbs", ["正常", "多指", "畸形"], [160, 230, 437], 1197), t("limbsLocation", 351, 1194, 70),
    ...checks("cry", ["適中", "宏亮", "弱", "其他"], [160, 230, 299, 348], 1224), t("cryNote", 462, 1222, 376), ...checks("activity", ["適中", "強", "須刺激"], [160, 230, 281], 1251),
    signature(135, 1310, 258), t("$author", 554, 1305, 290, 30),
  ] },
];

const mood: PaperPage = { source: "scales", page: 0, title: "產後心情量表", slots: [...identity(762, 47, 129), ...dateParts("date", [182, 246, 308], 164)] };
const social: PaperPage = { source: "scales", page: 1, title: "產婦家庭及社會支持量表", slots: [...identity(735, 45, 124), ...dateParts("date", [147, 213, 278], 272)] };
export const PAPER_TEMPLATES: Record<PaperTemplateId, PaperPage[]> = {
  "mama-admission": mamaAdmission,
  "baby-admission": babyAdmission,
  "mama-daily": [{ source: "mama-daily", page: 0, title: "產婦每日護理評估表", slots: [...identity(806, 45, 116, 830), ...checks("delivery", ["NSD", "C/S"], [71, 156], 111), ...checks("woundSite", ["腹部", "會陰"], [104, 125], 732), t("$sheetNumber", 493, 1326, 31, 24, 9)] }],
  "baby-daily": [{ source: "baby-daily", page: 0, title: "新生兒每日評估照護單", slots: [...identity(824, 43, 100, 844), ...checks("delivery", ["NSD", "C/S"], [760, 832], 129), { ...t("date", 101, 140, 55, 22, 9), format: "year" }, ...checks("feedingType", ["母奶", "配方奶"], [220, 295], 145), t("feedingOther", 375, 138, 95, 24, 9), t("$sheetNumber", 533, 1326, 31, 24, 9)] }],
  mood: [mood], social: [social],
};

/** 對齊已核對的原掃描方框；不移動文字，也不影響未選選項。 */
export function calibratedSlots(slots: PaperSlot[], source: string, page = 0): PaperSlot[] {
  const boxes = (checkboxPositions as Record<string, number[][]>)[`${source}-${page + 1}`] ?? [];
  return slots.map((slot) => {
    if (slot.kind !== "check") return slot;
    const near = boxes.filter(([x,y]) => Math.abs(x-slot.x) <= 18 && Math.abs(y-slot.y) <= 10)
      .sort((a,b) => (a[0]-slot.x)**2 + 4*(a[1]-slot.y)**2 - ((b[0]-slot.x)**2 + 4*(b[1]-slot.y)**2));
    const box=near[0];
    return box ? { ...slot, x: box[0]+2, y: box[1]+2, w: box[2]-4, h: box[3]-4 } : slot;
  });
}

/** 四次紀錄欄保留原紙本全部固定選項，僅填值或勾選原框。 */
export function mamaDailySlots(column: number): PaperSlot[] {
  const x = 150 + column * 198;
  const mc = (key: string, options: string[], offsets: number[], y: number) => checks(key, options, offsets.map((offset) => x + offset), y);
  return [
    { ...t("date", x + 44, 145, 40), format: "month" }, { ...t("date", x + 115, 145, 40), format: "day" }, t("time", x + 14, 182, 170), t("$vitals", x + 8, 218, 182, 25, 8),
    ...mc("mood", ["平靜", "愉悅", "疲倦"], [7, 73, 139], 255), ...mc("mood", ["易哭", "冷漠", "焦慮"], [7, 73, 139], 284),
    ...mc("uriStatus", ["無", "有"], [7, 55], 312), t("$uri", x + 148, 305, 45, 24, 8),
    ...mc("painSites", ["乳房", "宮縮", "傷口"], [7, 73, 139], 343), ...mc("painSites", ["痔瘡", "其他"], [7, 73], 371), t("painOther", x + 128, 367, 65, 22, 8), t("painScore", x + 88, 397, 103, 23, 8),
    c("fundusPosition", "U−", x + 7, 423), t("fundus", x + 48, 418, 45, 22, 8), c("fundusPosition", "pelvic", x + 126, 423),
    ...mc("contraction", ["硬", "鬆軟", "按摩後硬"], [7, 55, 115], 453),
    ...mc("lochiaAmount", ["微量", "少", "中"], [34, 93, 135], 482), ...mc("lochiaAmount", ["大量", "無", "血塊"], [34, 93, 135], 509),
    ...mc("lochiaColor", ["鮮紅", "暗紅", "褐"], [33, 91, 152], 537), ...mc("lochiaColor", ["淡紅", "淡黃", "無"], [33, 91, 152], 564),
    ...mc("breast", ["軟", "充盈", "發紅"], [8, 67, 136], 593), ...mc("breast", ["局部硬塊", "退奶"], [8, 136], 619),
    ...mc("lactation", ["親餵", "手擠瓶餵"], [8, 67], 649), t("pumping", x + 112, 680, 43, 25, 8),
    ...mc("woundStatus", ["乾淨平整", "紅腫"], [7, 120], 708), ...mc("woundStatus", ["發紅", "分泌物"], [7, 120], 738),
    ...mc("dressingTypes", ["美容膠", "防水敷"], [7, 101], 789), ...mc("dressingTypes", ["人工皮", "矽膠貼"], [7, 101], 814), ...mc("dressingTypes", ["凝膠", "其它"], [7, 101], 839), t("dressingOther", x + 154, 834, 37, 22, 7),
    ...mc("urinary", ["正常", "需加壓"], [7, 73], 871), ...mc("urinary", ["失禁", "頻尿", "Foley"], [7, 73, 139], 900), c("urinary", "小便灼熱、刺痛", x + 7, 928),
    ...mc("bowel", ["有，正常"], [7], 959), c("bowel", "腹瀉", x + 7, 985), t("diarrheaTimes", x + 88, 977, 63, 22, 8), c("bowel", "未解", x + 7, 1012), t("noStoolDays", x + 88, 1004, 63, 22, 8),
    ...mc("mobility", ["自如", "需協助"], [7, 73], 1042),
    t("note", x + 5, 1057, 186, 216, 9), t("$author", x + 5, 1280, 186, 33, 8),
  ];
}

export const PAPER_SHIFTS = ["N", "D", "E"] as const;
/** 相同班別有明確舊代碼可對照；時間歸屬依使用者記錄日期，不從時刻猜跨日。 */
export function paperShift(value: string) {
  if (value === "大夜 23–07" || value === "N") return "N";
  if (value === "白班 07–15" || value === "D") return "D";
  if (value === "小夜 15–23" || value === "E") return "E";
  return "";
}

export function babyDailySlots(day: number, shift: number): PaperSlot[] {
  const x = 170 + day * 155 + shift * (155 / 3);
  const cell = (key: string, y: number, h = 29) => t(key, x + 3, y, 45, h, 7);
  return [t("time", x+23, 235, 27, 27, 6), cell("temperature", 271), cell("pulse", 301), cell("respiration", 334), cell("$activity", 366), cell("$sucking", 399),
    ...["乾燥", "臉疹", "身疹", "腋下浸潤", "股溝浸潤"].map((option, i) => ({ ...c("skinFindings", option, x + 20, 438 + i * 32), w: 12, h: 12 })),
    cell("cordPresent", 598), cell("cordAppearance", 631), cell("redBottomPresent", 680), cell("$redGrade", 722), cell("careIssue", 811, 303), cell("$author", 1124, 55)];
}

export function babyDaySlots(day: number): PaperSlot[] {
  const x = 170 + day * 155;
  return [t("$columnDate", x + 10, 172, 132, 24, 9), t("stayDay", x + 10, 208, 132, 23, 9), c("roomingDailyStatus", "≥8hrs", x + 5, 772), c("roomingDailyStatus", "其他時數", x + 71, 772), t("roomingDailyHours", x + 118, 771, 17, 23, 6)];
}
