"use client";

import { useRef, useState } from "react";
import { QrCode } from "lucide-react";
import Button from "@/components/ui/Button";
import { buttonStyles } from "@/components/ui/buttonStyles";
import { babycamActions } from "@/lib/babycam/actions";
import { findBabyByCode, readIdentityCode } from "@/lib/babycam/scan";
import type { DemoDomain } from "@/lib/domain/types";
import IdentityScanner from "./IdentityScanner";

/*
  02 寶寶登錄 ─ 離開掃碼。

  護理師把寶寶推離鏡頭前掃手圈，挑一個顯示狀態（護理、游泳、餵奶…），
  寶寶即轉為照護中、家屬端顯示該狀態的遮蔽畫面；回來時走「掃碼歸位核對」，
  通過後自動還原離開前的狀態。掃碼直接辨識寶寶，不必先選案件。
*/
export default function LeaveScan({ data, run }: { data: DemoDomain; run: (action: () => void, feedback?: string) => void }) {
  const [code, setCode] = useState("");
  const [state, setState] = useState("");
  const [scannerOpen, setScannerOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  let parsed = "";
  let parseError = "";
  if (code.trim()) {
    try { parsed = readIdentityCode(code); } catch (error) { parseError = error instanceof Error ? error.message : "識別碼格式不正確。"; }
  }
  const found = parsed ? findBabyByCode(data, parsed) : undefined;
  const babyName = found && data.subjects.find((subject) => subject.id === found.baby.babyId)?.name;
  const currentState = found && data.displayStates.find((item) => item.key === found.baby.state)?.name;
  // 示範用：相機不可用時，掃碼視窗按「確認」帶入第一位還在鏡頭前的寶寶。
  const demoCode = data.bindings.filter((binding) => !binding.ended).flatMap((binding) => binding.babies).find((baby) => !baby.careMode)?.identityCode ?? "";
  const leaveStates = data.displayStates.filter((item) => item.key !== "normal");

  return (
    <div className="@container space-y-6 p-4 sm:p-6">
      <div>
        <h2 className="text-lg font-bold text-stone-800">離開掃碼</h2>
        <p className="mt-1 text-sm leading-6 text-stone-600">寶寶離開鏡頭前掃描手圈，選擇家屬端要顯示的狀態；回來時到「掃碼歸位核對」掃碼，會自動還原原本的狀態。</p>
      </div>
      <div className="space-y-3">
        <label className="block space-y-2 text-sm font-semibold text-stone-700">
          掃碼結果／手動輸入識別碼
          <input ref={inputRef} aria-label="離開掃碼識別碼" className="min-h-12 w-full rounded-lg border border-border-subtle bg-surface-raised px-3 py-3 text-base" placeholder="掃描寶寶手圈後自動帶入，也可手動輸入" autoComplete="off" autoCapitalize="off" spellCheck={false} value={code} onChange={(event) => { setCode(event.target.value); setState(""); }} />
        </label>
        <div className="flex flex-wrap gap-3">
          <Button size="lg" onClick={() => setScannerOpen(true)}><QrCode className="h-5 w-5" aria-hidden="true" />掃描手圈</Button>
          {code && <Button size="lg" variant="subtle" onClick={() => { setCode(""); setState(""); }}>清除</Button>}
        </div>
        {(parseError || (parsed && !found)) && <p role="alert" className="text-sm text-rose-700">{parseError || "找不到這個識別碼，標籤可能已失效，請核對手圈。"}</p>}
      </div>

      {found && (
        <div className="space-y-5 border-t border-border-subtle pt-5">
          <dl className="grid gap-3 rounded-xl border border-brand-200 bg-brand-50 p-4 text-sm sm:grid-cols-4">
            <div><dt className="text-stone-500">房號／媽媽</dt><dd className="font-semibold text-stone-800">{found.binding.room || "托嬰"}｜{found.binding.motherName}</dd></div>
            <div><dt className="text-stone-500">寶寶</dt><dd className="font-semibold text-stone-800">{babyName || "寶寶"}{found.binding.babies.length > 1 && `（第 ${found.baby.birthOrder || 1} 胎）`}</dd></div>
            <div><dt className="text-stone-500">車號／監視器</dt><dd className="font-semibold text-stone-800">{found.baby.cartNo || "未設定"}｜{data.cameras.find((item) => item.id === found.baby.cameraId)?.code || "未指派"}</dd></div>
            <div><dt className="text-stone-500">目前狀態</dt><dd className="font-semibold text-stone-800">{currentState}{found.baby.careMode && "・照護中"}</dd></div>
          </dl>
          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold text-stone-700">離開時顯示的狀態</legend>
            <div className="flex flex-wrap gap-2">
              {leaveStates.map((item) => (
                <button key={item.key} type="button" aria-pressed={state === item.key} className={buttonStyles({ size: "lg", selected: state === item.key })} onClick={() => setState(item.key)}>{item.name}</button>
              ))}
            </div>
          </fieldset>
          <div className="sm:flex sm:justify-end">
            <Button size="lg" variant="primary" className="w-full sm:w-auto" disabled={!state} onClick={() => run(() => { babycamActions.leave(parsed, state); setCode(""); setState(""); requestAnimationFrame(() => inputRef.current?.focus()); }, `${babyName || "寶寶"}已離開鏡頭，家屬端顯示「${leaveStates.find((item) => item.key === state)?.name}」。`)}>確認離開</Button>
          </div>
        </div>
      )}

      {scannerOpen && <IdentityScanner demoIdentityCode={demoCode} onRead={(value) => { setCode(value); setState(""); setScannerOpen(false); }} onClose={() => { setScannerOpen(false); requestAnimationFrame(() => inputRef.current?.focus()); }} />}
    </div>
  );
}
