"use client";

import { useState } from "react";
import { Toast, useToast } from "@/components/ui/Toast";
import Button from "@/components/ui/Button";
import { babycamActions } from "@/lib/babycam/actions";
import { deriveDemoLight } from "@/lib/babycam/viewing";
import { ringLightsInZone, UNMAPPED_CAMERA_CODES, type RelayZone } from "@/lib/babycam/ring-light-map";
import { CHANNEL_CSS, MIX_DISPLAY_ORDER, mixChannels, mixCss, mixLabel, mixOf } from "@/lib/babycam/lightMix";
import { cameraHost, DEFAULT_NETWORK_PREFIX, relayHost } from "@/lib/babycam/network";
import { activeDisinfection, describeDisinfection } from "@/lib/babycam/disinfection";
import type { DemoDomain } from "@/lib/domain/types";

/*
  環狀燈號（06）／繼電器板（07）／燈號狀態（08）三個畫面。

  刻意對齊 BabyCam：
  - 燈色用**實際顏色**＋光暈畫出來（`lightMix.ts` 的色碼抄自 BabyCam 的 MIX_CSS），
    不是只印「白」「洋紅」這種文字——現場是照著燈的顏色對照的，字沒有用。
  - 燈號看板依 A／B 區分段，每台一張卡：色點、編號、狀態、對應房號與寶寶、佈線通道。
  - 繼電器板沿用 BabyCam 的深色維運風（`.relay-console`），與米白色的管理介面明顯區隔，
    視覺上就在提醒「這一頁不一樣」；R／G／B 三顆通道鈕亮起時用各自的實際顏色。
  - 燈號狀態是「院方定義的燈號語意」，三個畫面都讀同一份（data.lightColors／lightLabels）。

  ⚠️ 本專案是靜態原型：繼電器只寫進瀏覽器記憶體，不會連線任何實體板子。
*/

const ZONES: RelayZone[] = ["A", "B"];

/** 內建的五種情境（程式自己判定出來的），可以改名稱與燈色，但不能刪。 */
const BUILTIN_STATES: { key: string; fallback: string; note: string }[] = [
  { key: "empty", fallback: "無寶寶", note: "空床或尚未指派監視器。" },
  { key: "care", fallback: "寶寶照護中（離開監視器）", note: "與空床同色，但意義完全不同。" },
  { key: "idle", fallback: "有寶寶，沒人看", note: "寶寶在位，目前無人觀看。" },
  { key: "internal", fallback: "有寶寶，內部有人看", note: "院內（媽媽端）正在觀看。" },
  { key: "family", fallback: "有寶寶，外部有人看", note: "親友正在看截圖畫面。" },
];

/** 實際燈色的小圓點；看板、繼電器板與狀態設定共用同一顆，顏色才不會各說各話。 */
export function LightDot({ mix, size = 26 }: { mix: string; size?: number }) {
  const css = mixCss(mix);
  return (
    <span
      aria-hidden="true"
      className="inline-block shrink-0 rounded-full border border-black/30"
      style={{ width: size, height: size, background: css.color, boxShadow: css.glow }}
    />
  );
}

/* ───────────────────────── 06 環狀燈號看板 ───────────────────────── */

