"use client";

import { LayoutDashboard, Route } from "lucide-react";
import Switch from "@/components/ui/Switch";
import SegmentedControl from "@/components/ui/SegmentedControl";
import { useSameRoomLock, setSameRoomLock } from "@/lib/windowLockStore";
import { careActions, useCareStore } from "@/lib/care/store";
import { canEditAdminSetting } from "@/lib/permissions";
import { useCurrentRole } from "@/lib/roleStore";
import { setEnabledPhase, useEnabledPhase, type EnabledPhase } from "@/lib/phaseStore";
import {
  setDashboardLayout,
  useDashboardLayout,
  type DashboardLayout,
} from "@/lib/dashboardLayoutStore";

const PHASE_OPTIONS = [
  { value: 1 as EnabledPhase, label: "Phase 1", help: "只顯示第一階段核心功能選單" },
  { value: 2 as EnabledPhase, label: "Phase 1＋2", help: "顯示第一、二階段功能選單" },
];

const LAYOUT_OPTIONS = [
  { value: "journey" as DashboardLayout, label: "流程中控", icon: Route, help: "以案件七階段流程為主的中控版型" },
  { value: "classic" as DashboardLayout, label: "原中控", icon: LayoutDashboard, help: "沿用舊系統配置的中控版型" },
];

export default function SystemSettings() {
  const multiWindowLock = useSameRoomLock();
  const { data: care } = useCareStore();
  const role = useCurrentRole();
  const canEditSystem = canEditAdminSetting(role, "system");
  const canEditOperations = canEditAdminSetting(role, "operations");
  const enabledPhase = useEnabledPhase();
  const dashboardLayout = useDashboardLayout();

  return (
    <div className="max-w-3xl space-y-4 text-sm">
      <section className="rounded-xl border border-border-subtle bg-surface-raised p-4 shadow-xs">
        <h3 className="text-sm font-semibold text-stone-700">介面顯示設定</h3>
        <p className="mt-1 text-xs text-stone-500">僅影響本機瀏覽器的顯示方式，不會變更任何院務資料。</p>

        <dl className="mt-4 divide-y divide-stone-200">
          <SettingRow
            term="功能分期顯示"
            description="控制側邊選單顯示到哪一個開發階段；Phase 1＋2 會同時包含第一階段功能。"
          >
            <SegmentedControl
              ariaLabel="功能分期顯示"
              value={enabledPhase}
              onChange={setEnabledPhase}
              options={PHASE_OPTIONS}
            />
          </SettingRow>
          <SettingRow
            term="櫃台服務中控版型"
            description="設定「1. 櫃台服務」首頁採流程中控或原中控配置。"
          >
            <SegmentedControl
              ariaLabel="櫃台服務中控版型"
              value={dashboardLayout}
              onChange={setDashboardLayout}
              options={LAYOUT_OPTIONS}
            />
          </SettingRow>
        </dl>
      </section>

      <section className="rounded-xl border border-rose-200 bg-rose-50 p-4">
        <div className="mb-2 flex items-center justify-between">
          <div className="text-xs font-medium text-rose-700">
            多視窗鎖房範圍開關（系統開發總則第9條）
          </div>
          <Switch checked={multiWindowLock} onChange={setSameRoomLock} disabled={!canEditSystem} />
        </div>
        <p className="text-xs text-rose-600">
          {multiWindowLock
            ? "已開啟：多視窗僅限「同一房間內」可多開，不可同時操作不同房間的表單。"
            : "已關閉（預設）：多視窗不限房間，可同時開啟不同房間的表單／分頁，僅「簽名」步驟強制鎖定單一房間。"}
        </p>
        {!canEditSystem && <p className="mt-2 text-xs font-medium text-rose-700">此為系統層級設定，僅系統管理員可修改。</p>}
      </section>

      <section className="rounded-xl border border-border-subtle bg-surface-raised p-4 shadow-xs">
        <h3 className="text-sm font-semibold text-stone-700">退房後護理紀錄補登窗口</h3>
        <div className="mt-3 flex items-center gap-2 text-xs text-stone-600">
          退房後
          <input
            type="number"
            value={care.backfillDays}
            onChange={(e) => careActions.backfillDays(Number(e.target.value))}
            disabled={!canEditOperations}
            className="w-16 rounded-lg border border-border-subtle px-2 py-1 text-center disabled:bg-stone-100"
          />
          天內開放回補資料
        </div>
        <p className="mt-1 text-xs text-amber-600">
          ⚠ 客戶尚未定案此天數（阿長提議「3天」但本人加了問號），此為可調整參數示意，正式上線前需與客戶再確認。
        </p>
        {!canEditOperations && <p className="mt-1 text-xs font-medium text-stone-500">僅護理長及系統管理員可調整補登窗口。</p>}
        <p className="mt-1 text-xs text-stone-500">
          修改紀錄需正確歸屬實際登入員工，不可用共用帳號代填。
        </p>
      </section>
    </div>
  );
}

function SettingRow({
  term,
  description,
  children,
}: {
  term: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 py-3 first:pt-0 last:pb-0">
      <div className="min-w-0 max-w-sm">
        <dt className="text-xs font-semibold text-stone-700">{term}</dt>
        <dd className="mt-0.5 text-xs leading-5 text-stone-500">{description}</dd>
      </div>
      {children}
    </div>
  );
}
