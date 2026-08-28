"use client";

import PageHeader from "@/components/ui/PageHeader";
import TabsFromUrl from "@/components/ui/TabsFromUrl";
import QueryList, { type Column } from "@/components/ui/QueryList";
import PlaceholderNotice from "@/components/ui/PlaceholderNotice";
import { COURSES } from "@/lib/mock/dashboard";
import RegistrationCheckin from "./tabs/RegistrationCheckin";
import FeeRefundSettings from "./tabs/FeeRefundSettings";
import NotificationSettings from "./tabs/NotificationSettings";

type Venue = { id: number; name: string; capacity: number; equip: string };
const VENUES: Venue[] = [
  { id: 1, name: "B1會議室", capacity: 20, equip: "投影機/白板" },
  { id: 2, name: "瑜珈教室", capacity: 15, equip: "瑜珈墊" },
];
const venueCols: Column<Venue>[] = [
  { key: "name", label: "場地名稱" },
  { key: "capacity", label: "容納人數" },
  { key: "equip", label: "設備" },
];

type Lecturer = { id: number; name: string; specialty: string; contact: string };
const LECTURERS: Lecturer[] = [
  { id: 1, name: "李老師", specialty: "產後瑜珈", contact: "0933-xxx-xxx" },
  { id: 2, name: "張老師", specialty: "嬰兒按摩", contact: "0955-xxx-xxx" },
];
const lecturerCols: Column<Lecturer>[] = [
  { key: "name", label: "講師姓名" },
  { key: "specialty", label: "專長" },
  { key: "contact", label: "聯絡方式" },
];

function CourseRegistrationTab() {
  return (
    <div className="space-y-2">
      {COURSES.map((c) => (
        <div key={c.id} className="flex items-center justify-between rounded border border-stone-200 p-2 text-sm">
          <span>
            {c.name}｜{c.time}
          </span>
          <span className="text-xs text-stone-400">
            已報名 {c.enrolled}/{c.cap}
          </span>
        </div>
      ))}
      <div className="flex gap-2 text-xs">
        <button className="rounded bg-stone-100 px-3 py-1.5">＋新增團課</button>
        <button className="rounded bg-stone-100 px-3 py-1.5">自費報名</button>
      </div>
    </div>
  );
}

export default function CoursePage() {
  return (
    <div className="w-full px-4 py-3 sm:px-6 sm:py-4">
      <PageHeader title="13. 課程管理" />
      <TabsFromUrl
        tabs={[
          {
            key: "calendar",
            label: "前台課程月曆",
            content: <PlaceholderNotice text="即1.中控中心＞課程管理，內容不變，請至首頁查看（交叉參照，不重複實作）。" />,
          },
          { key: "venue", label: "媽媽教室場地管理", content: <QueryList columns={venueCols} rows={VENUES} searchPlaceholder="場地名稱" /> },
          { key: "lecturer", label: "課程講師資料管理", content: <QueryList columns={lecturerCols} rows={LECTURERS} searchPlaceholder="講師姓名" /> },
          { key: "registration", label: "課程與報名管理", content: <CourseRegistrationTab /> },
          { key: "activity", label: "課程活動管理", content: <PlaceholderNotice text="活動類型設定、活動時段規劃，與常態課程差異化管理。" /> },
          { key: "checkin", label: "報名名單與簽到", content: <RegistrationCheckin /> },
          { key: "fee", label: "課程收費與退費設定", content: <FeeRefundSettings /> },
          { key: "notify", label: "課程通知設定", content: <NotificationSettings /> },
        ]}
      />
    </div>
  );
}
