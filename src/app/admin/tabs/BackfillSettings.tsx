"use client";

import Switch from "@/components/ui/Switch";
import { useSameRoomLock, setSameRoomLock } from "@/lib/windowLockStore";
import { careActions, useCareStore } from "@/lib/care/store";
import { canEditAdminSetting } from "@/lib/permissions";
import { useCurrentRole } from "@/lib/roleStore";
import { FormSection, ResultCard, WorkArea } from "@/components/ui/Workspace";

/** 資料回補與例外處理（v24 規格 §10）：退房後回補窗口與多視窗鎖房的例外規則。 */
export default function BackfillSettings() {
  const multiWindowLock = useSameRoomLock();
  const { data: care } = useCareStore();
  const role = useCurrentRole();
  const canEditSystem = canEditAdminSetting(role, "system");
  const canEditOperations = canEditAdminSetting(role, "operations");

  return (
    <WorkArea aside={<ResultCard title="一般回補期限" value={`退房後 ${care.backfillDays} 天`} description={`退房日起算，第 ${care.backfillDays} 天的 23:59 截止。逾期後由護理長／管理者補登或授權。`} />}>
      <FormSection title="退房後護理紀錄補登窗口">
        <div className="mt-3 flex items-center gap-2 text-xs text-stone-600">
          退房後
          <input
            aria-label="退房後回補天數"
            type="number"
            value={care.backfillDays}
            onChange={(e) => careActions.backfillDays(Number(e.target.value))}
            disabled={!canEditOperations}
            className="w-16 rounded-lg border border-border-subtle px-2 py-1 text-center disabled:bg-stone-100"
          />
          天內開放回補資料
        </div>
        <p className="mt-2 text-xs text-stone-600">
          以<strong>退房當日</strong>起算到第 {care.backfillDays} 天的 23:59 截止。例：10/1 退房、期限 3 天 → 10/4 23:59 以前都可補，10/5 00:00 起算逾期。
        </p>
        <p className="mt-1 text-xs text-stone-600">
          逾期後<strong>護理長與管理者可直接補登</strong>；其餘角色需由護理長或管理者填寫原因授權後才能補。
        </p>
        <p className="mt-2 text-xs text-amber-700">
          ⚠ 客戶尚未定案此天數（訪談中提議「3 天」但本人加了問號），此為可調整參數示意，正式上線前需與客戶再確認。
        </p>
        {!canEditOperations && <p className="mt-1 text-xs font-medium text-stone-500">僅護理長及管理者可調整補登窗口。</p>}
        <p className="mt-1 text-xs text-stone-500">
          授權須記錄原因；修改紀錄需正確歸屬實際登入員工，不可用共用帳號代填。
        </p>
      </FormSection>

      <section className="work-surface p-5">
        <div className="mb-2 flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-stone-700">多視窗鎖房範圍</h3>
          <Switch checked={multiWindowLock} onChange={setSameRoomLock} disabled={!canEditSystem} />
        </div>
        <p className="text-sm leading-6 text-stone-600">
          {multiWindowLock
            ? "已開啟：多視窗僅限「同一房間內」可多開，不可同時操作不同房間的表單。"
            : "已關閉（預設）：多視窗不限房間，可同時開啟不同房間的表單／分頁，僅「簽名」步驟強制鎖定單一房間。"}
        </p>
        {!canEditSystem && <p className="mt-2 text-xs font-medium text-rose-700">此為系統面設定，僅管理者可修改。</p>}
      </section>
    </WorkArea>
  );
}
