"use client";

import { useState } from "react";
import { Check, Eye, Minus } from "lucide-react";
import { babycamActions } from "@/lib/babycam/actions";
import { useDomainStore } from "@/lib/demo/domainStore";
import { MODULES } from "@/lib/modules";
import { getAccess, ROLE_PROFILE, ROLES, type AccessLevel, type Role } from "@/lib/permissions";
import { canEditAdminSetting } from "@/lib/permissions";
import { useCurrentRole } from "@/lib/roleStore";
import { StaffEditor } from "@/components/babycam/BabycamMasterPanels";

const input = "min-h-10 w-full rounded-lg border border-border-subtle bg-surface-raised px-3 py-2 text-sm";
const button = "min-h-10 rounded-lg border border-border-subtle px-3 py-2 text-sm hover:bg-stone-100 disabled:opacity-40";
const panel = "space-y-3 rounded-xl border border-border-subtle bg-surface-raised p-4 shadow-xs";

const BABYCAM_SECTIONS: { code: string; label: string }[] = [
  { code: "01", label: "入住與交付" },
  { code: "02", label: "寶寶登錄與標籤" },
  { code: "03", label: "監視器主檔" },
  { code: "04", label: "時段與狀態" },
  { code: "05", label: "背景圖維護" },
  { code: "06", label: "燈號與點測" },
  { code: "07", label: "繼電器通道" },
  { code: "08", label: "帳號與角色" },
];

function AccessMark({ level }: { level: AccessLevel }) {
  if (level === "edit") return <span className="inline-flex items-center gap-1 text-brand-600" title="可編輯"><Check className="h-3.5 w-3.5" aria-hidden="true" />編輯</span>;
  if (level === "view") return <span className="inline-flex items-center gap-1 text-stone-500" title="唯讀"><Eye className="h-3.5 w-3.5" aria-hidden="true" />唯讀</span>;
  return <span className="inline-flex items-center gap-1 text-stone-400" title="無權限"><Minus className="h-3.5 w-3.5" aria-hidden="true" /><span className="sr-only">無權限</span></span>;
}

/**
 * 人員與權限（v24 規格 §10，🔒 僅管理者可修改）。
 * 原本分散在「寶寶視訊管理」的帳號與八格權限設定收攏到這裡，
 * 再加上全站模組權限矩陣，讓權限只有一個查看與維護的地方。
 */
export default function StaffPermissionSettings() {
  const { data } = useDomainStore();
  const role = useCurrentRole();
  const canEdit = canEditAdminSetting(role, "system");
  const [staffName, setStaffName] = useState("");
  const [staffRole, setStaffRole] = useState<Role>("護理師 陳護理師");
  const [message, setMessage] = useState("");

  function run(action: () => void, success = "已更新。") {
    try {
      action();
      setMessage(success);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "操作失敗。");
    }
  }

  return (
    <div className="space-y-4 text-sm">
      {!canEdit && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
          此為系統面設定，僅「管理者」可修改；目前身分「{role}」為唯讀檢視。
        </p>
      )}
      {message && <p role="status" className="rounded-xl border border-border-subtle bg-stone-50 p-3 text-xs">{message}</p>}

      <section className={panel}>
        <div>
          <h3 className="text-sm font-semibold text-stone-700">全站模組權限矩陣</h3>
          <p className="mt-1 text-xs text-stone-500">
            依 v24 規格 §1 的角色表設定；管理者為全部可編輯，護理長涵蓋護理師與櫃台全部範圍。
            此表為程式內建的示範矩陣，正式版以客戶權限表為準。
          </p>
        </div>
        <div className="scroll-fade overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-xs">
            <thead>
              <tr className="border-b border-stone-200 text-stone-500">
                <th scope="col" className="px-3 py-2 font-medium">模組</th>
                {ROLES.map((item) => (
                  <th key={item} scope="col" className="px-3 py-2 font-medium">
                    {item}
                    <span className="mt-0.5 block font-normal text-stone-400">{ROLE_PROFILE[item].name}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MODULES.map((module) => (
                <tr key={module.no} className="border-b border-stone-100 last:border-b-0">
                  <th scope="row" className="whitespace-nowrap px-3 py-2 text-left font-medium text-stone-700">
                    {module.no}. {module.label}
                  </th>
                  {ROLES.map((item) => (
                    <td key={item} className="px-3 py-2"><AccessMark level={getAccess(item, module.no)} /></td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className={panel}>
        <div>
          <h3 className="text-sm font-semibold text-stone-700">展示帳號維護</h3>
          <p className="mt-1 text-xs text-stone-500">這裡不建立真實帳密；管理者不會被最後一個帳號停用操作鎖在外面。</p>
        </div>
        <fieldset disabled={!canEdit} className="space-y-3">
          <legend className="sr-only">展示帳號</legend>
          {data.staff.map((staff) => <StaffEditor key={staff.id} staff={staff} />)}
          <div className="grid gap-3 sm:grid-cols-3">
            <input aria-label="展示員工姓名" className={input} placeholder="員工姓名" value={staffName} onChange={(event) => setStaffName(event.target.value)} />
            <select aria-label="展示員工角色" className={input} value={staffRole} onChange={(event) => setStaffRole(event.target.value as Role)}>
              {ROLES.map((item) => <option key={item}>{item}</option>)}
            </select>
            <button type="button" className={button} onClick={() => run(() => babycamActions.staff("", staffName, staffRole, true), "已新增展示員工。")}>新增展示員工</button>
          </div>
        </fieldset>
      </section>

      <section className={panel}>
        <div>
          <h3 className="text-sm font-semibold text-stone-700">寶寶視訊功能權限</h3>
          <p className="mt-1 text-xs text-stone-500">
            控制各角色在「17. 寶寶視訊」工作區可用的八項功能。管理者固定全開，「帳號與角色」本身不開放調整。
          </p>
        </div>
        <div className="scroll-fade overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-xs">
            <thead>
              <tr className="border-b border-stone-200 text-stone-500">
                <th scope="col" className="px-3 py-2 font-medium">角色</th>
                {BABYCAM_SECTIONS.map((section) => (
                  <th key={section.code} scope="col" className="px-2 py-2 text-center font-medium">
                    {section.code}
                    <span className="mt-0.5 block whitespace-nowrap font-normal text-stone-400">{section.label}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROLES.map((item) => (
                <tr key={item} className="border-b border-stone-100 last:border-b-0">
                  <th scope="row" className="whitespace-nowrap px-3 py-2 text-left font-medium text-stone-700">{item}</th>
                  {BABYCAM_SECTIONS.map((section) => (
                    <td key={section.code} className="px-2 py-2 text-center">
                      <input
                        aria-label={`${item} ${section.code} ${section.label}`}
                        type="checkbox"
                        disabled={!canEdit || item === "管理者" || section.code === "08"}
                        checked={item === "管理者" || (data.sectionPermissions[item] ?? []).includes(section.code)}
                        onChange={(event) => run(() => babycamActions.permission(item, section.code, event.target.checked), "已更新功能權限。")}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
