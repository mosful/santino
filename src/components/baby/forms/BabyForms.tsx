"use client";

import { useState } from "react";
import Tabs from "@/components/ui/Tabs";
import PhrasePicker from "@/components/phrases/PhrasePicker";
import SignatureBox from "@/components/ui/SignatureBox";

function PrevFillBadge() {
  return (
    <div className="mb-2 inline-block rounded bg-sky-50 px-2 py-1 text-xs text-sky-600">
      ↺ 已帶入上一筆資料（阿長PDF指定套用範圍）
    </div>
  );
}

function PickableTextArea({ label, placeholder }: { label: string; placeholder?: string }) {
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
        placeholder={placeholder}
      />
    </div>
  );
}

export function BabyAdmission({ room }: { room: string }) {
  return (
    <div>
      <div className="mb-3 text-xs text-stone-400">房號 {room}｜寶寶入住評估</div>
      <Tabs
        tabs={[
          {
            key: "basic",
            label: "基本資料",
            content: <PickableTextArea label="基本資料" placeholder="出生資訊、Apgar分數等" />,
          },
          {
            key: "physical",
            label: "身體評估",
            content: <PickableTextArea label="身體評估" placeholder="身體評估項目" />,
          },
          {
            key: "nursing",
            label: "護理紀錄",
            content: <PickableTextArea label="護理紀錄" placeholder="入住當下護理紀錄" />,
          },
        ]}
      />
      <div className="mt-4 flex justify-end gap-2 text-xs">
        <button className="rounded bg-stone-100 px-3 py-1.5">暫存</button>
        <button className="rounded bg-sky-500 px-3 py-1.5 text-white">送出</button>
      </div>
    </div>
  );
}

export function BabyRecord({ room }: { room: string }) {
  const [text, setText] = useState("（帶入上一筆）體溫36.8℃／呼吸平順／膚色紅潤");
  return (
    <div className="space-y-2 text-sm">
      <PrevFillBadge />
      <div className="flex items-center justify-between">
        <div className="text-xs text-stone-400">房號 {room}｜寶寶護理紀錄</div>
        <PhrasePicker onInsert={(t) => setText((prev) => (prev ? prev + "\n" + t : t))} />
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="h-24 w-full rounded-lg border border-stone-200 p-2 text-sm"
      />
      <div className="flex justify-end gap-2 text-xs">
        <button className="rounded bg-stone-100 px-3 py-1.5">暫存</button>
        <button className="rounded bg-sky-500 px-3 py-1.5 text-white">送出</button>
      </div>
    </div>
  );
}

export function BabyDaily({ room }: { room: string }) {
  return (
    <div className="space-y-3 text-sm">
      <PrevFillBadge />
      <div className="text-xs text-stone-400">房號 {room}｜每日照護</div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="體溫" />
        <Field label="體重" />
        <Field label="排便次數" />
        <Field label="排尿次數" />
      </div>
      <div className="flex justify-end gap-2 text-xs">
        <button className="rounded bg-stone-100 px-3 py-1.5">暫存</button>
        <button className="rounded bg-sky-500 px-3 py-1.5 text-white">送出</button>
      </div>
    </div>
  );
}

export function FeedingAssessment({ room }: { room: string }) {
  const [result, setResult] = useState<"pass" | "recheck">("pass");
  return (
    <div className="space-y-3 text-sm">
      <div className="text-xs text-stone-400">房號 {room}｜哺餵母乳評估</div>
      <div>
        <label className="mb-1 block text-xs text-stone-500">評估結果</label>
        <select
          value={result}
          onChange={(e) => setResult(e.target.value as "pass" | "recheck")}
          className="rounded border border-stone-200 px-2 py-1.5 text-sm"
        >
          <option value="pass">通過</option>
          <option value="recheck">再評估</option>
        </select>
      </div>
      <textarea className="h-16 w-full rounded border border-stone-200 p-2 text-sm" placeholder="評估項目內容" />
      {result === "recheck" && (
        <div className="rounded border border-rose-200 bg-rose-50 p-3">
          <div className="mb-1 text-xs font-medium text-rose-600">
            ⚠ 判定「再評估」，需串連填寫媽媽護理記錄（2.1.4.3），不需另外點選其他頁面：
          </div>
          <textarea className="h-16 w-full rounded border border-rose-200 p-2 text-sm" placeholder="媽媽護理記錄（同畫面串連）" />
        </div>
      )}
      <div className="flex justify-end gap-2 text-xs">
        <button className="rounded bg-stone-100 px-3 py-1.5">暫存</button>
        <button className="rounded bg-sky-500 px-3 py-1.5 text-white">送出</button>
      </div>
    </div>
  );
}

export function GrowthDiary({ room }: { room: string }) {
  return (
    <div className="space-y-3 text-sm">
      <div className="text-xs text-stone-400">房號 {room}｜成長日記</div>
      <div className="flex h-32 items-center justify-center rounded border border-dashed border-stone-300 text-xs text-stone-400">
        體重/身長趨勢折線圖（示意，無真實資料）
      </div>
    </div>
  );
}

export function BabyPhoto({ room }: { room: string }) {
  return (
    <div className="space-y-3 text-sm">
      <div className="text-xs text-stone-400">房號 {room}｜寶寶身體照片</div>
      <div className="grid grid-cols-3 gap-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex h-20 items-center justify-center rounded border border-dashed border-stone-300 text-xs text-stone-400">
            照片{i}
          </div>
        ))}
      </div>
      <button className="rounded bg-stone-100 px-3 py-1.5 text-xs">＋ 上傳照片</button>
    </div>
  );
}

export function BabyIO({ room }: { room: string }) {
  return (
    <div className="space-y-3 text-sm">
      <PrevFillBadge />
      <div className="text-xs text-stone-400">房號 {room}｜I/O</div>
      <div className="rounded bg-sky-50 p-2 text-xs text-sky-600">
        📷 可掃QR code直接對應case並自動帶入當下時間；keyin完成後自動reflash為實際時間
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="攝入量(In)" />
        <Field label="排出量(Out)" />
        <Field label="時間" placeholder="自動reflash" />
      </div>
      <div className="flex justify-end gap-2 text-xs">
        <button className="rounded bg-stone-100 px-3 py-1.5">暫存</button>
        <button className="rounded bg-sky-500 px-3 py-1.5 text-white">送出</button>
      </div>
    </div>
  );
}

export function BabyGuidance({ room }: { room: string }) {
  return (
    <div className="space-y-3 text-sm">
      <PrevFillBadge />
      <div className="rounded border border-sky-200 bg-sky-50 p-2 text-xs text-sky-700">
        ⚠ 防呆提示：目前正在簽的是房號 {room} 的寶寶個案，請確認無誤。
      </div>
      <PickableTextArea label="衛教指導內容" placeholder="衛教指導內容" />
      <SignatureBox label="執行者簽名" />
      <div className="flex justify-end gap-2 text-xs">
        <button className="rounded bg-stone-100 px-3 py-1.5">暫存</button>
        <button className="rounded bg-sky-500 px-3 py-1.5 text-white">送出</button>
      </div>
    </div>
  );
}

function Field({ label, placeholder }: { label: string; placeholder?: string }) {
  return (
    <div>
      <label className="mb-1 block text-xs text-stone-500">{label}</label>
      <input placeholder={placeholder} className="w-full rounded border border-stone-200 px-2 py-1.5 text-sm" />
    </div>
  );
}
