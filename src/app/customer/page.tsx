"use client";

import { useState } from "react";
import Link from "next/link";
import { Download } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import RequireAccess from "@/components/ui/RequireAccess";
import { useAccess } from "@/lib/roleStore";
import QueryList, { type Column } from "@/components/ui/QueryList";
import Modal from "@/components/ui/Modal";
import Tabs from "@/components/ui/Tabs";
import { type Customer } from "@/lib/mock/customer";
import { useCustomerRows } from "@/lib/domain/legacySelectors";
import { HOSPITALS } from "@/lib/domain/options";
import { DEMO_MOTHER_NAME, DEMO_PHONE } from "@/lib/demo/demoDefaults";
import { caseActions, domainStore } from "@/lib/demo/domainStore";
import DemoActionButton from "@/components/ui/DemoActionButton";
import { buttonStyles } from "@/components/ui/buttonStyles";
import { Toast, useToast } from "@/components/ui/Toast";
import CollapsibleSection from "@/components/ui/CollapsibleSection";
import { downloadFile, toBrowserXlsx } from "@/lib/babycam/exports";

const columns: Column<Customer>[] = [
  { key: "name", label: "媽媽姓名" },
  { key: "level", label: "等級/胎次", render: (r) => `${r.level} / ${r.parity}` },
  { key: "phone", label: "手機/電話" },
  { key: "birthday", label: "生日/預產期", render: (r) => `${r.birthday} / ${r.dueDate}` },
  { key: "contractNo", label: "合約/簽約日期", render: (r) => r.contractNo ? `${r.contractNo} / ${r.signDate}` : "尚未簽約" },
  { key: "referrer", label: "介紹人" },
  { key: "mainStaff", label: "主要客服" },
  { key: "mainNurse", label: "主要護理師" },
  { key: "family", label: "關聯家屬人" },
];

/*
  匯出 Excel 的欄位（客戶 2026-10-30）。

  ⚠️ LINE ID 與 LINE 綁定三處畫面欄位（明細、查詢條件、匯出）依客戶 2026-10-30 要求移除。
  資料層的 lineBound 刻意保留——LINE 官方帳號管理（模組 14）的會員綁定還要用它，
  現在拿掉之後那邊要重建一次。要在客戶資料開回來就把這三處加回去。

  畫面上把「等級/胎次」「生日/預產期」「合約/簽約日期」併成一欄比較省橫向空間，
  但匯出要給人篩選與樞紐，所以一欄一值拆開。
*/
const EXPORT_COLUMNS: { label: string; value: (row: Customer) => string }[] = [
  { label: "媽媽姓名", value: (row) => row.name },
  { label: "客戶等級", value: (row) => row.level },
  { label: "胎次", value: (row) => row.parity },
  { label: "手機／電話", value: (row) => row.phone },
  { label: "生日", value: (row) => row.birthday },
  { label: "預產期", value: (row) => row.dueDate },
  { label: "收字號", value: (row) => row.contractNo ?? "" },
  { label: "簽約日", value: (row) => row.signDate ?? "" },
  { label: "參觀日", value: (row) => row.visitDate ?? "" },
  { label: "介紹人", value: (row) => row.referrer },
  { label: "主要客服", value: (row) => row.mainStaff },
  { label: "主要護理師", value: (row) => row.mainNurse },
  { label: "關聯家屬", value: (row) => row.family },
];

/** 查詢條件的空白值；「全部」用空字串表示，比對時直接跳過。 */
const filterInput = "min-h-11 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm";

/** 查詢條件的空白值；「全部」用空字串或「全部」表示，比對時直接跳過。 */
const BLANK_FILTERS = { level: "", staff: "", nurse: "", contract: "全部", dueFrom: "", dueTo: "" };

/**
 * 右上角三顆空白表單列印鈕先隱藏（客戶 2026-10-22）。程式保留，要開回改成 true。
 */
const SHOW_BLANK_PRINTS = false;

