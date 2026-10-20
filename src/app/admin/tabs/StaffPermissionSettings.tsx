"use client";

import { Fragment, useState } from "react";
import { Check, Minus } from "lucide-react";
import Button from "@/components/ui/Button";
import { babycamActions } from "@/lib/babycam/actions";
import { useDomainStore } from "@/lib/demo/domainStore";
import { MODULES } from "@/lib/modules";
import { useEnabledPhase } from "@/lib/phaseStore";
import { canEditAdminSetting, getAccess, ROLE_PROFILE, ROLES, type AccessLevel, type Role } from "@/lib/permissions";
import { useCurrentRole } from "@/lib/roleStore";
import { StaffEditor } from "@/components/babycam/BabycamMasterPanels";

const input = "h-10 w-full rounded-lg border border-border-subtle bg-surface-raised px-3 text-sm";
const panel = "space-y-3 rounded-xl border border-border-subtle bg-surface-raised p-4 shadow-xs";

/**
 * 寶寶視訊的八格分段權限，與 BabyCam 的 01–08 同一套編號。
 * label 用的是工作區實際看得到的頁籤名，不是內部代號——
 * 管理者在這裡勾的，必須能對應到他在 17 模組裡看到的那一頁。
 */
const BABYCAM_SECTIONS: { code: string; label: string; group: string }[] = [
  { code: "01", label: "入住登記（含紀錄與報表）", group: "入住登記" },
  { code: "02", label: "寶寶登錄與掃碼歸位", group: "寶寶登錄" },
  { code: "03", label: "監視器狀態", group: "後臺管理" },
  { code: "04", label: "開放時段／房間清單／狀態維護", group: "後臺管理" },
  { code: "05", label: "狀態背景圖上傳", group: "後臺管理" },
  { code: "06", label: "環狀燈號看板", group: "系統設定" },
  { code: "07", label: "繼電器通道點測", group: "系統設定" },
  { code: "08", label: "燈號狀態定義", group: "系統設定" },
];

/** 寶寶視訊模組代號；此模組不屬於 Phase 1／2，但仍要出現在權限表上。 */
const BABYCAM_MODULE = "17";

function AccessMark({ level }: { level: AccessLevel }) {
  if (level === "edit")
    return (
      <span className="inline-flex items-center gap-1 text-brand-600" title="可使用">
        <Check className="h-3.5 w-3.5" aria-hidden="true" />
        可用
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 text-stone-400" title="不顯示此功能">
      <Minus className="h-3.5 w-3.5" aria-hidden="true" />
      <span className="sr-only">無權限（選單不顯示）</span>
    </span>
  );
}

/**
 * 人員與權限（v24 規格 §10，僅管理者可修改）。
 *
 * 一張表看完全部權限：上半是模組層（看得到哪些選單），寶寶視訊的八格分段權限
 * 直接**併在同一張表的 17 模組底下**當子列——分成兩張表時，管理者要回答
 * 「護理師到底能不能印手圈」得在兩個地方交叉比對。
 *
 * ⚠️ 模組層只有「可用／不顯示」兩種，沒有唯讀：沒權限的功能從選單整項拿掉
 * （見 lib/permissions.ts 的說明）。模組層是程式內建的示範矩陣，正式版以
 * 客戶權限表為準；可以調整的是寶寶視訊那八格。
 */
