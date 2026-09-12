import type { LucideIcon } from "lucide-react";
import {
  Baby,
  BedDouble,
  ClipboardCheck,
  FileSignature,
  House,
  MessagesSquare,
} from "lucide-react";

export type JourneyStageKey =
  | "consultation"
  | "contract"
  | "preAdmission"
  | "staying"
  | "discharge"
  | "followUp";

export type JourneyStage = {
  key: JourneyStageKey;
  shortLabel: string;
  label: string;
  description: string;
  icon: LucideIcon;
  color: "sky" | "violet" | "amber" | "emerald" | "orange" | "rose" | "slate" | "teal";
  checklist: string[];
  links: { label: string; href: string; hint: string }[];
};

export type JourneyMother = {
  id: number;
  name: string;
  stage: JourneyStageKey;
  status: string;
  dueDate?: string;
  room?: string;
  stayDay?: string;
  owner: string;
  nextAction: string;
  actionDate: string;
  urgency: "overdue" | "today" | "upcoming" | "normal";
  tags: string[];
};

export const JOURNEY_STAGES: JourneyStage[] = [
  {
    key: "consultation",
    shortLabel: "諮詢參觀",
    label: "諮詢與參觀",
    description: "從初次詢問、預約參觀到參觀後意願追蹤",
    icon: MessagesSquare,
    color: "sky",
    checklist: ["已建立客戶基本資料", "已記錄預產期與需求", "已完成參觀或後續追蹤"],
    links: [
      { label: "建立客戶資料", href: "/customer", hint: "基本資料與需求紀錄" },
      { label: "參觀排程", href: "/admin?tab=visit", hint: "新增與調整預約" },
      { label: "參觀提醒", href: "/care?tab=visit", hint: "行前提醒與未到追蹤" },
      { label: "簽約提醒", href: "/care?tab=contract-reminder", hint: "猶豫期與回訪提醒" },
    ],
  },
  {
    key: "contract",
    shortLabel: "簽約",
    label: "下訂與簽約",
    description: "確認房型天數、訂金、審閱與簽署狀態",
    icon: FileSignature,
    color: "emerald",
    checklist: ["房型與入住天數已確認", "訂金狀態已確認", "合約與必要附件已完成簽署"],
    links: [
      { label: "新增合約", href: "/contract?tab=new", hint: "建立合約與電子簽名" },
      { label: "簽署總覽", href: "/contract?tab=sign-status", hint: "缺簽與文件完整度" },
      { label: "合約查詢", href: "/contract?tab=list", hint: "訂金、天數與房型" },
    ],
  },
  {
    key: "preAdmission",
    shortLabel: "入住前",
    label: "待產與入住提醒",
    description: "確認生產消息、床位、餐食與入住文件",
    icon: ClipboardCheck,
    color: "orange",
    checklist: ["已確認生產與報到時間", "房間及嬰兒室已通知", "餐飲與入住文件已備妥"],
    links: [
      { label: "入住前關懷", href: "/care?tab=pre-admission", hint: "生產與報到時間確認" },
      { label: "房間動態", href: "/room", hint: "排房、清潔與床位準備" },
      { label: "月子餐設定", href: "/meal?tab=order", hint: "禁忌與首日餐點" },
    ],
  },
  {
    key: "staying",
    shortLabel: "入住中",
    label: "入住期間",
    description: "掌握母嬰照護、房況、餐食與加購異動",
    icon: BedDouble,
    color: "rose",
    checklist: ["母嬰基本評估已完成", "每日照護與餐食狀態正常", "合約異動與自費項目已登錄"],
    links: [
      { label: "媽媽照護", href: "/mama", hint: "媽媽評估與護理紀錄" },
      { label: "寶寶照護", href: "/baby", hint: "寶寶動態與照護紀錄" },
      { label: "合約變更", href: "/contract?tab=change-order", hint: "續住、換房與加購" },
      { label: "醫師巡診", href: "/doctor", hint: "巡診排程與結果" },
    ],
  },
  {
    key: "discharge",
    shortLabel: "退宿",
    label: "到期與退宿",
    description: "退宿提醒、帳務結清、衛教與房間交接",
    icon: House,
    color: "slate",
    checklist: ["尾款與自費項目已結清", "返家衛教與文件已完成", "房卡、物品及房務已交接"],
    links: [
      { label: "合約到期", href: "/contract?tab=renewal", hint: "到期、續住或提前退宿" },
      { label: "退宿交接", href: "/room", hint: "退房、清潔與物品點交" },
      { label: "返家關懷", href: "/care?tab=home-return", hint: "建立返家追蹤排程" },
    ],
  },
  {
    key: "followUp",
    shortLabel: "返家後",
    label: "返家與寶寶留房",
    description: "分流返家、寶寶留房與後續關懷",
    icon: Baby,
    color: "teal",
    checklist: ["已建立返家關懷排程", "寶寶留房時已另立托嬰案件", "後續異常與轉介均已記錄"],
    links: [
      { label: "托嬰合約", href: "/contract?tab=childcare", hint: "另立合約、車號與接回安排" },
      { label: "寶寶留房", href: "/baby", hint: "留房期間照護與健康紀錄" },
      { label: "返家關懷", href: "/care?tab=home-return", hint: "電話關懷與異常轉介" },
      { label: "客戶歷程", href: "/customer", hint: "封存本次入住完整歷程" },
    ],
  },
];