export function RingLightBoard({ data }: { data: DemoDomain }) {
  const unmapped = UNMAPPED_CAMERA_CODES.filter((code) => data.cameras.some((camera) => camera.code === code));
  const prefix = data.networkPrefix || DEFAULT_NETWORK_PREFIX;

  return (
    <div className="space-y-5">
      {/* 圖例：院方定義的五種語意各是什麼顏色 */}
      <div className="flex flex-wrap gap-4 rounded-xl border border-border-subtle bg-surface-muted/60 px-4 py-3">
        {BUILTIN_STATES.map((state) => {
          const mix = data.lightColors[state.key] ?? "熄滅";
          return (
            <span key={state.key} className="flex items-center gap-2 text-sm font-semibold text-stone-700">
              <LightDot mix={mix} size={15} />
              {data.lightLabels[state.key] ?? state.fallback}
              <small className="font-normal text-stone-500">{mixLabel(mix)}</small>
            </span>
          );
        })}
      </div>

      {ZONES.map((zone) => {
        const lights = ringLightsInZone(zone).filter((light) => data.cameras.some((camera) => camera.code === light.cameraCode));
        if (!lights.length) return null;
        return (
          <section key={zone} aria-label={`${zone} 區環狀燈`}>
            <h3 className="mb-2.5 flex items-baseline gap-2.5 text-sm font-bold text-stone-800">
              {zone} 區
              <small className="text-xs font-normal text-stone-500">{lights.length} 台 × 3 通道</small>
            </h3>
            <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
              {lights.map((light) => {
                const camera = data.cameras.find((item) => item.code === light.cameraCode)!;
                const state = deriveDemoLight(data, camera);
                const mix = data.lightColors[state] ?? "熄滅";
                const binding = data.bindings.find(
                  (item) => !item.ended && item.babies.some((baby) => baby.cameraId === camera.id),
                );
                const baby = binding?.babies.find((item) => item.cameraId === camera.id);
                const babyName = data.subjects.find((subject) => subject.id === baby?.babyId)?.name;
                const host = cameraHost(prefix, light.cameraCode);
                return (
                  <article
                    key={light.cameraCode}
                    className={
                      "grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-2.5 gap-y-0.5 rounded-xl border p-3 " +
                      (camera.enabled
                        ? camera.health === "異常"
                          ? "border-amber-300 bg-amber-50/60"
                          : "border-border-subtle bg-surface-raised"
                        : "border-dashed border-border-subtle bg-surface-muted opacity-60")
                    }
                    title={light.channels.map((channel) => `Y${channel.yNumber}`).join("／")}
                  >
                    <span className="row-span-3 self-start pt-0.5">
                      <LightDot mix={camera.enabled ? mix : "熄滅"} />
                    </span>
                    <strong className="text-[0.95rem] tracking-wide text-stone-800">{light.cameraCode}</strong>
                    <span className="text-xs text-stone-600">
                      {camera.enabled ? data.lightLabels[state] ?? state : "已停用"}
                      <small className="ml-1.5 text-[0.68rem] text-stone-500">{mixLabel(camera.enabled ? mix : "熄滅")}</small>
                    </span>
                    <b className="text-[0.72rem] font-bold text-brand-700">
                      {binding ? `${binding.room || "托嬰"}　${babyName ?? ""}`.trim() : "—"}
                    </b>
                    <em className="col-start-2 font-mono text-[0.66rem] not-italic text-stone-500" translate="no">
                      {host ?? "位址未設定"}　{light.channels.map((channel) => `Y${channel.yNumber}`).join("／")}
                    </em>
                    {camera.enabled && camera.health === "異常" && (
                      <u className="col-start-2 text-[0.68rem] text-amber-800 no-underline">⚠️ 抓圖異常，燈亮不代表畫面正常</u>
                    )}
                  </article>
                );
              })}
            </div>
          </section>
        );
      })}

      <p className="text-xs text-stone-500">
        位址由網段前綴 <code className="rounded bg-surface-muted px-1 py-0.5 font-mono" translate="no">{prefix}</code> ＋ 各機末碼組成；
        末碼對照取自 BabyCam 的監視器主檔。網段可於「後臺管理 → 展示控制台」調整。
      </p>

      {unmapped.length > 0 && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-7 text-amber-900">
          ⚠️ <strong>{unmapped.join("、")}</strong> 在兩張現場佈線表上都查無對應通道，無環狀燈可控，排程時安靜略過。
          可能接在尚未發現的第三片板子、或根本沒有安裝，需現場確認。
        </p>
      )}
    </div>
  );
}

/* ───────────────────────── 07 繼電器板 ───────────────────────── */

