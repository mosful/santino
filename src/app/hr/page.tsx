"use client";

import { useState } from "react";
import Tabs from "@/components/ui/Tabs";
import QueryList, { type Column } from "@/components/ui/QueryList";
import Badge from "@/components/ui/Badge";
import Switch from "@/components/ui/Switch";

type Staff = {
  id: number;
  name: string;
  dept: string;
  role: string;
  status: string;
};

const STAFF: Staff[] = [
  { id: 1, name: "王雅婷", dept: "嬰兒室組", role: "護理師", status: "在職" },
  { id: 2, name: "李婉真", dept: "嬰兒室組", role: "護理長", status: "在職" },
  { id: 3, name: "陳小美", dept: "業務組", role: "櫃臺", status: "在職" },
];

const columns: Column<Staff>[] = [
  { key: "name", label: "員工姓名" },
  { key: "dept", label: "部門" },
  { key: "role", label: "角色" },
  { key: "status", label: "狀態", render: (r) => <Badge color={r.status === "在職" ? "green" : "slate"}>{r.status}</Badge> },
];

function StaffTab() {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <select className="rounded border border-slate-200 px-2 py-1.5">
          <option>-所有部門-</option>
        </select>
        <label className="flex items-center gap-1">
          <input type="checkbox" /> 含離職員工
        </label>
        <button className="ml-auto rounded bg-rose-500 px-3 py-1.5 text-white">＋ 新增員工</button>
      </div>
      <QueryList columns={columns} rows={STAFF} searchPlaceholder="員工編號/姓名" />
    </div>
  );
}

const DEPT_ROLES = [
  { dept: "聖帝諾行政部", units: "業務組/嬰兒室組/房務組/餐飲組/院長室" },
  { dept: "嬰兒室組", units: "護理長、護理師（可設定部門主管/單位主管/跨部門主管/跨單位主管）" },
];

function RoleGroupSettings() {
  const [autoAuth, setAutoAuth] = useState(true);
  const [visibleUnits, setVisibleUnits] = useState({ nursery: true, admin: false, meal: false });

  return (
    <div className="rounded border border-slate-200 p-3">
      <div className="mb-2 text-xs font-medium text-slate-600">角色群組資料修改（如：護理長）</div>
      <div className="space-y-3 text-xs">
        <Switch checked={autoAuth} onChange={setAutoAuth} label="自動授權開關（開啟後新進該角色人員自動套用群組權限）" />
        <div>
          <div className="mb-1 text-slate-500">指定班表可看單位（跨單位班表檢視權限）</div>
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
          <label className="mb-1 block text-slate-500">三級主管歸屬</label>
          <select className="rounded border border-slate-200 px-2 py-1.5">
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
      <div className="rounded border border-slate-200 p-3">
        <div className="mb-2 text-xs font-medium text-slate-600">2.1 各部門權限比較表展開</div>
        <p className="text-xs text-slate-400">部門/單位/角色權限比較列表（示意）</p>
      </div>
      <div className="rounded border border-slate-200 p-3">
        <div className="mb-2 text-xs font-medium text-slate-600">2.2 考勤主管設定</div>
        <p className="text-xs text-slate-400">設定各部門/單位之考勤主管</p>
      </div>
      <div className="rounded border border-slate-200 p-3">
        <div className="mb-2 text-xs font-medium text-slate-600">2.3 部門角色列表</div>
        <ul className="space-y-1 text-xs text-slate-600">
          {DEPT_ROLES.map((d) => (
            <li key={d.dept}>
              <span className="font-medium">{d.dept}</span>：{d.units}
            </li>
          ))}
        </ul>
      </div>
      <RoleGroupSettings />
      <p className="text-xs text-slate-400">
        權限模版設定完整系統功能樹狀清單需覆蓋15個模組，每節點可設定「權限：全覽/部分/無」（另於15.後台管理章節詳列，本頁僅示意入口）。
      </p>
    </div>
  );
}

export default function HrPage() {
  return (
    <div className="mx-auto max-w-5xl p-6">
      <h1 className="mb-4 text-lg font-bold">10. 人事考勤</h1>
      <Tabs
        tabs={[
          { key: "staff", label: "員工資料", content: <StaffTab /> },
          { key: "permission", label: "權限設定", content: <PermissionTab /> },
        ]}
      />
    </div>
  );
}
