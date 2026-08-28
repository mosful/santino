export const ANNOUNCEMENTS = [
  { id: 1, title: "8月份消防安全宣導", date: "2026-08-05", author: "行政部" },
  { id: 2, title: "中秋節連假期間服務調整公告", date: "2026-08-20", author: "院長室" },
];

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

export const COURSES = [
  { id: 1, name: "產後瑜珈", time: "08/29 10:00", fee: true, enrolled: 8, cap: 10 },
  { id: 2, name: "新生兒沐浴教學", time: "08/30 14:00", fee: false, enrolled: 5, cap: 12 },
  { id: 3, name: "嬰兒按摩體驗", time: "09/02 10:30", fee: true, enrolled: 12, cap: 12 },
];
