export type ModuleInfo = {
  no: string;
  label: string;
  href: string;
};

// 15 大模組導覽（不含11更多功能歷史指標與16第二階段擴充功能，兩者不列入本階段）
export const MODULES: ModuleInfo[] = [
  { no: "1", label: "中控中心", href: "/" },
  { no: "2", label: "媽媽照護", href: "/mama" },
  { no: "3", label: "寶寶照護", href: "/baby" },
  { no: "4", label: "房間動態", href: "/room" },
  { no: "5", label: "客戶資料", href: "/customer" },
  { no: "6", label: "醫師巡診", href: "/doctor" },
  { no: "7", label: "媽媽關懷", href: "/care" },
  { no: "8", label: "評鑑指標", href: "/kpi" },
  { no: "9", label: "月子餐", href: "/meal" },
  { no: "10", label: "人事考勤", href: "/hr" },
  { no: "12", label: "合約管理", href: "/contract" },
  { no: "13", label: "課程管理", href: "/course" },
  { no: "14", label: "LINE官方帳號管理", href: "/line" },
  { no: "15", label: "後台管理", href: "/admin" },
];