function blankCustomer(id: number): Customer {
  return {
    id,
    name: DEMO_MOTHER_NAME,
    level: "一般客戶",
    parity: "第一胎",
    phone: DEMO_PHONE,
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
            </div>
          ),
        },
        {
          key: "medical",
          label: "生產與醫療資訊",
          content: (
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Field label="預計生產醫院" value={HOSPITALS[0]} />
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
                    <Link href="/contract" className="ml-2 text-rose-500 underline">
                      查看合約
                    </Link>
                  </div>
                ) : (
                  <DemoActionButton feedback="已建立待簽約資料，請至「12. 合約管理」接續處理" variant="primary" size="sm">
                    轉入簽約資料 → 12.合約管理
                  </DemoActionButton>
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

  const customers = useCustomerRows();
  const [toast, toastProps] = useToast();
  const [filters, setFilters] = useState(BLANK_FILTERS);

  /* 下拉選項直接從現有資料長出來，不另外維護一份清單：主責人員與護理師會隨案件變動，
     寫死的話新來的同事永遠不在選單裡。 */
  const optionsOf = (pick: (row: Customer) => string) => [...new Set(customers.map(pick).filter(Boolean))].sort();

  const matched = customers.filter((row) => {
    if (filters.level && row.level !== filters.level) return false;
    if (filters.staff && row.mainStaff !== filters.staff) return false;
    if (filters.nurse && row.mainNurse !== filters.nurse) return false;
    if (filters.contract === "已簽約" && !row.contractNo) return false;
    if (filters.contract === "尚未簽約" && row.contractNo) return false;
    // 沒有預產期的案件在設了區間時就不該出現，否則「篩 11 月」會混進一批空白。
    if (filters.dueFrom && (!row.dueDate || row.dueDate < filters.dueFrom)) return false;
    if (filters.dueTo && (!row.dueDate || row.dueDate > filters.dueTo)) return false;
    return true;
  });

  function exportExcel() {
    if (!matched.length) {
      toast.fail("目前條件沒有資料可以匯出。");
      return;
    }
    downloadFile(
      `客戶資料_${domainStore.get().demoAt.slice(0, 10)}.xlsx`,
      toBrowserXlsx(EXPORT_COLUMNS.map((column) => column.label), matched.map((row) => EXPORT_COLUMNS.map((column) => column.value(row)))),
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    toast.ok(`已匯出 ${matched.length} 筆客戶資料。`);
  }
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
    try {
      const id = isNew ? caseActions.create(draft.name, draft.phone) : customers.find((item) => item.id === draft.id)?.caseId;
      if (!id) throw new Error("找不到對應案件。");
      caseActions.update(id, { name: draft.name, phone: draft.phone, dueDate: draft.dueDate, owner: draft.mainStaff, customerDetails: { level: draft.level, parity: draft.parity, birthday: draft.birthday, referrer: draft.referrer, mainNurse: draft.mainNurse, lineBound: draft.lineBound, family: draft.family } });
      const record = domainStore.get().cases.find((item) => item.id === id)!;
      setSelected({ ...draft, id: record.legacyId }); setEditing(false); setIsNew(false); toast.ok("客戶資料已與案件、照護及視訊同步。");
    } catch (error) { toast.fail(error instanceof Error ? error.message : "儲存失敗。"); }
  }

  function remove() {
    if (!selected) return;
    try { const record = customers.find((item) => item.id === selected.id); if (!record) return; caseActions.removeDraft(record.caseId); setConfirmDelete(false); closeModal(); toast.ok("已移除尚未下訂的草稿。"); }
    catch (error) { toast.fail(error instanceof Error ? error.message : "移除失敗。"); setConfirmDelete(false); }
  }

  function closeModal() {
    setSelected(null);
    setEditing(false);
    setIsNew(false);
    setDraft(null);
    setConfirmDelete(false);
  }

  return (
    <div className="page-frame">
      <RequireAccess moduleNo="5">
      <PageHeader
        title="客戶資料"
        moduleNo="5"
        action={
          <div className="flex gap-2 text-xs">
            {SHOW_BLANK_PRINTS && (
              <>
                <DemoActionButton feedback="空白基本資料列印預覽已開啟" onClick={() => window.print()}>空白基本資料</DemoActionButton>
                <DemoActionButton feedback="空白預約參觀單列印預覽已開啟" onClick={() => window.print()}>空白預約參觀單</DemoActionButton>
                <DemoActionButton feedback="空白契約書列印預覽已開啟" onClick={() => window.print()}>空白契約書</DemoActionButton>
              </>
            )}
            {canEdit && (
              <button onClick={openAdd} className={buttonStyles({ variant: "primary", size: "sm" })}>
                ＋ 新增客戶
              </button>
            )}
          </div>
        }
      />
      {/*
        查詢條件（客戶 2026-10-30）。關鍵字搜尋留在下方 QueryList（它本來就有，且支援模糊比對），
        這裡放需要「選」的條件：等級、主責人員、合約狀態、預產期區間。
        條件是 AND，結果同時餵給清單與匯出——畫面看到什麼就匯出什麼。
      */}
      <CollapsibleSection id="customer-filters" title="查詢條件" summary={`符合 ${matched.length} / ${customers.length} 筆`} bodyClassName="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <label className="block space-y-1.5 text-sm">客戶等級
            <select aria-label="客戶等級" className={filterInput} value={filters.level} onChange={(event) => setFilters({ ...filters, level: event.target.value })}>
              <option value="">全部</option>
              {optionsOf((row) => row.level).map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label className="block space-y-1.5 text-sm">主要客服
            <select aria-label="主要客服" className={filterInput} value={filters.staff} onChange={(event) => setFilters({ ...filters, staff: event.target.value })}>
              <option value="">全部</option>
              {optionsOf((row) => row.mainStaff).map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label className="block space-y-1.5 text-sm">主要護理師
            <select aria-label="主要護理師" className={filterInput} value={filters.nurse} onChange={(event) => setFilters({ ...filters, nurse: event.target.value })}>
              <option value="">全部</option>
              {optionsOf((row) => row.mainNurse).map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label className="block space-y-1.5 text-sm">合約狀態
            <select aria-label="合約狀態" className={filterInput} value={filters.contract} onChange={(event) => setFilters({ ...filters, contract: event.target.value })}>
              {["全部", "已簽約", "尚未簽約"].map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="block space-y-1.5 text-sm">預產期起
              <input aria-label="預產期起" type="date" className={filterInput} value={filters.dueFrom} onChange={(event) => setFilters({ ...filters, dueFrom: event.target.value })} />
            </label>
            <label className="block space-y-1.5 text-sm">預產期迄
              <input aria-label="預產期迄" type="date" className={filterInput} value={filters.dueTo} onChange={(event) => setFilters({ ...filters, dueTo: event.target.value })} />
            </label>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className={buttonStyles({ size: "sm" })} onClick={() => setFilters(BLANK_FILTERS)}>清除條件</button>
          <button type="button" className={buttonStyles({ variant: "primary", size: "sm", className: "ml-auto" })} onClick={exportExcel}>
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            匯出 Excel（{matched.length} 筆）
          </button>
        </div>
      </CollapsibleSection>
      <QueryList columns={columns} rows={matched} onRowClick={openView} />
      <Toast {...toastProps} />
      <Modal
        open={!!selected}
        title={isNew ? "新增客戶" : `客戶基本資料 — ${selected?.name ?? ""}`}
        onClose={closeModal}
        wide
      >
        {selected && draft && (
          <div className="customer-detail space-y-5">
            {canEdit && (
              <div className="flex justify-end gap-2">
                {editing ? (
                  <>
                    <button onClick={cancelEdit} className={buttonStyles({ variant: "subtle", size: "sm" })}>
                      取消
                    </button>
                    <button onClick={save} className={buttonStyles({ variant: "primary", size: "sm" })}>
                      儲存
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={startEdit} className={buttonStyles({ variant: "subtle", size: "sm" })}>
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
          <button onClick={remove} className={buttonStyles({ variant: "danger", size: "sm" })}>
            確定刪除
          </button>
        </div>
      </Modal>
      </RequireAccess>
    </div>
  );
}
