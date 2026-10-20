"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import { BASE_PATH } from "@/lib/basePath";
import { babycamActions } from "@/lib/babycam/actions";
import { readCarePhoto, saveCarePhoto } from "@/lib/care/media";
import type { DemoDomain, DisplayState } from "@/lib/domain/types";

/*
  04 後臺管理 ─ 狀態維護（名稱＋背景圖）。

  ⚠️ 名稱與背景圖是**同一件事的兩面**，不要再拆回兩個分頁：護理站改了「游泳」的
  叫法，下一步就是想看家屬會看到哪一張圖；拆成兩頁等於逼人在兩邊來回，而且兩邊
  列的是同一份清單。這裡沿用 BabyCam `admin/StatePanel.tsx` 的做法——背景圖當卡片
  底圖，名稱直接在卡片上編輯，下面就是換圖。

  ⚠️ **是否遮蔽不開放調整**：遮蔽與否是整套 fail-safe 的核心，把「護理」改成不遮蔽
  就等於讓家屬看到不該看的畫面。只有「正常顯示」不遮蔽，其餘一律遮蔽。
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

function StateCard({ state }: { state: DisplayState }) {
  const background = useStateBackground(state);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <article
      className="relative flex min-h-[200px] flex-col justify-end overflow-hidden rounded-2xl border border-border-subtle bg-stone-800"
      style={background ? { backgroundImage: `url(${background})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
    >
      {/* 由上而下的暗化遮罩：底圖再亮，名稱與按鈕都讀得到 */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-black/40 to-black/80" aria-hidden="true" />

      <div className="relative space-y-2 p-3.5">
        <span className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold">
          <strong className="rounded-md bg-white/85 px-1.5 py-0.5 tabular-nums text-stone-800">
            {state.key === "normal" ? "00" : state.key.replace("state-", "").padStart(2, "0")}
          </strong>
          <em className="rounded-md bg-black/45 px-1.5 py-0.5 not-italic text-white/90">
            {state.masked ? "遮蔽影像時顯示" : "正常狀態備用背景"}
          </em>
        </span>

        <div className="flex flex-wrap gap-2">
          <input
            aria-label={`${state.name} 狀態名稱`}
            defaultValue={state.name}
            maxLength={20}
            className="h-10 min-w-0 flex-1 rounded-lg border border-white/25 bg-white/90 px-3 text-sm font-semibold text-stone-800"
            onBlur={(event) => {
              const next = event.target.value.trim();
              if (!next) {
                event.target.value = state.name;
                setMessage("狀態名稱不可空白。");
                return;
              }
              if (next === state.name) return;
              try {
                // 只傳名稱：actions.display 收到第三個參數時會改要求 05（背景圖）權限，
                // 但改名本身屬 04。
                babycamActions.display(state.key, next);
                setMessage(`名稱已改為「${next}」，寶寶與監視器的狀態下拉會跟著換。`);
              } catch (error) {
                setMessage(error instanceof Error ? error.message : "儲存失敗。");
              }
            }}
          />
          <label className={"btn btn-sm inline-flex h-9 cursor-pointer items-center justify-center rounded-lg border border-white/30 bg-white/90 px-3 text-xs font-medium text-stone-700 hover:bg-white " + (busy ? "pointer-events-none opacity-60" : "")}>
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
                  setMessage("已更新背景，僅存在這台瀏覽器，未對外上傳。");
                } catch (error) {
                  setMessage(error instanceof Error ? error.message : "圖片儲存失敗。");
                } finally {
                  setBusy(false);
                }
              }}
            />
          </label>
          {state.image && (
            <Button
              size="sm"
              variant="subtle"
              onClick={() => {
                try {
                  babycamActions.display(state.key, state.name, "");
                  setMessage("已改回內建底圖。");
                } catch (error) {
                  setMessage(error instanceof Error ? error.message : "清除失敗。");
                }
              }}
            >
              改回內建
            </Button>
          )}
        </div>

        {message && (
          <p role="status" className="rounded-lg bg-black/55 px-2.5 py-1.5 text-[11px] leading-5 text-white">
            {message}
          </p>
        )}
      </div>
    </article>
  );
}

export default function StateMaintenance({ data }: { data: DemoDomain }) {
  return (
    <section className="space-y-4" aria-label="狀態維護">
      <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
        ⚠️ <strong>是否遮蔽畫面不開放調整</strong>：那是遮蔽機制的根本，改錯就會讓家屬看到不該看的畫面。
        只有「正常顯示」不遮蔽，其餘狀態一律遮蔽。卡片底圖就是家屬與院內在該狀態下看到的畫面。
      </p>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {data.displayStates.map((state) => (
          <StateCard key={state.key} state={state} />
        ))}
      </div>
    </section>
  );
}
