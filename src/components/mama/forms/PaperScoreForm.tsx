export default function PaperScoreForm({
  room,
  title,
}: {
  room: string;
  title: string;
}) {
  return (
    <div className="space-y-3 text-sm">
      <p className="text-xs text-slate-400">
        {title}維持紙本填寫，填完後拍照由系統自動生成記錄（或直接上傳掃描照片），並可自行輸入評分。
      </p>
      <div className="grid grid-cols-2 gap-3">
        <Field label="房號" value={room} />
        <Field label="姓名" />
        <Field label="病歷號" />
        <Field label="分數" />
        <Field label="上傳人" />
        <Field label="上傳日期時間" placeholder="自動帶入當下時間" />
      </div>
      <div>
        <label className="mb-1 block text-xs text-slate-500">紙本照片上傳</label>
        <div className="flex h-24 w-40 items-center justify-center rounded border border-dashed border-slate-300 text-xs text-slate-400">
          拍照 / 上傳掃描檔
        </div>
      </div>
      <Field label="後續處理內容" area />
      <div className="flex justify-end gap-2 text-xs">
        <button className="rounded bg-slate-100 px-3 py-1.5">暫存</button>
        <button className="rounded bg-rose-500 px-3 py-1.5 text-white">送出</button>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  placeholder,
  area,
}: {
  label: string;
  value?: string;
  placeholder?: string;
  area?: boolean;
}) {
  return (
    <div className={area ? "col-span-2" : ""}>
      <label className="mb-1 block text-xs text-slate-500">{label}</label>
      {area ? (
        <textarea className="h-16 w-full rounded border border-slate-200 p-2 text-sm" placeholder={placeholder} />
      ) : (
        <input
          defaultValue={value}
          placeholder={placeholder}
          className="w-full rounded border border-slate-200 px-2 py-1.5 text-sm"
        />
      )}
    </div>
  );
}
