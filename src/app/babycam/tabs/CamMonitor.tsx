"use client";

import { Cctv, Link2, AlertTriangle, Users } from "lucide-react";
import StatCard from "@/components/ui/StatCard";
import QueryList, { type Column } from "@/components/ui/QueryList";
import Badge from "@/components/ui/Badge";
import PlaceholderNotice from "@/components/ui/PlaceholderNotice";
import {
  CAMERAS,
  CAM_SUMMARY,
  BINDINGS,
  STATUS_BY_KEY,
  type Camera,
} from "@/lib/mock/babycam";

/** 監視器 → 綁定房號的反查表 */
const ROOM_OF_CAM = new Map<string, { room: string; statusKey: string }>();
for (const b of BINDINGS) {
  for (const id of b.camIds) ROOM_OF_CAM.set(id, { room: b.room, statusKey: b.statusKey });
}

type Row = Camera & { id: string };
const ROWS: Row[] = CAMERAS.map((c) => ({ ...c, id: c.id }));

const COLUMNS: Column<Row>[] = [
  { key: "code", label: "監視器編號" },
  {
    key: "room",
    label: "綁定房號",
    render: (r) => ROOM_OF_CAM.get(r.id)?.room ?? <span className="text-stone-300">未綁定</span>,
  },
  { key: "codec", label: "編碼" },
  {
    key: "lastShotAt",
    label: "最後截圖時間",
    render: (r) => (
      <span className={"font-mono text-xs " + (r.abnormal ? "font-semibold text-rose-600" : "")}>
        {r.lastShotAt}
      </span>
    ),
  },
  {
    key: "lastSyncAt",
    label: "最後同步時間",
    render: (r) => (
      <span className={"font-mono text-xs " + (r.abnormal ? "font-semibold text-rose-600" : "")}>
        {r.lastSyncAt}
      </span>
    ),
  },
  {
    key: "state",
    label: "狀態",
    render: (r) => {
      if (r.abnormal) return <Badge color="rose">截圖逾時</Badge>;
      const bound = ROOM_OF_CAM.get(r.id);
      if (!bound) return <Badge color="slate">未綁定</Badge>;
      const s = STATUS_BY_KEY[bound.statusKey];
      return <Badge color={s?.masked ? "amber" : "green"}>{s?.label ?? "正常"}</Badge>;
    },
  },
];

export default function CamMonitor() {
  return (
    <div className="space-y-4">
      <PlaceholderNotice text="本期不做發信通知，異常一律在此面板以紅字呈現，由櫃台人員自行查看。逾時未更新的監視器，親友端會自動改顯示最後一張可用截圖。" />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon={Cctv}
          label="監視器總數"
          value={CAM_SUMMARY.total}
          gradient="from-sky-400 to-sky-600"
        />
        <StatCard
          icon={Link2}
          label="已綁定"
          value={CAM_SUMMARY.bound}
          gradient="from-emerald-400 to-emerald-600"
        />
        <StatCard
          icon={Users}
          label="雙胞胎房（多支）"
          value={CAM_SUMMARY.twins}
          gradient="from-purple-400 to-purple-600"
        />
        <StatCard
          icon={AlertTriangle}
          label="截圖逾時"
          value={CAM_SUMMARY.abnormal}
          gradient="from-rose-400 to-rose-600"
        />
      </div>

      {CAM_SUMMARY.abnormal > 0 && (
        <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-medium">
              有 {CAM_SUMMARY.abnormal} 支監視器截圖逾時未更新
            </p>
            <p className="mt-0.5 text-xs">
              {CAMERAS.filter((c) => c.abnormal)
                .map((c) => `${c.code}（${ROOM_OF_CAM.get(c.id)?.room ?? "未綁定"}）`)
                .join("、")}
              　請通知資訊人員檢查抓圖服務與攝影機連線。
            </p>
          </div>
        </div>
      )}

      <QueryList columns={COLUMNS} rows={ROWS} searchPlaceholder="搜尋監視器編號、房號或編碼" />
    </div>
  );
}
