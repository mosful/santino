function Field({ label, placeholder }: { label: string; placeholder?: string }) {
  return (
    <div>
      <label className="mb-1 block text-xs text-slate-500">{label}</label>
      <input placeholder={placeholder} className="w-full rounded border border-slate-200 px-2 py-1.5 text-sm" />
    </div>
  );
}

function SubmitBar() {
  return (
    <div className="flex justify-end gap-2 text-xs">
      <button className="rounded bg-slate-100 px-3 py-1.5">暫存</button>
      <button className="rounded bg-teal-600 px-3 py-1.5 text-white">確定</button>
    </div>
  );
}

export function Prep({ room }: { room: string }) {
  return (
    <div className="space-y-3 text-sm">
      <div className="text-xs text-slate-400">房號 {room}｜入住準備</div>
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
      <div className="text-xs text-slate-400">房號 {room}｜延長提前換房</div>
      <div className="rounded border border-slate-200 p-3">
        <div className="mb-2 text-xs font-medium text-slate-600">提前退住</div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="提前退住天數" placeholder="需與12.合約管理退約邏輯串接" />
        </div>
      </div>
      <div className="rounded border border-slate-200 p-3">
        <div className="mb-2 text-xs font-medium text-slate-600">延長住房</div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="延長住房天數" />
          <Field label="延住房型" />
          <Field label="延住房號" />
          <Field label="延住每日房價" placeholder="預設帶入牌價，可人工調整並記錄原因" />
        </div>
      </div>
      <div className="rounded border border-slate-200 p-3">
        <div className="mb-2 text-xs font-medium text-slate-600">換房</div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="換房目標房號" />
          <Field label="生效日" />
        </div>
        <p className="mt-2 text-xs text-slate-400">
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
      <div className="text-xs text-slate-400">房號 {room}｜媽媽外出</div>
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
      <div className="text-xs text-slate-400">房號 {room}｜媽媽客訴</div>
      <textarea className="h-20 w-full rounded border border-slate-200 p-2 text-sm" placeholder="客訴內容記錄" />
      <SubmitBar />
    </div>
  );
}

export function VisitorInfo({ room }: { room: string }) {
  return (
    <div className="space-y-3 text-sm">
      <div className="text-xs text-slate-400">房號 {room}｜訪客資料</div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="訪客姓名" />
        <Field label="到訪時段" />
      </div>
      <SubmitBar />
    </div>
  );
}

export function CompanionInfo({ room }: { room: string }) {
  return (
    <div className="space-y-3 text-sm">
      <div className="text-xs text-slate-400">房號 {room}｜陪宿者資料</div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="陪宿者姓名" />
        <Field label="與媽媽關係" />
      </div>
      <SubmitBar />
    </div>
  );
}

export function BabyVideoForm({ room }: { room: string }) {
  return (
    <div className="space-y-3 text-sm">
      <div className="text-xs text-slate-400">房號 {room}｜寶寶視訊單</div>
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
      <div className="text-xs text-slate-400">房號 {room}｜證件照片</div>
      <div className="flex h-24 w-40 items-center justify-center rounded border border-dashed border-slate-300 text-xs text-slate-400">
        上傳/檢視證件照片
      </div>
    </div>
  );
}
