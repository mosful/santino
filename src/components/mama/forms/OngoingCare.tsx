"use client";

import { useState } from "react";
import Tabs from "@/components/ui/Tabs";
import PhrasePicker from "@/components/phrases/PhrasePicker";

const HISTORY = [
  { date: "2026-08-27 09:10", author: "護理師-雅婷", note: "生命徵象穩定，惡露量正常" },
  { date: "2026-08-26 21:40", author: "護理師-小玲", note: "疼痛評估：傷口＋乳房脹痛（複選）" },
];

function NarrativeTab() {
  const [text, setText] = useState("");
  return (
    <div className="space-y-2">
      <div className="flex justify-end">
        <PhrasePicker onInsert={(t) => setText((prev) => (prev ? prev + "\n" + t : t))} />
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="h-24 w-full rounded-lg border border-stone-200 p-2 text-sm"
        placeholder="敘述性護理紀錄（可從上方插入常用片語，或直接手動輸入）"
      />
    </div>
  );
}

export default function OngoingCare({ room }: { room: string }) {
  return (
    <div>
      <div className="mb-3 text-xs text-stone-400">
        房號 {room}｜「持續護理」與「媽媽護理紀錄」共用同一頁面（mama_record）
      </div>
      <Tabs
        tabs={[
          {
            key: "continuous",
            label: "持續性護理",
            content: (
              <div className="space-y-3 text-sm">
                <div>
                  <label className="mb-1 block text-xs text-stone-500">
                    疼痛評估（可複選，分數可自訂）
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {["傷口疼痛", "乳房脹痛", "子宮收縮痛", "其他"].map((t) => (
                      <label key={t} className="flex items-center gap-1 rounded-lg border border-stone-200 px-2 py-1.5 text-xs">
                        <input type="checkbox" /> {t}
                      </label>
                    ))}
                    <input
                      className="w-20 rounded-lg border border-stone-200 px-2 py-1.5 text-xs"
                      placeholder="分數"
                    />
                  </div>
                </div>
                <textarea className="h-20 w-full rounded-lg border border-stone-200 p-2 text-sm" placeholder="（暫存草稿）" />
              </div>
            ),
          },
          {
            key: "narrative",
            label: "敘述性護理",
            content: <NarrativeTab />,
          },
          {
            key: "history",
            label: "歷次護理紀錄",
            content: (
              <ul className="space-y-2 text-sm">
                {HISTORY.map((h, i) => (
                  <li key={i} className="rounded-lg border border-stone-100 p-2">
                    <div className="text-xs text-stone-400">
                      {h.date}｜{h.author}
                    </div>
                    <div>{h.note}</div>
                  </li>
                ))}
              </ul>
            ),
          },
        ]}
      />
      <p className="mt-2 text-xs text-stone-400">
        可事後增加/修改；資料可暫存。退房後補登：修改紀錄需歸屬實際登入員工，不可用共用帳號代填。
      </p>
    </div>
  );
}