export default function StaffPermissionSettings() {
  const { data } = useDomainStore();
  const role = useCurrentRole();
  const enabledPhase = useEnabledPhase();
  const canEdit = canEditAdminSetting(role, "system");
  const [staffName, setStaffName] = useState("");
  const [staffRole, setStaffRole] = useState<Role>("護理師 陳護理師");
  const [message, setMessage] = useState("");

  // 只列目前開放的分期，避免管理者在 Phase 1 看到一堆還沒開發的模組；
  // 寶寶視訊是客戶指定優先開發的獨立範圍，不屬於任何分期，固定列出。
  const visibleModules = MODULES.filter((module) => module.no === BABYCAM_MODULE || module.phase <= enabledPhase);

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
      {message && (
        <p role="status" className="rounded-xl border border-border-subtle bg-surface-muted p-3 text-xs">
          {message}
        </p>
      )}

      <section className={panel}>
        <div>
          <h3 className="text-sm font-semibold text-stone-700">角色權限總表</h3>
          <p className="mt-1 text-xs leading-5 text-stone-500">
            目前顯示 <strong>Phase {enabledPhase}</strong> 開放的 {visibleModules.length - 1} 個模組，加上獨立範圍的「寶寶視訊」。
            分期可於「系統參數設定」調整。
            <br />
            模組層為程式內建的示範矩陣（依 v24 §1），<strong>沒有「唯讀」</strong>——不可用的功能直接不出現在選單上。
            寶寶視訊底下的八格可直接勾選調整。
          </p>
        </div>
        <div className="scroll-fade overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-xs">
            <thead>
              <tr className="border-b border-border-subtle text-stone-500">
                <th scope="col" className="px-3 py-2 font-medium">
                  功能
                </th>
                {ROLES.map((item) => (
                  <th key={item} scope="col" className="px-3 py-2 text-center font-medium">
                    {item}
                    <span className="mt-0.5 block font-normal text-stone-400">{ROLE_PROFILE[item].name}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleModules.map((module) => (
                <Fragment key={module.no}>
                  <tr className="border-b border-border-subtle/70">
                    <th scope="row" className="whitespace-nowrap px-3 py-2 text-left font-medium text-stone-700">
                      {module.no === "0" ? "" : `${module.no}. `}
                      {module.label}
                      {module.no === BABYCAM_MODULE && (
                        <span className="ml-1.5 rounded-full bg-purple-100 px-1.5 py-0.5 text-[10px] font-semibold text-purple-700">獨立範圍</span>
                      )}
                    </th>
                    {ROLES.map((item) => (
                      <td key={item} className="px-3 py-2 text-center">
                        <AccessMark level={getAccess(item, module.no)} />
                      </td>
                    ))}
                  </tr>

                  {/* 寶寶視訊的八格分段權限：併在同一張表，當 17 的子列 */}
                  {module.no === BABYCAM_MODULE &&
                    BABYCAM_SECTIONS.map((section) => (
                      <tr key={`${module.no}-${section.code}`} className="border-b border-border-subtle/40 bg-surface-muted/40">
                        <th scope="row" className="whitespace-nowrap py-1.5 pl-8 pr-3 text-left font-normal text-stone-600">
                          <span className="mr-1.5 font-mono text-[10px] text-stone-400">{section.code}</span>
                          {section.label}
                          {/* 群組只在與項目名稱不同時才標，否則會變成「入住登記 … 入住登記」 */}
                          {!section.label.startsWith(section.group) && (
                            <span className="ml-1.5 text-[10px] text-stone-400">→ {section.group}</span>
                          )}
                        </th>
                        {ROLES.map((item) => {
                          // 管理者固定全開；08 燈號狀態定義屬系統面，不開放轉授。
                          const locked = !canEdit || item === "管理者" || section.code === "08";
                          const checked = item === "管理者" || (data.sectionPermissions[item] ?? []).includes(section.code);
                          return (
                            <td key={item} className="px-3 py-1.5 text-center">
                              <input
                                aria-label={`${item}：寶寶視訊 ${section.code} ${section.label}`}
                                type="checkbox"
                                className="h-4 w-4"
                                disabled={locked}
                                checked={checked}
                                onChange={(event) =>
                                  run(
                                    () => babycamActions.permission(item, section.code, event.target.checked),
                                    "已更新寶寶視訊功能權限；該角色下次進入工作區即生效。",
                                  )
                                }
                              />
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs leading-5 text-stone-500">
          ⚠️ 勾選影響的是「看得到哪一個功能群組」：某個角色只要有任一格，該群組就會出現在寶寶視訊的上方導覽。
          不希望櫃台看到「後臺管理」，就不要勾代號 03／04／05 這三格。
        </p>
      </section>

      <section className={panel}>
        <div>
          <h3 className="text-sm font-semibold text-stone-700">展示帳號維護</h3>
          <p className="mt-1 text-xs text-stone-500">這裡不建立真實帳密；管理者不會被最後一個帳號停用操作鎖在外面。</p>
        </div>
        <fieldset disabled={!canEdit} className="space-y-3">
          <legend className="sr-only">展示帳號</legend>
          {data.staff.map((staff) => (
            <StaffEditor key={staff.id} staff={staff} />
          ))}
          <div className="grid gap-3 sm:grid-cols-3">
            <input
              aria-label="展示員工姓名"
              className={input}
              placeholder="員工姓名"
              value={staffName}
              onChange={(event) => setStaffName(event.target.value)}
            />
            <select
              aria-label="展示員工角色"
              className={input}
              value={staffRole}
              onChange={(event) => setStaffRole(event.target.value as Role)}
            >
              {ROLES.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
            <Button onClick={() => run(() => babycamActions.staff("", staffName, staffRole, true), "已新增展示員工。")}>
              新增展示員工
            </Button>
          </div>
        </fieldset>
      </section>
    </div>
  );
}
