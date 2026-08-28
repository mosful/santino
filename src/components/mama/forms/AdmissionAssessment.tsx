import Tabs from "@/components/ui/Tabs";

function TextArea({ label }: { label: string }) {
  return (
    <div>
      <label className="mb-1 block text-xs text-slate-500">{label}</label>
      <textarea
        className="h-20 w-full rounded border border-slate-200 p-2 text-sm"
        placeholder="（暫存草稿內容，示意）"
      />
    </div>
  );
}

export default function AdmissionAssessment({ room }: { room: string }) {
  return (
    <div>
      <div className="mb-3 text-xs text-slate-400">房號 {room}｜入住評估（5分頁，每頁皆為完整表單）</div>
      <Tabs
        tabs={[
          { key: "history", label: "病史", content: <TextArea label="既往病史 / 過敏史" /> },
          { key: "physical", label: "身體評估", content: <TextArea label="身體評估項目" /> },
          { key: "family", label: "家庭評估", content: <TextArea label="家庭功能與支持系統評估" /> },
          { key: "nursing", label: "護理紀錄", content: <TextArea label="入住當下護理紀錄" /> },
          { key: "tocc", label: "TOCC", content: <TextArea label="旅遊史/職業/接觸史/群聚史" /> },
        ]}
      />
      <div className="mt-4 flex justify-end gap-2 text-xs">
        <button className="rounded bg-slate-100 px-3 py-1.5">暫存</button>
        <button className="rounded bg-rose-500 px-3 py-1.5 text-white">送出</button>
      </div>
    </div>
  );
}
