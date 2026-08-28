"use client";

import Tabs from "@/components/ui/Tabs";
import QueryList, { type Column } from "@/components/ui/QueryList";
import PlaceholderNotice from "@/components/ui/PlaceholderNotice";
import { COURSES } from "@/lib/mock/dashboard";

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
        <div key={c.id} className="flex items-center justify-between rounded border border-slate-200 p-2 text-sm">
          <span>
            {c.name}｜{c.time}
          </span>
          <span className="text-xs text-slate-400">
            已報名 {c.enrolled}/{c.cap}
          </span>
        </div>
      ))}
      <div className="flex gap-2 text-xs">
        <button className="rounded bg-slate-100 px-3 py-1.5">＋新增團課</button>
        <button className="rounded bg-slate-100 px-3 py-1.5">自費報名</button>
      </div>
    </div>
  );
}

export default function CoursePage() {
  return (
    <div className="mx-auto max-w-5xl p-6">
      <h1 className="mb-4 text-lg font-bold">13. 課程管理</h1>
      <Tabs
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
          {
            key: "planned",
            label: "新規劃項目",
            content: <PlaceholderNotice text="報名名單與簽到／課程收費與退費設定／課程通知設定：全新規劃，無截圖可對照，待建置。" />,
          },
        ]}
      />
    </div>
  );
}
