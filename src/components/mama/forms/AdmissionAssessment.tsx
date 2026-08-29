"use client";

import { useState } from "react";
import Tabs from "@/components/ui/Tabs";
import PhrasePicker from "@/components/phrases/PhrasePicker";

function TextArea({ label }: { label: string }) {
  const [text, setText] = useState("");
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <label className="block text-xs text-stone-500">{label}</label>
        <PhrasePicker onInsert={(t) => setText((prev) => (prev ? prev + "\n" + t : t))} />
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="h-20 w-full rounded-lg border border-stone-200 p-2 text-sm"
        placeholder="（暫存草稿內容，示意）"
      />
    </div>
  );
}

export default function AdmissionAssessment({ room }: { room: string }) {
  return (
    <div>
      <div className="mb-3 text-xs text-stone-400">房號 {room}｜入住評估（5分頁，每頁皆為完整表單）</div>
      <Tabs
        tabs={[
          { key: "nursing", label: "護理紀錄", content: <TextArea label="入住當下護理紀錄" /> },
          { key: "history", label: "病史", content: <TextArea label="既往病史 / 過敏史" /> },
          { key: "physical", label: "身體評估", content: <TextArea label="身體評估項目" /> },
          { key: "family", label: "家庭評估", content: <TextArea label="家庭功能與支持系統評估" /> },
          { key: "tocc", label: "TOCC", content: <TextArea label="旅遊史/職業/接觸史/群聚史" /> },
        ]}
      />
      <div className="mt-4 flex justify-end gap-2 text-xs">
        <button className="rounded-lg bg-stone-100 px-4 py-2 hover:bg-stone-200">暫存</button>
        <button className="rounded-lg bg-rose-500 px-4 py-2 text-white hover:bg-rose-600">送出</button>
      </div>
    </div>
  );
}