export function RelayBoard({ data, onToggle }: { data: DemoDomain; onToggle: (channel: string, next: boolean) => void }) {
  const [zone, setZone] = useState<RelayZone>("A");
  const [unlocked, setUnlocked] = useState(false);
  /*
    ⚠️ 固定走清單排版，不要加回「卡片／清單」切換。
    一塊板 33 支機器 × 3 通道，卡片版要捲很久，現場對照佈線本來就是看清單；
    客戶（老闆）另有「同樣的資料不需要太多種呈現方式」的要求，2026-10-21 移除切換。
  */
  const prefix = data.networkPrefix || DEFAULT_NETWORK_PREFIX;
  const lights = ringLightsInZone(zone).filter((light) => data.cameras.some((camera) => camera.code === light.cameraCode));
  /*
    消毒期間監視器與燈具一併斷電（客戶 2026-10-29）。全院排程進行中時整塊板切離，
    通道一律顯示熄滅且不可點；只涵蓋部分房間的排程改用橫幅說明是哪幾間——
    通道是按分區佈線、不是按房號，逐支標示只會讓板子變得難讀。
  */
  const houseWide = activeDisinfection(data, "");
  const running = (data.disinfections ?? []).filter((item) => activeDisinfection(data, item.rooms[0] ?? "")?.id === item.id);

  function channelKey(zoneId: RelayZone, yNumber: number) {
    return `${zoneId}-Y${yNumber}`;
  }

  return (
    // 深色維運風：與米白色的院務介面明顯區隔，一眼就知道「這頁不一樣」。
    <div className="rounded-2xl border border-[#2b3542] bg-[#11151c] p-4 text-[#e6edf3] sm:p-5">
      <header className="flex flex-wrap items-center gap-3 border-b border-[#2b3542] pb-4">
        <h3 className="mr-auto text-sm font-bold">🔌 繼電器板操作介面（本機模擬）</h3>

        <span
          className={
            "inline-flex items-center gap-2 rounded-lg border px-2.5 py-1 text-xs " +
            (unlocked ? "border-[#e5534b] bg-[#2b1416] text-[#ff8a80]" : "border-[#d29922] bg-[#2a1f12] text-[#d29922]")
          }
          title="解鎖後點擊通道會改變燈色。正式環境內有產婦與新生兒，請確認操作對象後再動作。"
        >
          <span aria-hidden="true">{unlocked ? "⚠️" : "🔒"}</span>
          <strong>{unlocked ? "可寫入" : "唯讀"}</strong>
          <button
            type="button"
            onClick={() => setUnlocked(!unlocked)}
            className={
              "rounded-md border px-2.5 py-1 text-xs font-bold " +
              (unlocked ? "border-[#e5534b] bg-[#e5534b] text-white" : "border-[#2b3542] bg-[#222b36] text-[#e6edf3]")
            }
          >
            {unlocked ? "鎖定" : "解鎖"}
          </button>
        </span>

        <div role="group" aria-label="繼電器板分區" className="inline-flex gap-1 rounded-lg border border-[#2b3542] bg-[#161d27] p-1">
          {ZONES.map((item) => (
            <button
              key={item}
              type="button"
              aria-pressed={zone === item}
              onClick={() => setZone(item)}
              className={
                // ⚠️ 全域已把 button 設成 inline-flex，兩行文字不寫 flex-col 會並排擠在一起。
                "flex flex-col items-center rounded-md px-3.5 py-1 text-center text-xs leading-tight " +
                (zone === item ? "bg-[#2f6feb] font-bold text-white" : "text-[#8b98a8] hover:text-[#e6edf3]")
              }
            >
              <b className="block text-[13.5px] font-semibold">{item} 區板</b>
              <span className="block font-mono text-[10px] opacity-75" translate="no">{relayHost(prefix, item)}</span>
            </button>
          ))}
        </div>
      </header>

      <p className="mt-4 rounded-lg border border-[#2b3542] bg-[#1a212b] px-3.5 py-2.5 text-xs leading-6 text-[#8b98a8]">
        🧪 <strong className="text-[#e6edf3]">模擬模式</strong>：所有操作只寫進瀏覽器記憶體，
        <strong className="text-[#e6edf3]">不會送到實體繼電器板</strong>，院內燈光完全不受影響。
        {!unlocked && " 目前為唯讀，可檢視佈線與通道狀態；要操作請先按「解鎖」。"}
      </p>

      {running.length > 0 && <p role="status" className="mt-3 rounded-lg border border-[#d29922] bg-[#2a1f12] px-3.5 py-2.5 text-xs leading-6 text-[#f0c674]">
        🧼 消毒進行中，監視器與環狀燈{houseWide ? "全數切離" : "於下列範圍切離"}：
        {running.map((item) => `${item.label}（${describeDisinfection(item)}）`).join("；")}
      </p>}

      <section className="mt-4 rounded-xl border border-[#2b3542] bg-[#1a212b] p-4">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h4 className="flex items-baseline gap-2.5 text-xs font-semibold tracking-wide text-[#8b98a8]">
            寶寶監視器環狀燈
            <small className="font-normal">
              {zone} 區板　{lights.length} 台 × 3 通道 = {lights.length * 3}
            </small>
          </h4>
        </div>
        <div className="grid gap-1.5">
          {lights.map((light) => {
            const on = (color: "red" | "green" | "blue") => {
              if (houseWide) return false;
              const channel = light.channels.find((item) => item.color === color);
              return channel ? !!data.relayChannels[channelKey(light.zone, channel.yNumber)] : false;
            };
            const mix = mixOf(on("red"), on("green"), on("blue"));
            const semantic = BUILTIN_STATES.find((state) => (data.lightColors[state.key] ?? "熄滅") === mix);
            return (
              <article
                key={light.cameraCode}
                className={
                  "rounded-xl border border-[#2b3542] bg-[#141b24] p-3 " +
                  "flex flex-wrap items-center gap-x-3 gap-y-2"
                }
              >
                <div className={"flex items-center gap-2.5 " + "min-w-0 flex-1"}>
                  <LightDot mix={mix} size={22} />
                  <strong className="text-base font-bold tracking-wide">{light.cameraCode}</strong>
                  <b className="font-mono text-[11px] font-normal text-[#8b98a8]" translate="no">{cameraHost(prefix, light.cameraCode) ?? "位址未設定"}</b>
                  <span className="ml-auto truncate text-[11.5px] text-[#8b98a8]">
                    <span style={{ color: mix === "熄滅" ? undefined : mixCss(mix).color }}>{mixLabel(mix)}</span>
                    <em className="ml-1 not-italic">
                      · {semantic ? data.lightLabels[semantic.key] ?? semantic.fallback : "⚠️ 未定義狀態"}
                    </em>
                  </span>
                </div>
                <div className={"flex gap-1.5 " + "w-full sm:w-[300px]"}>
                  {light.channels.map((channel) => {
                    const key = channelKey(light.zone, channel.yNumber);
                    const active = !houseWide && !!data.relayChannels[key];
                    const css = CHANNEL_CSS[channel.color];
                    return (
                      <button
                        key={key}
                        type="button"
                        disabled={!unlocked || Boolean(houseWide)}
                        aria-pressed={active}
                        aria-label={`${light.cameraCode} ${css.label} 通道 Y${channel.yNumber}`}
                        title={`Y${channel.yNumber}／暫存器 ${channel.register}`}
                        onClick={() => onToggle(key, !active)}
                        className="flex flex-1 flex-col items-center justify-center rounded-md border py-2 text-xs font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-40"
                        style={
                          active
                            ? { borderColor: css.border, background: css.on, color: "#fff", boxShadow: css.glow }
                            : { borderColor: "#2b3542", background: "#222b36", color: "#8b98a8" }
                        }
                      >
                        {css.label}
                        <small className="block text-[10px] font-normal opacity-80">Y{channel.yNumber}</small>
                      </button>
                    );
                  })}
                </div>
              </article>
            );
          })}
          {!lights.length && <p className="col-span-full py-6 text-center text-sm text-[#8b98a8]">此區沒有已佈線的監視器。</p>}
        </div>
      </section>
    </div>
  );
}

