"use client";

import PageHeader from "@/components/ui/PageHeader";
import RequireAccess from "@/components/ui/RequireAccess";
import TabsFromUrl from "@/components/ui/TabsFromUrl";
import EditableList, { type FieldSchema, type Row } from "@/components/ui/EditableList";
import PlaceholderNotice from "@/components/ui/PlaceholderNotice";
import { makeRng } from "@/lib/mock/genUtil";

const SURNAMES_D = ["陳", "王", "林", "張", "李", "黃", "吳", "劉", "蔡", "楊", "許", "鄭", "謝", "洪", "邱", "曾", "廖", "賴", "徐", "周"];
const GIVEN_D = ["如", "明", "華", "芳", "俊", "杰", "娟", "婷", "宏", "文", "美", "玲", "誠", "豪", "君"];
const rngDoc = makeRng(13001);
const usedDoctorNames = new Set(["陳O如", "王O明"]);
function nextDoctorName() {
  let name = `${rngDoc.pick(SURNAMES_D)}O${rngDoc.pick(GIVEN_D)}`;
  let guard = 0;
  while (usedDoctorNames.has(name) && guard < 500) {
    name = `${rngDoc.pick(SURNAMES_D)}O${rngDoc.pick(GIVEN_D)}`;
    guard++;
  }
  usedDoctorNames.add(name);
  return name;
}
const SAMPLE: Row[] = [
  { id: 1, doctor: "陳O如", visitDays: 20, scheduled: 45, arrived: 42, absent: 3 },
  { id: 2, doctor: "王O明", visitDays: 12, scheduled: 30, arrived: 28, absent: 2 },
  ...Array.from({ length: 48 }, (_, i) => {
    const scheduled = rngDoc.int(10, 50);
    const absent = rngDoc.int(0, 4);
    return {
      id: i + 3,
      doctor: nextDoctorName(),
      visitDays: rngDoc.int(4, 24),
      scheduled,
      arrived: scheduled - absent,
      absent,
    };
  }),
];

const doctorFields: FieldSchema[] = [
  { key: "doctor", label: "醫師姓名" },
  { key: "visitDays", label: "巡診天數", type: "number" },
  { key: "scheduled", label: "排診單數", type: "number" },
  { key: "arrived", label: "已到單數", type: "number" },
  { key: "absent", label: "未到單數", type: "number" },
];

function DeptTab({ showTcmConsent }: { showTcmConsent?: boolean } = {}) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <input placeholder="醫師姓名篩選" className="rounded border border-stone-200 px-2 py-1.5" />
        <input placeholder="查詢區間起" className="rounded border border-stone-200 px-2 py-1.5" />
        <span>～</span>
        <input placeholder="查詢區間迄" className="rounded border border-stone-200 px-2 py-1.5" />
        <button className="rounded bg-stone-700 px-3 py-1.5 text-white">查詢</button>
      </div>
      <EditableList moduleNo="6" fields={doctorFields} initialRows={SAMPLE} searchPlaceholder="醫師姓名" />
      {showTcmConsent && (
        <div className="rounded border border-stone-200 p-3">
          <div className="mb-2 text-xs font-medium text-stone-600">中醫看診同意書（6.3.1，新規劃）</div>
          <PlaceholderNotice text="中醫看診除預約掛號外，另需一份獨立的同意書文件；實際欄位內容尚未與客戶確認，先保留版位（見規格文件8.2節待確認事項）。" />
        </div>
      )}
    </div>
  );
}

export default function DoctorPage() {
  return (
    <div className="w-full px-4 py-3 sm:px-6 sm:py-4">
      <RequireAccess moduleNo="6">
      <PageHeader title="6. 醫師巡診" moduleNo="6" />
      <TabsFromUrl
        tabs={[
          { key: "obgyn", label: "婦產科", content: <DeptTab /> },
          { key: "pediatric", label: "兒科", content: <DeptTab /> },
          { key: "tcm", label: "中醫師", content: <DeptTab showTcmConsent /> },
        ]}
      />
      </RequireAccess>
    </div>
  );
}
