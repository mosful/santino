import { DEMO_BABY_NAME, DEMO_MOTHER_NAME, DEMO_PHONE } from "@/lib/demo/demoDefaults";
import PrototypeFormActions from "@/components/ui/PrototypeFormActions";

/** 欄位名稱帶「姓名」「電話」就先填 DEMO 預設值（客戶 2026-10-22：展示時不要每次重打）。 */
function demoValue(label: string) {
  if (label.includes("電話") || label.includes("手機")) return DEMO_PHONE;
  if (label.includes("寶寶") || label.includes("嬰兒")) return DEMO_BABY_NAME;
  if (label.includes("媽媽") || label.includes("產婦")) return DEMO_MOTHER_NAME;
  return undefined;
}

function Field({ label, placeholder }: { label: string; placeholder?: string }) {
  return (
    <div>
      <label className="mb-1 block text-xs text-stone-500">{label}</label>
      <input aria-label={label} defaultValue={demoValue(label)} placeholder={placeholder} className="w-full rounded border border-stone-200 px-2 py-1.5 text-sm" />
    </div>
  );
}

function SubmitBar() {
  return <PrototypeFormActions accent="teal" submitLabel="確定" />;
}

export function Prep({ room }: { room: string }) {
  return (
    <div className="space-y-3 text-sm">
      <div className="text-xs text-stone-400">房號 {room}｜入住準備</div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="預計入住日期" />
        <Field label="房間整備狀態" placeholder="待整備/已完成" />
      </div>
      <SubmitBar />
    </div>
  );
}

export function ExtendChangeRoom({ room }: { room: string }) {
  return (
    <div className="space-y-4 text-sm">
      <div className="text-xs text-stone-400">房號 {room}｜延長提前換房</div>
      <div className="rounded border border-stone-200 p-3">
        <div className="mb-2 text-xs font-medium text-stone-600">提前退住</div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="提前退住天數" placeholder="需與12.合約管理退約邏輯串接" />
        </div>
      </div>
      <div className="rounded border border-stone-200 p-3">
        <div className="mb-2 text-xs font-medium text-stone-600">延長住房</div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="延長住房天數" />
          <Field label="延住房型" />
          <Field label="延住房號" />
          <Field label="延住每日房價" placeholder="預設帶入牌價，可人工調整並記錄原因" />
        </div>
      </div>
      <div className="rounded border border-stone-200 p-3">
        <div className="mb-2 text-xs font-medium text-stone-600">換房</div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="換房目標房號" />
          <Field label="生效日" />
        </div>
        <p className="mt-2 text-xs text-stone-400">
          確定換房後系統需同步更新2.媽媽照護與本模組雙邊房卡顯示。
        </p>
      </div>
      <SubmitBar />
    </div>
  );
}

export function MotherOuting({ room }: { room: string }) {
  return (
    <div className="space-y-3 text-sm">
      <div className="text-xs text-stone-400">房號 {room}｜媽媽外出</div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="外出時間" />
        <Field label="預計返回時間" />
        <Field label="外出事由" />
      </div>
      <SubmitBar />
    </div>
  );
}

export function Complaint({ room }: { room: string }) {
  return (
    <div className="space-y-3 text-sm">
      <div className="text-xs text-stone-400">房號 {room}｜媽媽客訴</div>
      <textarea className="h-20 w-full rounded border border-stone-200 p-2 text-sm" placeholder="客訴內容記錄" />
      <SubmitBar />
    </div>
  );
}

export function VisitorInfo({ room }: { room: string }) {
  return (
    <div className="space-y-3 text-sm">
      <div className="text-xs text-stone-400">房號 {room}｜訪客資料</div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="訪客姓名" />
        <Field label="訪客電話" />
        <Field label="到訪時段" />
      </div>
      <SubmitBar />
    </div>
  );
}

export function CompanionInfo({ room }: { room: string }) {
  return (
    <div className="space-y-3 text-sm">
      <div className="text-xs text-stone-400">房號 {room}｜陪宿者資料</div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="陪宿者姓名" />
        <Field label="陪宿者電話" />
        <Field label="與媽媽關係" />
      </div>
      <SubmitBar />
    </div>
  );
}

export function BabyVideoForm({ room }: { room: string }) {
  return (
    <div className="space-y-3 text-sm">
      <div className="text-xs text-stone-400">房號 {room}｜寶寶視訊單</div>
      <div className="rounded border border-amber-200 bg-amber-50 p-2 text-xs text-amber-700">
        ⚠ 前置驗證：需先勾選「護理班組」才能列印，否則提示「您尚未勾選護理班組，無法列印」。
      </div>
      <label className="flex items-center gap-2 text-xs">
        <input type="checkbox" /> 已勾選護理班組
      </label>
      <SubmitBar />
    </div>
  );
}

export function IdPhoto({ room }: { room: string }) {
  return (
    <div className="space-y-3 text-sm">
      <div className="text-xs text-stone-400">房號 {room}｜證件照片</div>
      <div className="flex h-24 w-40 items-center justify-center rounded border border-dashed border-stone-300 text-xs text-stone-400">
        上傳/檢視證件照片
      </div>
      <SubmitBar />
    </div>
  );
}

/**
 * 清潔記錄（手冊第 30 頁「房務清潔工作月記錄表」）。
 *
 * 客戶在第 29 頁標註「清潔要有記錄」。原表是一個月 31 欄 × 22 個點檢項目的紙本，
 * 這裡改成「一次一天、逐項打勾」，月份彙整留給報表——護理站當下只會填今天這一次。
 */
const CLEAN_ITEMS = [
  "收垃圾",
  "桌子、椅子",
  "床單、被套",
  "床組櫃、衣櫃",
  "RO 水盒、洗手台",
  "電話",
  "水箱設備",
  "地板",
  "視聽音響設備",
  "浴廁地板、洗手台",
  "淋浴間",
  "浴廁垃圾桶",
  "浴廁通風口",
  "浴廁天花板、牆壁",
  "窗簾、隔簾、窗戶",
  "空調出風口",
  "壁掛（掛物）",
  "天花板",
];

export function CleaningLog({ room }: { room: string }) {
  return (
    <div className="space-y-3 text-sm">
      <div className="text-xs text-stone-400">房號 {room}｜清潔記錄（每 3 天清潔 1 次，退房另做漂白水擦拭）</div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="清潔日期" />
        <Field label="清潔人員" />
      </div>
      <fieldset className="rounded border border-stone-200 p-3">
        <legend className="px-1 text-xs font-medium text-stone-600">清潔項目</legend>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {CLEAN_ITEMS.map((item) => (
            <label key={item} className="flex min-h-10 items-center gap-2 text-sm">
              <input type="checkbox" />
              {item}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="grid grid-cols-2 gap-3">
        <Field label="退房清潔（1000PPM 漂白水 100cc 加 5000cc 擦拭）" placeholder="已完成／不適用" />
        <Field label="主管簽章" />
      </div>
      <SubmitBar />
    </div>
  );
}