/* ───────────────────────── 08 燈號狀態 ───────────────────────── */

export function LightStatePanel({ data }: { data: DemoDomain }) {
  const [name, setName] = useState("");
  const [color, setColor] = useState("白");
  const [toast, toastProps] = useToast();

  function run(action: () => void, feedback = "已更新燈號狀態；看板與繼電器板讀同一份設定，會同步變色。") {
    try {
      action();
      toast.ok(feedback);
    } catch (error) {
      toast.fail(error instanceof Error ? error.message : "儲存失敗。");
    }
  }

  const custom = Object.keys(data.lightColors).filter((key) => !BUILTIN_STATES.some((state) => state.key === key));

  return (
    <section className="space-y-4">
      <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
        ⚠️ 五個<strong>內建狀態</strong>是系統自己判定出來的情境（有沒有寶寶、誰在看），可以改名稱與燈色，但不能刪。
        <strong>自訂狀態</strong>只是把院方的燈號語意登記下來供現場點測與對照，<strong>不會自動亮起</strong>。
      </p>

      <ul className="space-y-2">
        {[...BUILTIN_STATES.map((state) => state.key), ...custom].map((key) => {
          const builtin = BUILTIN_STATES.find((state) => state.key === key);
          const mix = data.lightColors[key] ?? "熄滅";
          return (
            <li key={key} className="flex flex-wrap items-center gap-3 rounded-xl border border-border-subtle bg-surface-raised p-3">
              <LightDot mix={mix} />
              <input
                aria-label={`${key} 狀態名稱`}
                className="h-10 min-w-0 flex-1 rounded-lg border border-border-subtle bg-surface-raised px-3 text-sm sm:max-w-xs"
                defaultValue={data.lightLabels[key] ?? builtin?.fallback ?? key}
                onBlur={(event) => {
                  if (event.target.value !== (data.lightLabels[key] ?? builtin?.fallback)) {
                    run(() => babycamActions.lightColor(key, mix, event.target.value));
                  }
                }}
              />
              <select
                aria-label={`${key} 燈色`}
                className="h-10 rounded-lg border border-border-subtle bg-surface-raised px-3 text-sm"
                value={mix}
                onChange={(event) => run(() => babycamActions.lightColor(key, event.target.value))}
              >
                {MIX_DISPLAY_ORDER.map((item) => (
                  <option key={item} value={item}>
                    {mixLabel(item)}
                  </option>
                ))}
              </select>
              {builtin ? (
                <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-semibold text-stone-600">內建</span>
              ) : (
                <Button size="sm" variant="danger" onClick={() => run(() => babycamActions.removeLight(key), "已刪除自訂燈號狀態。")}>
                  刪除
                </Button>
              )}
              {builtin && <small className="w-full text-xs text-stone-500">{builtin.note}</small>}
            </li>
          );
        })}
      </ul>

      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-border-subtle bg-surface-muted/60 p-3">
        <label className="space-y-1 text-sm">
          新增狀態名稱
          <input
            aria-label="新增燈號狀態名稱"
            placeholder="例如：清潔中…"
            className="block h-10 rounded-lg border border-border-subtle bg-surface-raised px-3 text-sm"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </label>
        <label className="space-y-1 text-sm">
          燈色
          <select
            aria-label="新增燈色"
            className="block h-10 rounded-lg border border-border-subtle bg-surface-raised px-3 text-sm"
            value={color}
            onChange={(event) => setColor(event.target.value)}
          >
            {MIX_DISPLAY_ORDER.map((item) => (
              <option key={item} value={item}>
                {mixLabel(item)}
              </option>
            ))}
          </select>
        </label>
        <Button
          variant="primary"
          onClick={() =>
            run(() => {
              if (!name.trim()) throw new Error("請填自訂狀態名稱。");
              babycamActions.lightColor(`custom-${crypto.randomUUID()}`, color, name.trim());
              setName("");
            }, "已新增自訂燈號狀態；供現場點測與對照，不會自動亮起。")
          }
        >
          新增自訂燈號
        </Button>
        <p className="w-full text-xs text-stone-500">
          混色為加色混合：{mixChannels("黃")} ＝黃、{mixChannels("洋紅")} ＝洋紅、{mixChannels("青")} ＝青、
          {mixChannels("白")} ＝白。
        </p>
      </div>

      <Toast {...toastProps} />
    </section>
  );
}
