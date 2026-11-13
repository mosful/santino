"use client";

import Tabs from "@/components/ui/Tabs";
import Badge from "@/components/ui/Badge";
import SortableHeader, { useTableSort } from "@/components/ui/SortableHeader";

const LOGS = [
  { id: 1, member: "邱o乾", course: "產後瑜珈", sentAt: "2026-08-28 09:03", status: "已送達" },
  { id: 2, member: "林o臻", course: "新生兒沐浴教學", sentAt: "2026-08-27 15:20", status: "已送達" },
  { id: 3, member: "陳o琳", course: "產後瑜珈", sentAt: "2026-08-27 10:48", status: "發送失敗" },
];

function NotifyLogTab({ type }: { type: string }) {
  const { sorted, sort, toggle } = useTableSort(LOGS);
  return (
    <div className="query-panel space-y-3 text-sm">
      <p className="text-xs text-stone-400">
        觸發條件與時機由13.8課程通知設定決定，本頁僅顯示{type}的實際發送記錄（Push API，單一對象即時發送）。
      </p>
      <div className="overflow-x-auto"><table className="w-full min-w-[520px] text-left text-xs">
        <thead className="text-stone-500">
          <tr>
            <SortableHeader columnKey="member" label="會員" sort={sort} onToggle={toggle} className="px-2 py-1" />
            <SortableHeader columnKey="course" label="課程" sort={sort} onToggle={toggle} className="px-2 py-1" />
            <SortableHeader columnKey="sentAt" label="發送時間" sort={sort} onToggle={toggle} className="px-2 py-1" />
            <SortableHeader columnKey="status" label="狀態" sort={sort} onToggle={toggle} className="px-2 py-1" />
          </tr>
        </thead>
        <tbody>
          {sorted.map((log) => (
            <tr key={log.id} className="border-t border-stone-100">
              <td className="px-2 py-1.5">{log.member}</td>
              <td className="px-2 py-1.5">{log.course}</td>
              <td className="px-2 py-1.5">{log.sentAt}</td>
              <td className="px-2 py-1.5">
                <Badge color={log.status === "已送達" ? "green" : "rose"}>{log.status}</Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table></div>
    </div>
  );
}

export default function CourseNotify() {
  return (
    <Tabs
      tabs={[
        { key: "success", label: "報名成功通知", content: <NotifyLogTab type="報名成功通知" /> },
        { key: "reminder", label: "開課提醒通知", content: <NotifyLogTab type="開課提醒通知" /> },
        { key: "change", label: "取消／異動通知", content: <NotifyLogTab type="取消／異動通知" /> },
      ]}
    />
  );
}
