import { makeRng, makeCycler, addDays } from "./genUtil";

const CURATED_ANNOUNCEMENTS = [
  { id: 1, title: "8月份消防安全宣導", date: "2026-08-05", author: "行政部" },
  { id: 2, title: "中秋節連假期間服務調整公告", date: "2026-08-20", author: "院長室" },
];

const ANNOUNCEMENT_TOPICS = [
  "產後瑜珈課程異動通知", "嬰兒室訪客管制加強公告", "月子餐菜單更新",
  "停車場整修公告", "護理站分機異動", "訪客時間調整公告", "防疫措施更新",
  "消防演習通知", "電梯維修公告", "母乳哺育政策更新", "課程報名截止提醒",
  "端午連假服務調整", "耶誕節活動預告", "冬令進補課程開放報名",
  "館內Wi-Fi升級公告", "停電演練通知", "新生兒篩檢廠商異動",
  "櫃檯服務時間調整", "會員系統維護公告", "年終大掃除公告",
];
const AUTHORS = ["行政部", "院長室", "護理部", "業務組", "餐飲組", "房務組"];

const rng1 = makeRng(6006);
const announcementCycler = makeCycler(rng1, ANNOUNCEMENT_TOPICS);
const GENERATED_ANNOUNCEMENTS = Array.from({ length: 48 }, (_, i) => {
  const { value: topic, round } = announcementCycler();
  return {
    id: i + 3,
    title: round === 1 ? topic : `${topic}（第${round}次）`,
    date: addDays("2026-06-01", rng1.int(0, 89)),
    author: rng1.pick(AUTHORS),
  };
});

export const ANNOUNCEMENTS = [...CURATED_ANNOUNCEMENTS, ...GENERATED_ANNOUNCEMENTS];

export type CalendarCategory =
  | "預約參觀"
  | "預約簽約"
  | "預產期"
  | "入出住"
  | "館內人數"
  | "訪客預約";

export const CALENDAR_CATEGORIES: CalendarCategory[] = [
  "預約參觀",
  "預約簽約",
  "預產期",
  "入出住",
  "館內人數",
  "訪客預約",
];

export const MAMA_CALENDAR_SAMPLE: {
  date: string;
  items: { category: CalendarCategory; text: string }[];
}[] = [
  {
    date: "08/28（五）",
    items: [
      { category: "預約參觀", text: "14:00 陳small姐" },
      { category: "入出住", text: "302入住｜邱小姐" },
      { category: "館內人數", text: "填床 9／賣床 12" },
    ],
  },
  {
    date: "08/29（六）",
    items: [
      { category: "預約簽約", text: "10:30 林小姐" },
      { category: "訪客預約", text: "15:00-17:00 王先生（205）" },
    ],
  },
  {
    date: "08/30（日）",
    items: [{ category: "預產期", text: "張小姐（預產期）" }],
  },
];

const CURATED_COURSES = [
  { id: 1, name: "產後瑜珈", time: "08/29 10:00", fee: true, enrolled: 8, cap: 10 },
  { id: 2, name: "新生兒沐浴教學", time: "08/30 14:00", fee: false, enrolled: 5, cap: 12 },
  { id: 3, name: "嬰兒按摩體驗", time: "09/02 10:30", fee: true, enrolled: 12, cap: 12 },
];

const COURSE_NAMES = [
  "產後瑜珈", "新生兒沐浴教學", "嬰兒按摩體驗", "副食品製作", "親子瑜珈",
  "產後塑身", "母乳哺育講座", "嬰兒手語入門", "新手爸媽學堂", "產後心理調適",
  "嬰兒安撫技巧", "寶寶按摩進階班", "產婦營養講座", "嬰幼兒急救CPR",
  "坐月子飲食觀念", "產後骨盆修復", "寶寶副食品試吃會", "親子共讀入門",
];

const rng2 = makeRng(7007);
const courseCycler = makeCycler(rng2, COURSE_NAMES);
const GENERATED_COURSES = Array.from({ length: 47 }, (_, i) => {
  const cap = rng2.pick([8, 10, 12, 15]);
  const { value: name, round } = courseCycler();
  return {
    id: i + 4,
    name: round === 1 ? name : `${name}（第${round}梯）`,
    time: `${addDays("2026-09-01", rng2.int(0, 59)).slice(5).replace("-", "/")} ${rng2.pick(["09:30", "10:00", "10:30", "14:00", "14:30"])}`,
    fee: rng2.bool(0.6),
    enrolled: rng2.int(0, cap),
    cap,
  };
});

export const COURSES = [...CURATED_COURSES, ...GENERATED_COURSES];
