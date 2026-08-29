"use client";

import { useState } from "react";
import PageHeader from "@/components/ui/PageHeader";
import RequireAccess from "@/components/ui/RequireAccess";
import TabsFromUrl from "@/components/ui/TabsFromUrl";
import EditableList, { type FieldSchema, type Row } from "@/components/ui/EditableList";
import Switch from "@/components/ui/Switch";
import { makeRng, maskedName } from "@/lib/mock/genUtil";

const DEPTS = ["嬰兒室組", "業務組", "房務組", "餐飲組", "院長室"];
const ROLES_BY_DEPT: Record<string, string[]> = {
  嬰兒室組: ["護理師", "護理長"],
  業務組: ["櫃臺", "業務主管"],
  房務組: ["房務人員", "房務主管"],
  餐飲組: ["餐飲組人員", "廚師"],
  院長室: ["人資", "院長"],
};
const rngStaff = makeRng(9001);
const STAFF: Row[] = [
  { id: 1, name: "王雅婷", dept: "嬰兒室組", role: "護理師", status: "在職" },
  { id: 2, name: "李婉真", dept: "嬰兒室組", role: "護理長", status: "在職" },
  { id: 3, name: "陳小美", dept: "業務組", role: "櫃臺", status: "在職" },
  ...Array.from({ length: 47 }, (_, i) => {
    const dept = rngStaff.pick(DEPTS);
    return {
      id: i + 4,
      name: maskedName(rngStaff),
      dept,
      role: rngStaff.pick(ROLES_BY_DEPT[dept]),
      status: rngStaff.bool(0.9) ? "在職" : "離職",
    };
  }),
];

const staffFields: FieldSchema[] = [
  { key: "name", label: "員工姓名" },
  { key: "dept", label: "部門" },
  { key: "role", label: "角色" },
  { key: "status", label: "狀態", type: "select", options: ["在職", "離職"] },
];

function StaffTab() {
  return <EditableList moduleNo="10" fields={staffFields} initialRows={STAFF} searchPlaceholder="員工編號/姓名" />;
}

const DEPT_ROLES = [
  { dept: "聖帝諾行政部", units: "業務組/嬰兒室組/房務組/餐飲組/院長室" },
  { dept: "嬰兒室組", units: "護理長、護理師（可設定部門主管/單位主管/跨部門主管/跨單位主管）" },
];

function RoleGroupSettings() {
  const [autoAuth, setAutoAuth] = useState(true);
  const [visibleUnits, setVisibleUnits] = useState({ nursery: true, admin: false, meal: false });

  return (
    <div className="rounded border border-stone-200 p-3">
      <div className="mb-2 text-xs font-medium text-stone-600">角色群組資料修改（如：護理長）</div>
      <div className="space-y-3 text-xs">
        <Switch checked={autoAuth} onChange={setAutoAuth} label="自動授權開關（開啟後新進該角色人員自動套用群組權限）" />
        <div>
          <div className="mb-1 text-stone-500">指定班表可看單位（跨單位班表檢視權限）</div>
          <div className="flex flex-wrap gap-3">
            <label className="flex items-center gap-1">
              <input type="checkbox" checked={visibleUnits.nursery} onChange={(e) => setVisibleUnits((v) => ({ ...v, nursery: e.target.checked }))} />
              嬰兒室組
            </label>
            <label className="flex items-center gap-1">
              <input type="checkbox" checked={visibleUnits.admin} onChange={(e) => setVisibleUnits((v) => ({ ...v, admin: e.target.checked }))} />
              行政部
            </label>
            <label className="flex items-center gap-1">
              <input type="checkbox" checked={visibleUnits.meal} onChange={(e) => setVisibleUnits((v) => ({ ...v, meal: e.target.checked }))} />
              餐飲組
            </label>
          </div>
        </div>
        <div>
          <label className="mb-1 block text-stone-500">三級主管歸屬</label>
          <select className="rounded border border-stone-200 px-2 py-1.5">
            <option>部門主管</option>
            <option>單位主管</option>
            <option>跨部門主管</option>
            <option>跨單位主管</option>
          </select>
        </div>
        <p className="text-amber-600">
          ⚠ 角色名稱異動請連動權限模版設定，避免兩處資料不同步。
        </p>
      </div>
    </div>
  );
}

function PermissionTab() {
  return (
    <div className="space-y-3 text-sm">
      <div className="rounded border border-stone-200 p-3">
        <div className="mb-2 text-xs font-medium text-stone-600">2.1 各部門權限比較表展開</div>
        <p className="text-xs text-stone-400">部門/單位/角色權限比較列表（示意）</p>
      </div>
      <div className="rounded border border-stone-200 p-3">
        <div className="mb-2 text-xs font-medium text-stone-600">2.2 考勤主管設定</div>
        <p className="text-xs text-stone-400">設定各部門/單位之考勤主管</p>
      </div>
      <div className="rounded border border-stone-200 p-3">
        <div className="mb-2 text-xs font-medium text-stone-600">2.3 部門角色列表</div>
        <ul className="space-y-1 text-xs text-stone-600">
          {DEPT_ROLES.map((d) => (
            <li key={d.dept}>
              <span className="font-medium">{d.dept}</span>：{d.units}
            </li>
          ))}
        </ul>
      </div>
      <RoleGroupSettings />
      <p className="text-xs text-stone-400">
        權限模版設定完整系統功能樹狀清單需覆蓋15個模組，每節點可設定「權限：全覽/部分/無」（另於15.後台管理章節詳列，本頁僅示意入口）。
      </p>
    </div>
  );
}

export default function HrPage() {
  return (
    <div className="w-full px-4 py-3 sm:px-6 sm:py-4">
      <RequireAccess moduleNo="10">
      <PageHeader title="10. 人事考勤" moduleNo="10" />
      <TabsFromUrl
        tabs={[
          { key: "staff", label: "員工資料", content: <StaffTab /> },
          { key: "permission", label: "權限設定", content: <PermissionTab /> },
        ]}
      />
      </RequireAccess>
    </div>
  );
}
