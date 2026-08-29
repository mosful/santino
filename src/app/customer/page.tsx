"use client";

import { useState } from "react";
import PageHeader from "@/components/ui/PageHeader";
import RequireAccess from "@/components/ui/RequireAccess";
import { useAccess } from "@/lib/roleStore";
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

function blankCustomer(id: number): Customer {
  return {
    id,
    name: "",
    level: "一般客戶",
    parity: "第一胎",
    phone: "",
    birthday: "",
    dueDate: "",
    referrer: "",
    mainStaff: "",
    mainNurse: "－",
    lineBound: false,
    family: "－",
  };
}

function EditField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs text-stone-400">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-stone-200 px-2 py-1.5 text-sm"
      />
    </div>
  );
}

function DetailTabs({
  c,
  editing,
  draft,
  onDraftChange,
}: {
  c: Customer;
  editing: boolean;
  draft: Customer;
  onDraftChange: (patch: Partial<Customer>) => void;
}) {
  return (
    <Tabs
      tabs={[
        {
          key: "basic",
          label: "基本資料",
          content: editing ? (
            <div className="grid grid-cols-2 gap-3 text-sm">
              <EditField label="媽媽姓名" value={draft.name} onChange={(v) => onDraftChange({ name: v })} />
              <EditField label="等級" value={draft.level} onChange={(v) => onDraftChange({ level: v })} />
              <EditField label="胎次" value={draft.parity} onChange={(v) => onDraftChange({ parity: v })} />
              <EditField label="手機" value={draft.phone} onChange={(v) => onDraftChange({ phone: v })} />
              <EditField label="生日" value={draft.birthday} onChange={(v) => onDraftChange({ birthday: v })} />
              <EditField label="預產期" value={draft.dueDate} onChange={(v) => onDraftChange({ dueDate: v })} />
              <EditField label="關聯家屬人" value={draft.family} onChange={(v) => onDraftChange({ family: v })} />
            </div>
          ) : (
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
              <div className="col-span-2 rounded border border-stone-200 p-3">
                <div className="mb-1 text-xs text-stone-400">轉入簽約資料</div>
                {c.contractNo ? (
                  <div className="text-sm">
                    合約編號 <span className="font-medium">{c.contractNo}</span>
                    （簽約日期 {c.signDate}）
                    <a href="/contract" className="ml-2 text-rose-500 underline">
                      查看合約
                    </a>
                  </div>
                ) : (
                  <button className="rounded bg-stone-700 px-3 py-1.5 text-xs text-white">
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
      <div className="text-xs text-stone-400">{label}</div>
      <div>{value}</div>
    </div>
  );
}

export default function CustomerPage() {
  const access = useAccess("5");
  const canEdit = access === "edit";

  const [customers, setCustomers] = useState<Customer[]>(CUSTOMERS);
  const [selected, setSelected] = useState<Customer | null>(null);
  const [editing, setEditing] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [draft, setDraft] = useState<Customer | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  function openView(c: Customer) {
    setSelected(c);
    setEditing(false);
    setIsNew(false);
    setDraft(c);
  }

  function openAdd() {
    const blank = blankCustomer(Date.now());
    setSelected(blank);
    setDraft(blank);
    setEditing(true);
    setIsNew(true);
  }

  function startEdit() {
    if (!selected) return;
    setDraft(selected);
    setEditing(true);
  }

  function cancelEdit() {
    if (isNew) {
      closeModal();
      return;
    }
    setEditing(false);
    setDraft(selected);
  }

  function save() {
    if (!draft) return;
    if (isNew) {
      setCustomers((cs) => [...cs, draft]);
    } else {
      setCustomers((cs) => cs.map((c) => (c.id === draft.id ? draft : c)));
    }
    setSelected(draft);
    setEditing(false);
    setIsNew(false);
  }

  function remove() {
    if (!selected) return;
    setCustomers((cs) => cs.filter((c) => c.id !== selected.id));
    setConfirmDelete(false);
    closeModal();
  }

  function closeModal() {
    setSelected(null);
    setEditing(false);
    setIsNew(false);
    setDraft(null);
    setConfirmDelete(false);
  }

  return (
    <div className="w-full px-4 py-3 sm:px-6 sm:py-4">
      <RequireAccess moduleNo="5">
      <PageHeader
        title="5. 客戶資料"
        moduleNo="5"
        action={
          <div className="flex gap-2 text-xs">
            <button className="rounded bg-stone-100 px-3 py-1.5">空白基本資料</button>
            <button className="rounded bg-stone-100 px-3 py-1.5">空白預約參觀單</button>
            <button className="rounded bg-stone-100 px-3 py-1.5">空白契約書</button>
            {canEdit && (
              <button onClick={openAdd} className="rounded bg-rose-500 px-3 py-1.5 font-medium text-white">
                ＋ 新增客戶
              </button>
            )}
          </div>
        }
      />
      <QueryList columns={columns} rows={customers} onRowClick={openView} />
      <Modal
        open={!!selected}
        title={isNew ? "新增客戶" : `客戶基本資料 — ${selected?.name ?? ""}`}
        onClose={closeModal}
        wide
      >
        {selected && draft && (
          <div className="space-y-3">
            {canEdit && (
              <div className="flex justify-end gap-2">
                {editing ? (
                  <>
                    <button onClick={cancelEdit} className="rounded-lg bg-stone-100 px-3 py-1.5 text-xs">
                      取消
                    </button>
                    <button onClick={save} className="rounded-lg bg-rose-500 px-3 py-1.5 text-xs text-white">
                      儲存
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={startEdit} className="rounded-lg bg-stone-100 px-3 py-1.5 text-xs">
                      編輯
                    </button>
                    <button
                      onClick={() => setConfirmDelete(true)}
                      className="rounded-lg bg-stone-100 px-3 py-1.5 text-xs text-stone-500"
                    >
                      刪除客戶
                    </button>
                  </>
                )}
              </div>
            )}
            <DetailTabs
              c={selected}
              editing={editing}
              draft={draft}
              onDraftChange={(patch) => setDraft((d) => (d ? { ...d, ...patch } : d))}
            />
          </div>
        )}
      </Modal>
      <Modal open={confirmDelete} title="確認刪除" onClose={() => setConfirmDelete(false)}>
        <p className="text-sm text-stone-600">確定要刪除「{selected?.name}」的客戶資料嗎？此動作無法復原。</p>
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={() => setConfirmDelete(false)} className="rounded-lg bg-stone-100 px-4 py-2 text-xs">
            取消
          </button>
          <button onClick={remove} className="rounded-lg bg-rose-600 px-4 py-2 text-xs text-white">
            確定刪除
          </button>
        </div>
      </Modal>
      </RequireAccess>
    </div>
  );
}
