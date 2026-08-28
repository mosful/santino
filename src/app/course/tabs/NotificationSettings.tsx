"use client";

import { useState } from "react";
import Switch from "@/components/ui/Switch";

export default function NotificationSettings() {
  const [successNotify, setSuccessNotify] = useState(true);
  const [reminderNotify, setReminderNotify] = useState(true);
  const [reminderHours, setReminderHours] = useState(24);
  const [changeNotify, setChangeNotify] = useState(true);

  return (
    <div className="space-y-3 text-sm">
      <p className="text-xs text-stone-400">
        本頁僅設定觸發時機與訊息範本，實際發送邏輯由14.4課程通知模組執行（設定/執行職責分開）。
      </p>
      <div className="rounded border border-stone-200 p-3">
        <Switch checked={successNotify} onChange={setSuccessNotify} label="報名成功即時通知" />
      </div>
      <div className="rounded border border-stone-200 p-3">
        <Switch checked={reminderNotify} onChange={setReminderNotify} label="開課提醒通知" />
        {reminderNotify && (
          <div className="mt-2 flex items-center gap-2 pl-8 text-xs text-stone-500">
            開課前
            <input
              type="number"
              value={reminderHours}
              onChange={(e) => setReminderHours(Number(e.target.value))}
              className="w-16 rounded border border-stone-200 px-2 py-1"
            />
            小時發送（由排程工作掃描觸發）
          </div>
        )}
      </div>
      <div className="rounded border border-stone-200 p-3">
        <Switch checked={changeNotify} onChange={setChangeNotify} label="取消／異動通知" />
      </div>
    </div>
  );
}
