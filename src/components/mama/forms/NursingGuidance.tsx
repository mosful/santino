const ITEMS = [
  "子宮復原說明",
  "按摩式下床指導",
  "會陰/腹部傷口照護",
  "預防產後感染",
  "產後運動指導",
  "母乳哺育技巧",
  "產後憂鬱徵兆說明",
  "營養飲食指導",
  "回診時間提醒",
];

function SignatureBox({ label }: { label: string }) {
  return (
    <div className="rounded border border-stone-200 p-2">
      <div className="mb-1 text-xs text-stone-500">{label}</div>
      <div className="flex h-16 items-center justify-center rounded bg-stone-50 text-xs text-stone-300">
        簽名板（canvas，示意）
      </div>
      <input className="mt-1 w-full rounded border border-stone-200 px-2 py-1 text-xs" placeholder="日期" />
    </div>
  );
}

export default function NursingGuidance({ room }: { room: string }) {
  return (
    <div className="space-y-3 text-sm">
      <div className="rounded border border-rose-200 bg-rose-50 p-2 text-xs text-rose-700">
        ⚠ 防呆提示：目前正在簽的是房號 {room} 的個案，請確認無誤後再進行簽名（與QR進房防呆同一套邏輯）。
      </div>
      <div>
        <div className="mb-1 text-xs text-stone-500">衛教指導內容（至少9項）</div>
        <div className="grid grid-cols-2 gap-1">
          {ITEMS.map((it) => (
            <label key={it} className="flex items-center gap-2 rounded border border-stone-100 px-2 py-1.5 text-xs">
              <input type="checkbox" /> {it}
            </label>
          ))}
        </div>
      </div>
      <div>
        <div className="mb-1 text-xs text-stone-500">指導方式（可複選）</div>
        <div className="flex flex-wrap gap-3 text-xs">
          {["口述", "實際操作", "住院手冊", "其他"].map((m) => (
            <label key={m} className="flex items-center gap-1">
              <input type="checkbox" /> {m}
            </label>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <SignatureBox label="執行者簽名" />
        <SignatureBox label="評估者簽名（可待評估完成後補簽）" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs text-stone-500">結果評值</label>
          <select className="w-full rounded border border-stone-200 px-2 py-1.5 text-sm">
            <option>完全了解</option>
            <option>部分了解，需複核</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-stone-500">複核日期</label>
          <input className="w-full rounded border border-stone-200 px-2 py-1.5 text-sm" placeholder="待複核" />
        </div>
      </div>
      <div className="flex justify-end gap-2 text-xs">
        <button className="rounded bg-stone-100 px-3 py-1.5">暫存</button>
        <button className="rounded bg-rose-500 px-3 py-1.5 text-white">送出</button>
      </div>
    </div>
  );
}