export const JOURNEY_MOTHERS: JourneyMother[] = [
  { id: 1, name: "吳○晴", stage: "consultation", status: "新詢問待聯繫", dueDate: "2027-02-18", owner: "櫃台－小美", nextAction: "確認預產期與偏好房型", actionDate: "今天 10:30", urgency: "today", tags: ["官網表單", "第一胎"] },
  { id: 2, name: "許○文", stage: "consultation", status: "已聯繫待回覆", dueDate: "2027-01-06", owner: "櫃台－阿凱", nextAction: "LINE 再次邀約參觀", actionDate: "09/14", urgency: "upcoming", tags: ["LINE", "雙人房"] },
  { id: 3, name: "張○雅", stage: "consultation", status: "明日參觀", dueDate: "2026-12-05", owner: "櫃台－小美", nextAction: "發送停車與參觀提醒", actionDate: "今天 16:00", urgency: "today", tags: ["14:00", "先生同行"] },
  { id: 4, name: "陳○涵", stage: "consultation", status: "參觀未到", dueDate: "2026-11-23", owner: "櫃台－婉真", nextAction: "重新安排參觀時間", actionDate: "逾期 1 天", urgency: "overdue", tags: ["未到訪", "電話"] },
  { id: 5, name: "郭○庭", stage: "consultation", status: "報價後考慮中", dueDate: "2026-12-16", owner: "櫃台－阿凱", nextAction: "確認 21 天方案意願", actionDate: "今天 15:30", urgency: "today", tags: ["21 天", "506 房"] },
  { id: 6, name: "黃○雯", stage: "consultation", status: "簽約邀約中", dueDate: "2026-11-30", owner: "櫃台－小美", nextAction: "保留房型期限確認", actionDate: "逾期 2 天", urgency: "overdue", tags: ["VIP", "待決定"] },
  { id: 7, name: "林○臻", stage: "contract", status: "合約待補簽", dueDate: "2026-09-28", owner: "櫃台－阿凱", nextAction: "補簽個資同意與附件", actionDate: "今天", urgency: "today", tags: ["30 天", "已收訂金"] },
  { id: 8, name: "楊○甯", stage: "contract", status: "訂金待入帳", dueDate: "2026-10-22", owner: "櫃台－婉真", nextAction: "確認匯款末五碼", actionDate: "09/15", urgency: "upcoming", tags: ["合約已簽", "20,000 元"] },
  { id: 9, name: "邱○乾", stage: "preAdmission", status: "預計 3 天內入住", dueDate: "2026-09-15", owner: "櫃台－小美", nextAction: "確認生產狀況與報到時間", actionDate: "今天 11:00", urgency: "today", tags: ["302 房", "入住文件缺 1"] },
  { id: 10, name: "周○蓉", stage: "preAdmission", status: "已生產待排房", dueDate: "2026-09-10", owner: "櫃台－阿凱", nextAction: "通知房務完成床位準備", actionDate: "立即處理", urgency: "overdue", tags: ["剖腹產", "餐點待確認"] },
  { id: 11, name: "王○馨", stage: "staying", status: "入住照護中", room: "205", stayDay: "第 8／21 天", owner: "護理師－雅婷", nextAction: "15:00 婦產科巡診", actionDate: "今天 15:00", urgency: "today", tags: ["親子同室", "月子餐正常"] },
  { id: 12, name: "蔡○潔", stage: "staying", status: "合約異動待確認", room: "506", stayDay: "第 18／21 天", owner: "櫃台－婉真", nextAction: "確認續住 7 天與換房", actionDate: "今天下班前", urgency: "today", tags: ["續住評估", "待簽變更單"] },
  { id: 13, name: "曾○柔", stage: "staying", status: "寶寶暫離館", room: "308", stayDay: "第 5／24 天", owner: "護理師－淑芬", nextAction: "追蹤返館時間", actionDate: "09/13", urgency: "upcoming", tags: ["外出就醫", "已完成交接"] },
  { id: 14, name: "李○蓁", stage: "discharge", status: "明日合約到期", room: "301", stayDay: "第 20／21 天", owner: "櫃台－小美", nextAction: "完成尾款與退宿文件", actionDate: "今天 14:00", urgency: "today", tags: ["尾款待結", "返家衛教"] },
  { id: 15, name: "蘇○萱", stage: "discharge", status: "今日退宿", room: "207", stayDay: "第 30／30 天", owner: "櫃台－阿凱", nextAction: "房卡回收與房務交接", actionDate: "今天 12:00", urgency: "overdue", tags: ["帳務已結", "10:00 接送"] },
  { id: 16, name: "劉○安", stage: "followUp", status: "媽媽已退宿／寶寶留房", room: "嬰兒室 B12", owner: "護理師－雅婷", nextAction: "確認授權期限與接回日期", actionDate: "今天 17:00", urgency: "today", tags: ["留房第 2 天", "黃疸追蹤"] },
  { id: 17, name: "鄭○涵", stage: "followUp", status: "返家關懷中", owner: "衛教師－琳雅", nextAction: "退宿後第 3 天電話關懷", actionDate: "09/14", urgency: "upcoming", tags: ["母乳追蹤", "情緒量表"] },
];
