"use client";

import { useState } from "react";
import { FormSection, SummaryRow, WorkArea } from "@/components/ui/Workspace";
import Switch from "@/components/ui/Switch";

export default function NotificationSettings() {
  const [successNotify, setSuccessNotify] = useState(true);
  const [reminderNotify, setReminderNotify] = useState(true);
  const [reminderHours, setReminderHours] = useState(24);
  const [changeNotify, setChangeNotify] = useState(true);

  return (
    <WorkArea aside={<FormSection title="通知時機摘要"><SummaryRow label="報名成功" value={successNotify ? "即時通知" : "關閉"} /><SummaryRow label="開課提醒" value={reminderNotify ? `開課前 ${reminderHours} 小時` : "關閉"} /><SummaryRow label="取消／異動" value={changeNotify ? "通知" : "關閉"} /><p className="text-xs leading-6 text-stone-500">此為原型設定；實際發送由課程通知模組執行。</p></FormSection>}>
      <p className="text-xs text-stone-400">
        本頁僅設定觸發時機與訊息範本，實際發送邏輯由14.4課程通知模組執行（設定/執行職責分開）。
      </p>
      <div className="work-surface p-5">
        <Switch checked={successNotify} onChange={setSuccessNotify} label="報名成功即時通知" />
      </div>
      <div className="work-surface p-5">
        <Switch checked={reminderNotify} onChange={setReminderNotify} label="開課提醒通知" />
        {reminderNotify && (
          <div className="mt-2 flex items-center gap-2 pl-8 text-xs text-stone-500">
            開課前
            <input
              aria-label="開課提醒時數"
              type="number"
              value={reminderHours}
              onChange={(e) => setReminderHours(Number(e.target.value))}
              className="w-16 rounded border border-stone-200 px-2 py-1"
            />
            小時發送（由排程工作掃描觸發）
          </div>
        )}
      </div>
      <div className="work-surface p-5">
        <Switch checked={changeNotify} onChange={setChangeNotify} label="取消／異動通知" />
      </div>
    </WorkArea>
  );
}
