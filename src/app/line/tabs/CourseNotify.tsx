"use client";

import Tabs from "@/components/ui/Tabs";
import Badge from "@/components/ui/Badge";

function NotifyLogTab({ type }: { type: string }) {
  return (
    <div className="space-y-2 text-sm">
      <p className="text-xs text-slate-400">
        觸發條件與時機由13.8課程通知設定決定，本頁僅顯示{type}的實際發送記錄（Push API，單一對象即時發送）。
      </p>
      <table className="w-full text-left text-xs">
        <thead className="text-slate-500">
          <tr>
            <th className="px-2 py-1">會員</th>
            <th className="px-2 py-1">課程</th>
            <th className="px-2 py-1">發送時間</th>
            <th className="px-2 py-1">狀態</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-t border-slate-100">
            <td className="px-2 py-1.5">邱o乾</td>
            <td className="px-2 py-1.5">產後瑜珈</td>
            <td className="px-2 py-1.5">2026-08-28 09:03</td>
            <td className="px-2 py-1.5">
              <Badge color="green">已送達</Badge>
            </td>
          </tr>
        </tbody>
      </table>
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
