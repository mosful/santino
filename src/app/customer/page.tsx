"use client";

import { useState } from "react";
import QueryList, { type Column } from "@/components/ui/QueryList";
import Modal from "@/components/ui/Modal";
import Tabs from "@/components/ui/Tabs";
import Badge from "@/components/ui/Badge";
import { CUSTOMERS, type Customer } from "@/lib/mock/customer";

const columns: Column<Customer>[] = [
  { key: "name", label: "媽媽姓名" },
  { key: "level", label: "等級/胎次", render: (r) => `${r.level} / ${r.parity}` },
  { key: "phone", label: "手機/電話" },
  { key: "birthday", label: "生日/預產期", render: (r) => `${r.birthday} / ${r.dueDate}` },
  { key: "contractNo", label: "合約/簽約日期", render: (r) => r.contractNo ? `${r.contractNo} / ${r.signDate}` : "尚未簽約" },
  { key: "referrer", label: "介紹人" },
  { key: "mainStaff", label: "主要客服" },
  { key: "mainNurse", label: "主要護理師" },
  {
    key: "lineBound",
    label: "app使用權限",
    render: (r) => <Badge color={r.lineBound ? "green" : "slate"}>{r.lineBound ? "已綁定" : "未綁定"}</Badge>,
  },
  { key: "family", label: "關聯家屬人" },
];

function DetailTabs({ c }: { c: Customer }) {
  return (
    <Tabs
      tabs={[
        {
          key: "basic",
          label: "基本資料",
          content: (
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Field label="媽媽姓名" value={c.name} />
              <Field label="等級" value={c.level} />
              <Field label="胎次" value={c.parity} />
              <Field label="手機" value={c.phone} />
              <Field label="生日" value={c.birthday} />
              <Field label="身分證號" value="（欄位範例，未填）" />
              <Field label="通訊地址" value="（欄位範例，未填）" />
              <Field label="LINE ID" value="（供14.會員綁定比對）" />
              <div className="col-span-2">
                <button className="rounded bg-rose-500 px-3 py-1.5 text-xs text-white">
                  綁定WebApp登入帳號
                </button>
              </div>
            </div>
          ),
        },
        {
          key: "medical",
          label: "生產與醫療資訊",
          content: (
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Field label="預計生產醫院" value="景星婦幼醫院" />
              <Field label="主治醫師" value="陳O如醫師" />
              <Field label="預計生產方式" value="自然產" />
              <Field label="醫院端病歷號" value="H2026081234" />
              <Field label="預產期" value={c.dueDate} />
            </div>
          ),
        },
        {
          key: "service",
          label: "客服與照護資訊",
          content: (
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Field label="主要客服" value={c.mainStaff} />
              <Field label="主要護理師" value={c.mainNurse} />
              <Field label="預約參觀日期" value={c.visitDate ?? "－"} />
              <Field label="來源管道" value={c.referrer} />
              <div className="col-span-2 rounded border border-slate-200 p-3">
                <div className="mb-1 text-xs text-slate-400">轉入簽約資料</div>
                {c.contractNo ? (
                  <div className="text-sm">
                    合約編號 <span className="font-medium">{c.contractNo}</span>
                    （簽約日期 {c.signDate}）
                    <a href="/contract" className="ml-2 text-rose-500 underline">
                      查看合約
                    </a>
                  </div>
                ) : (
                  <button className="rounded bg-slate-700 px-3 py-1.5 text-xs text-white">
                    轉入簽約資料 → 12.合約管理
                  </button>
                )}
              </div>
            </div>
          ),
        },
        {
          key: "other",
          label: "個人資料/其他",
          content: <Field label="關聯家屬人" value={c.family} />,
        },
      ]}
    />
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-slate-400">{label}</div>
      <div>{value}</div>
    </div>
  );
}

export default function CustomerPage() {
  const [selected, setSelected] = useState<Customer | null>(null);
  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-bold">5. 客戶資料</h1>
        <div className="flex gap-2 text-xs">
          <button className="rounded bg-slate-100 px-3 py-1.5">空白基本資料</button>
          <button className="rounded bg-slate-100 px-3 py-1.5">空白預約參觀單</button>
          <button className="rounded bg-slate-100 px-3 py-1.5">空白契約書</button>
        </div>
      </div>
      <QueryList columns={columns} rows={CUSTOMERS} onRowClick={setSelected} />
      <Modal
        open={!!selected}
        title={`客戶基本資料 — ${selected?.name ?? ""}`}
        onClose={() => setSelected(null)}
        wide
      >
        {selected && <DetailTabs c={selected} />}
      </Modal>
    </div>
  );
}
