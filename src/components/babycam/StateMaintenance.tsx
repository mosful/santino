"use client";

import { useEffect, useRef, useState } from "react";
import { Toast, useToast } from "@/components/ui/Toast";
import Button from "@/components/ui/Button";
import { buttonStyles } from "@/components/ui/buttonStyles";
import { BASE_PATH } from "@/lib/basePath";
import { babycamActions } from "@/lib/babycam/actions";
import { readCarePhoto, saveCarePhoto } from "@/lib/care/media";
import type { DemoDomain, DisplayState } from "@/lib/domain/types";

/*
  04 後臺管理 ─ 狀態維護（名稱＋背景圖），清單式，可新增／修改／刪除（客戶 2026-11-14）。

  ⚠️ 名稱與背景圖是**同一件事的兩面**，不要再拆回兩個分頁：護理站改了「游泳」的
  叫法，下一步就是想看家屬會看到哪一張圖。每列左側縮圖就是該狀態的背景。

  ⚠️ **是否遮蔽不開放調整**：遮蔽與否是整套 fail-safe 的核心，把「護理」改成不遮蔽
  就等於讓家屬看到不該看的畫面。只有「正常顯示」不遮蔽，其餘（含新增的）一律遮蔽。
*/

/** 取狀態背景的可顯示網址：院方上傳的（IndexedDB）優先，否則用內建的靜態圖。 */
export function useStateBackground(state?: DisplayState): string {
  const [uploaded, setUploaded] = useState("");
  useEffect(() => {
    let active = true;
    if (!state?.image) {
      // 延到微任務再清，避開 react-hooks/set-state-in-effect 的連鎖渲染警告。
      void Promise.resolve().then(() => {
        if (active) setUploaded("");
      });
      return () => {
        active = false;
      };
    }
    let url = "";
    void readCarePhoto(state.image)
      .then((blob) => {
        if (blob && active) {
          url = URL.createObjectURL(blob);
          setUploaded(url);
        }
      })
      .catch(() => undefined);
    return () => {
      active = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [state?.image]);
  return uploaded || (state?.defaultImage ? `${BASE_PATH}${state.defaultImage}` : "");
}

const textInput = "h-10 w-full rounded-lg border border-border-subtle bg-surface-raised px-3 text-sm text-stone-800";

function StateRow({ state, index }: { state: DisplayState; index: number }) {
  const background = useStateBackground(state);
  const [toast, toastProps] = useToast();
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [name, setName] = useState(state.name);
  const fail = (error: unknown, fallback: string) => toast.fail(error instanceof Error ? error.message : fallback);

  function save() {
    const next = name.trim();
    if (!next) return toast.fail("狀態名稱不可空白。");
    try {
      // 只傳名稱：actions.display 收到第三個參數時會改要求 05（背景圖）權限，但改名本身屬 04。
      if (next !== state.name) babycamActions.display(state.key, next);
      setEditing(false);
      toast.ok(`已儲存「${next}」，寶寶與監視器的狀態下拉會跟著換。`);
    } catch (error) {
      fail(error, "儲存失敗。");
    }
  }

  return (
    <li className="flex flex-wrap items-center gap-3 px-3 py-3 sm:flex-nowrap sm:px-4">
      <span className="w-8 shrink-0 text-center text-sm font-bold tabular-nums text-stone-500">{String(index).padStart(2, "0")}</span>
      <div
        role="img"
        aria-label={`${state.name} 背景預覽`}
        className="h-14 w-24 shrink-0 rounded-lg border border-border-subtle bg-stone-200"
        style={background ? { backgroundImage: `url(${background})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
      />
      <div className="min-w-0 flex-1 basis-28 space-y-1">
        {editing ? (
          <input
            aria-label={`${state.name} 狀態名稱`}
            value={name}
            maxLength={20}
            autoFocus
            className={`${textInput} font-semibold`}
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") save();
              if (event.key === "Escape") { setName(state.name); setEditing(false); }
            }}
          />
        ) : (
          <strong className="block break-words text-base text-stone-800">{state.name}</strong>
        )}
        <span className="block text-xs text-stone-500">{state.masked ? "遮蔽影像，家屬端顯示此背景" : "正常顯示影像（不遮蔽）"}</span>
      </div>
      <div className="flex w-full flex-wrap justify-end gap-2 sm:w-auto sm:shrink-0">
        {editing ? (
          <>
            <Button size="sm" variant="primary" onClick={save}>儲存</Button>
            <Button size="sm" onClick={() => { setName(state.name); setEditing(false); }}>取消</Button>
          </>
        ) : removing ? (
          <>
            <span className="self-center text-sm text-rose-700">確定刪除「{state.name}」？</span>
            <Button size="sm" variant="danger" onClick={() => { try { babycamActions.removeDisplay(state.key); } catch (error) { setRemoving(false); fail(error, "刪除失敗。"); } }}>確定刪除</Button>
            <Button size="sm" onClick={() => setRemoving(false)}>取消</Button>
          </>
        ) : (
          <>
            <Button size="sm" aria-label={`修改${state.name}`} onClick={() => { setName(state.name); setEditing(true); }}>修改</Button>
            <label className={buttonStyles({ size: "sm", className: "cursor-pointer " + (busy ? "pointer-events-none opacity-60" : "") })}>
              {busy ? "處理中…" : "更換底圖"}
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                aria-label={`上傳${state.name}背景圖`}
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  event.target.value = "";
                  if (!file) return;
                  setBusy(true);
                  try {
                    const id = await saveCarePhoto(file);
                    babycamActions.display(state.key, state.name, id);
                    toast.ok("已更新背景，僅存在這台瀏覽器，未對外上傳。");
                  } catch (error) {
                    fail(error, "圖片儲存失敗。");
                  } finally {
                    setBusy(false);
                  }
                }}
              />
            </label>
            {state.image && (
              <Button size="sm" variant="subtle" onClick={() => { try { babycamActions.display(state.key, state.name, ""); toast.ok("已改回內建底圖。"); } catch (error) { fail(error, "清除失敗。"); } }}>改回內建</Button>
            )}
            {/* 正常顯示是遮蔽機制的基準，不可刪除 */}
            {state.key !== "normal" && <Button size="sm" className="!text-rose-700 hover:!border-rose-300 hover:!bg-rose-50" aria-label={`刪除${state.name}`} onClick={() => setRemoving(true)}>刪除</Button>}
          </>
        )}
      </div>
      <Toast {...toastProps} />
    </li>
  );
}

function AddState({ count }: { count: number }) {
  const [name, setName] = useState("");
  const [toast, toastProps] = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  function add() {
    const next = name.trim();
    if (!next) return toast.fail("請填寫狀態名稱。");
    try {
      // 新增的自訂狀態一律遮蔽，排在清單最後。
      babycamActions.displayMaster("", next, true, count);
      setName("");
      toast.ok(`已新增「${next}」，可在清單中更換底圖。`);
      inputRef.current?.focus();
    } catch (error) {
      toast.fail(error instanceof Error ? error.message : "新增失敗。");
    }
  }
  return (
    <div className="flex flex-wrap items-end gap-2">
      <label className="min-w-0 flex-1 basis-56 space-y-1 text-sm font-semibold text-stone-700">
        新增狀態
        <input ref={inputRef} aria-label="新增狀態名稱" value={name} maxLength={20} placeholder="例如：照光、量體重" className={`${textInput} font-normal`} onChange={(event) => setName(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") add(); }} />
      </label>
      <Button variant="primary" onClick={add}>＋ 新增</Button>
      <Toast {...toastProps} />
    </div>
  );
}

export default function StateMaintenance({ data }: { data: DemoDomain }) {
  return (
    <section className="space-y-4" aria-label="狀態維護">
      <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
        ⚠️ <strong>是否遮蔽畫面不開放調整</strong>：那是遮蔽機制的根本，改錯就會讓家屬看到不該看的畫面。
        只有「正常顯示」不遮蔽、也不可刪除，其餘狀態（含新增的）一律遮蔽；寶寶正在使用的狀態須先切換才能刪除。
      </p>
      <AddState count={data.displayStates.length} />
      <ul aria-label="顯示狀態清單" className="divide-y divide-border-subtle rounded-xl border border-border-subtle bg-surface-raised">
        {data.displayStates.map((state, index) => (
          <StateRow key={state.key} state={state} index={index} />
        ))}
      </ul>
    </section>
  );
}
