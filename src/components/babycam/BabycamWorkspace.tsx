"use client";

/* 影像皆為本機 Canvas 或 QR 資料，不經 Next.js 圖片服務。 */
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { ExternalLink, Printer, QrCode } from "lucide-react";
import { BASE_PATH } from "@/lib/basePath";
import Button, { ButtonLink } from "@/components/ui/Button";
import { useDomainStore } from "@/lib/demo/domainStore";
import { useCurrentRole } from "@/lib/roleStore";
import HeaderSlot from "@/components/layout/HeaderSlot";
import { headerTabClass } from "@/components/ui/Tabs";
import { canUseCaseFlow, ROLES, type Role } from "@/lib/permissions";
import { babycamActions, canBabycamSection } from "@/lib/babycam/actions";
import { effectiveViewingWindow } from "@/lib/babycam/viewing";
import { downloadFile, toBrowserXlsx } from "@/lib/babycam/exports";
import { loadPrintFont, printWristbands, renderWristband } from "@/lib/babycam/wristband-print";
import { printFamilyNotice } from "@/lib/babycam/familyNotice";
import { taipeiTimestamp } from "@/lib/care/rules";
import { cameraHost, DEFAULT_NETWORK_PREFIX } from "@/lib/babycam/network";
import type { WindowRule } from "@/lib/domain/types";
import CamPreview from "./CamPreview";
import BindingEditor from "./BindingEditor";
import DisinfectionSchedule from "./DisinfectionSchedule";
import MaintenanceConsole from "./MaintenanceConsole";
import DemoReset from "./DemoReset";
import { cameraTimeRows } from "@/lib/babycam/cameraTime";
import { PrintSettingsEditor, CameraMetadata } from "./BabycamMasterPanels";
import StateMaintenance from "./StateMaintenance";
import { LightStatePanel, RelayBoard, RingLightBoard } from "./RingLightPanels";
import { RoomListPanel, SchedulePanel } from "./RoomSchedulePanels";
import {
  AsideEmpty,
  AsideHeading,
  CameraChipGrid,
  Panel,
  SectionHeading,
  SplitWorkspace,
  ZoneFilter,
} from "./BabycamUi";
import { StatusSummary } from "@/components/ui/Workspace";

/*
  寶寶視訊管理工作區。

  資訊架構刻意對齊 BabyCam 專案（C:\\Code\\BabyCam）的管理端 `/admin`：四個功能群組
  01 入住登記／02 寶寶登錄／04 後臺管理／08 系統設定，群組底下是底線式頁籤。
  同一批院內人員要在兩套系統間切換，版面與用字不一致就是訓練成本。

  ⚠️ 要改群組或頁籤，先比對 BabyCam 的 `src/components/admin/shared.ts` 的 `adminNav`；
  兩邊的群組編號（01/02/04/08）與分段權限代號（01–08）是同一套，不要只改一邊。
  權限判斷見 lib/babycam/actions.ts 的 getBabycamSectionAccess（只回 edit／none）。
*/

const input = "min-h-11 w-full rounded-lg border border-border-subtle bg-surface-raised px-3 py-2 text-sm";
const subPanel = "space-y-4 rounded-xl border border-border-subtle bg-surface-raised p-4";

type GroupId = "01" | "02" | "04";
type TabDef = {
  id: string;
  label: string;
  /** 對應 BabyCam 的 01–08 分段權限代號（不是群組編號）。 */
  access: string;
  /** 限定角色；未填代表只看分段權限。對應 BabyCam 的 `capability: "createStay"`。 */
  roles?: Role[];
};

/** 櫃檯交付與觀看紀錄跟著案件作業權限走（與 permissions.canUseCaseFlow 同一組角色）。 */
const CASE_FLOW_ROLES_FOR_BABYCAM: Role[] = ROLES.filter((item) => canUseCaseFlow(item));

const GROUPS: { id: GroupId; label: string; heading: string; description: string; tabs: TabDef[] }[] = [
  {
    id: "01",
    label: "入住登記",
    heading: "入住登記",
    description: "登記後即可交付觀看 QRCode 與密碼；寶寶與監視器由護理人員在「寶寶登錄」指派。",
    tabs: [
      { id: "desk", label: "入住登記", access: "01", roles: CASE_FLOW_ROLES_FOR_BABYCAM },
      { id: "list", label: "入住狀態", access: "01" },
      // 報表查的是觀看與照護紀錄，和「誰在住、授權到什麼時候」是同一條線，
      // 所以跟著 01 走；護理師不需要看誰在觀看，故限定角色。
      { id: "report", label: "紀錄與報表", access: "01", roles: CASE_FLOW_ROLES_FOR_BABYCAM },
    ],
  },
  {
    id: "02",
    label: "寶寶登錄",
    heading: "寶寶登錄",
    description: "指派寶寶、車號與監視器，列印手圈與嬰兒車標籤；歸位時掃碼核對。",
    tabs: [
      { id: "assign", label: "寶寶登錄與標籤", access: "02" },
      // 掃碼歸位是護理端的動作；櫃台拿到 02 只是為了換鏡頭，不該出現在這裡。
      { id: "scan", label: "掃碼歸位核對", access: "02", roles: ROLES.filter((item) => item !== "櫃台") },
    ],
  },
  {
    id: "04",
    /*
      「系統設定」群組（環狀燈號／繼電器板／燈號狀態）2026-10-21 依客戶要求併進來，
      群組從四個收成三個。名稱改為「設定與維運」：
        ・原本的「後臺管理」和主選單的「後台管理」（模組 15）只差一個臺／台，
          併入燈號設定後範圍更大，繼續沿用只會更容易認錯。
        ・燈號三頁的 access 仍是 06／07／08，非管理者本來就看不到，
          併群組不會讓任何人多拿到權限。
    */
    label: "設定與維運",
    heading: "設定與維運",
    description: "開放時段、房型房號、顯示狀態與背景圖、監視器主檔，以及環狀燈號與繼電器。",
    tabs: [
      { id: "schedule", label: "開放時段", access: "04" },
      // 消毒排程也是「這段時間不開放」的設定，跟開放時段擺一起；到點時監視器一律關閉。
      { id: "disinfect", label: "消毒排程", access: "04" },
      { id: "rooms", label: "房間清單", access: "04" },
      // 名稱與背景圖已合併成同一頁（見 StateMaintenance 的說明）；上傳底圖另吃 05 權限。
      { id: "states", label: "狀態維護", access: "04" },
      // 監視器主檔與健康狀態屬營運維護；護理長不必為了看一支鏡頭的健康狀態
      // 就被塞進只有管理者看得到的燈號設定裡（與 BabyCam 的差異，刻意）。
      { id: "cameras", label: "監視器狀態", access: "03" },
      { id: "demo", label: "展示控制台", access: "04" },
      { id: "ringlight", label: "環狀燈號", access: "06" },
      { id: "relay", label: "繼電器板", access: "07" },
      { id: "lightstates", label: "燈號狀態", access: "08" },
    ],
  },
];

/**
 * `?section=` 對應的群組名稱，給頁首標題用。
 *
 * ⚠️ 標題要跟著左側第 2 層選單變（客戶要求）：切到「寶寶登錄」時頁首就該寫
 * 「寶寶視訊・寶寶登錄」，否則四個群組的標題長得一模一樣，看不出自己在哪。
 */
export function babycamGroupLabel(section: string) {
  const group = (LEGACY_SECTION[section] ?? LEGACY_SECTION.registration).group;
  return GROUPS.find((item) => item.id === group)?.label ?? "";
}

/** 每個群組預設停在哪個頁籤（對齊 BabyCam 的 DEFAULT_TABS）。 */
const DEFAULT_TAB: Record<GroupId, string> = { "01": "desk", "02": "assign", "04": "schedule" };

/** 舊版 `?section=` 深連結 → 新的群組／頁籤，既有書籤與測試連結不會壞掉。 */
const LEGACY_SECTION: Record<string, { group: GroupId; tab: string }> = {
  registration: { group: "01", tab: "desk" },
  assign: { group: "02", tab: "assign" },
  // 掃標籤進來的落地分頁。缺了這一筆時 ScanEntry 會掉回 registration，
  // 護理人員掃完碼還得自己找到核對頁籤。
  scan: { group: "02", tab: "scan" },
  schedule: { group: "04", tab: "schedule" },
  backgrounds: { group: "04", tab: "states" },
  reports: { group: "01", tab: "report" },
  cameras: { group: "04", tab: "cameras" },
  // 「系統設定」群組已併入 04，舊的 ?section=lights 仍指向環狀燈號。
  lights: { group: "04", tab: "ringlight" },
};


function WindowEditor({ label, value, onChange }: { label: string; value: WindowRule; onChange: (rule: WindowRule) => void }) {
  const [draft, setDraft] = useState(value);
  return (
    <fieldset className="space-y-3 rounded-xl border border-border-subtle p-3">
      <legend className="px-2 text-sm font-semibold text-stone-700">{label}</legend>
      <div className="grid gap-3 sm:grid-cols-3">
        <select
          aria-label={`${label}模式`}
          className={input}
          value={draft.mode}
          onChange={(event) => setDraft({ ...draft, mode: event.target.value as WindowRule["mode"] })}
        >
          {[
            ["inherit", "依上層設定"],
            ["always", "全天"],
            ["closed", "關閉"],
            ["scheduled", "指定時段"],
          ].map(([key, title]) => (
            <option key={key} value={key}>
              {title}
            </option>
          ))}
        </select>
        <input aria-label={`${label}開始`} className={input} type="time" value={draft.start} onChange={(event) => setDraft({ ...draft, start: event.target.value })} />
        <input aria-label={`${label}結束`} className={input} type="time" value={draft.end} onChange={(event) => setDraft({ ...draft, end: event.target.value })} />
      </div>
      <Button size="sm" onClick={() => onChange(draft)}>
        儲存{label}
      </Button>
    </fieldset>
  );
}

/**
 * QR 圖隨容器縮放（兩張卡並排時欄寬只有一半，寫死 px 會溢出）；`size` 只設上限。
 * 產圖固定 320px 再縮下來，欄位變寬時才不會糊掉。
 */
export function TicketQr({ href, size = 160 }: { href: string; size?: number }) {
  const [src, setSrc] = useState("");
  useEffect(() => {
    let active = true;
    void QRCode.toDataURL(`${window.location.origin}${BASE_PATH}${href}`, { width: 320, margin: 2 }).then((value) => {
      if (active) setSrc(value);
    });
    return () => {
      active = false;
    };
  }, [href]);
  return src ? (
    <img src={src} width={size} height={size} style={{ maxWidth: size }} alt="可掃描的展示 QRCode" className="mx-auto h-auto w-full rounded-lg border border-border-subtle bg-white" />
  ) : (
    <span className="block py-8 text-center text-sm text-stone-400">產生 QRCode…</span>
  );
}

export default function BabycamWorkspace({
  initialSection = "registration",
  initialScanCode = "",
  initialBindingId = "",
}: {
  initialSection?: string;
  initialScanCode?: string;
  initialBindingId?: string;
}) {
  const { data, storageError } = useDomainStore();
  const role = useCurrentRole();

  /*
    群組直接由網址的 `?section=` 推導，**不存 state**。

    ⚠️ 這裡以前是 useState＋由 WorkspaceEntry 用 key 強制 remount。改成左側選單
    切群組之後那樣會把整個工作區重建，使用者在「入住登記」選好的案件（bindingId）
    會被丟掉，切到「寶寶登錄」時指派到的是另一筆——e2e 立刻抓到這個迴歸。
    頁籤選擇用 overrides 記住，切回同一個群組時還在原來那一頁。
  */
  const legacy = LEGACY_SECTION[initialSection] ?? LEGACY_SECTION.registration;
  const group = legacy.group;
  const [tabOverrides, setTabOverrides] = useState<Partial<Record<GroupId, string>>>({});
  const tabs: Record<GroupId, string> = { ...DEFAULT_TAB, [group]: legacy.tab, ...tabOverrides };
  const [bindingId, setBindingId] = useState(initialBindingId);
  const [cameraId, setCameraId] = useState("");
  const [message, setMessage] = useState("");
  const [scanCode, setScanCode] = useState(initialScanCode);
  const [scanBaby, setScanBaby] = useState("");
  const [labelImages, setLabelImages] = useState<string[]>([]);
  const [zone, setZone] = useState("全部");
  const [reportChoice, setReport] = useState("照護");
  const [keyword, setKeyword] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [reportPage, setReportPage] = useState(1);

  /** 看得到的頁籤＝分段權限 ∩ 角色限定；群組只要還有頁籤就顯示（對齊 BabyCam 的 tabsOf）。 */
  const tabsOf = useMemo(
    () => (id: GroupId) =>
      (GROUPS.find((item) => item.id === id)?.tabs ?? []).filter(
        (tab) => canBabycamSection(data, tab.access) && (!tab.roles || tab.roles.includes(role)),
      ),
    [data, role],
  );
  const visibleGroups = GROUPS.filter((item) => tabsOf(item.id).length > 0);
  const activeGroup = visibleGroups.find((item) => item.id === group) ?? visibleGroups[0];
  const groupTabs = activeGroup ? tabsOf(activeGroup.id) : [];
  const active = groupTabs.find((tab) => tab.id === tabs[activeGroup?.id ?? "01"]) ?? groupTabs[0];

  const report = role !== "管理者" && reportChoice === "操作" ? "照護" : reportChoice;
  const scannedBinding = initialScanCode
    ? data.bindings.find((item) => !item.ended && item.babies.some((baby) => baby.identityCode === initialScanCode))
    : undefined;
  const binding =
    data.bindings.find((item) => item.id === bindingId && !item.ended) ??
    scannedBinding ??
    (initialScanCode ? undefined : data.bindings.find((item) => !item.ended));
  const expectedBabyId = scanBaby || scannedBinding?.babies.find((baby) => baby.identityCode === initialScanCode)?.babyId || "";
  const camera = data.cameras.find((item) => item.id === cameraId) ?? data.cameras[0];
  const zoneCameras = data.cameras.filter((item) => zone === "全部" || item.code.startsWith(zone));
  function run(action: () => void, feedback = "已儲存，相關畫面及紀錄已同步。") {
    try {
      action();
      setMessage(feedback);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "操作失敗。");
    }
  }
  /*
    ⚠️ 不再有「切換群組」這個動作：群組改由左側主選單第 2 層決定，
    每個項目是 `/babycam/?section=xxx`，WorkspaceEntry 會依 section 重新掛載工作區。
    `group` state 只用來記住初始群組，不要再加回群組列或 setGroup 的呼叫端。
  */
  function selectTab(id: string) {
    if (!activeGroup) return;
    setTabOverrides((current) => ({ ...current, [activeGroup.id]: id }));
    setMessage("");
    setLabelImages([]);
  }

  /* 欄位依客戶 2026-10-29 指定精簡：照護拿掉「照護秒數」，觀看拿掉「受眾」「裝置識別」
     「最後觀看」「結果」。資料仍完整留在 careEvents／viewingHistory，只是不上表。 */
  const reportHeaders =
    report === "在鏡頭下"
      ? ["媽媽／房號", "寶寶", "監視器", "開始", "結束", "在鏡頭下秒數（推算）", "照護秒數"]
      : report === "照護"
        ? ["媽媽／房號", "寶寶", "開始", "結束", "執行者"]
        : report === "觀看"
          ? ["媽媽／房號", "開始", "結束"]
          : ["時間", "操作者", "操作", "對象"];
  const reportRows: (string | number)[][] =
    report === "在鏡頭下"
      ? cameraTimeRows(data, dateFrom, dateTo)
      : report === "照護"
        ? data.careEvents.map((event) => {
            const target = data.bindings.find((item) => item.id === event.bindingId);
            return [
              `${target?.motherName ?? ""}／${target?.room ?? "托嬰"}`,
              data.subjects.find((subject) => subject.id === event.babyId)?.name ?? "",
              event.start,
              event.end ?? "進行中",
              event.actor,
            ];
          })
        : report === "觀看"
          ? data.viewingHistory.map((event) => {
              const item = data.bindings.find((target) => target.id === event.bindingId);
              return [`${item?.motherName ?? ""}／${item?.room || "托嬰"}`, event.start, event.end ?? "觀看中"];
            })
          : data.audit.map((entry) => [entry.at, entry.actor, entry.action, entry.target]);
  const filteredRows = reportRows.filter((row) => {
    // 「操作」報表的時間欄叫「時間」，找不到「開始」就落回第一欄。
    const raw = String(row[Math.max(0, reportHeaders.indexOf("開始"))]);
    const date = new Date(raw).toLocaleDateString("en-CA", { timeZone: "Asia/Taipei" });
    return row.join(" ").includes(keyword) && (!dateFrom || date >= dateFrom) && (!dateTo || date <= dateTo);
  });

  if (!activeGroup || !active) {
    return (
      <p className="rounded-2xl border border-dashed border-border-subtle bg-surface-raised p-8 text-center text-sm text-stone-500">
        目前身分「{role}」沒有寶寶視訊的作業權限。
      </p>
    );
  }

  const caseSelector = (
    <label className="block space-y-2 text-sm font-semibold text-stone-700">
      選擇入住案件
      <select
        aria-label="選擇入住案件"
        className={input}
        value={binding?.id ?? ""}
        onChange={(event) => {
          setBindingId(event.target.value);
          setLabelImages([]);
        }}
      >
        <option value="">請選擇正確入住案件</option>
        {data.bindings
          .filter((item) => !item.ended)
          .map((item) => (
            <option key={item.id} value={item.id}>
              {item.room || "托嬰"}｜{item.motherName}｜{item.babies.length ? `${item.babies.length} 位寶寶` : "待護理指派"}
            </option>
          ))}
      </select>
      {binding && (
        <Link href={`/cases/detail/?id=${encodeURIComponent(binding.caseId)}`} className="block text-xs font-normal text-brand-600 underline underline-offset-4">
          開啟同一筆案件流程
        </Link>
      )}
    </label>
  );

  return (
    <div className="space-y-4">
      {(message || storageError) && (
        <p role="status" className="whitespace-pre-line rounded-xl border border-border-subtle bg-surface-muted px-4 py-3 text-sm">
          {storageError ?? message}
        </p>
      )}
      {initialScanCode && !scannedBinding && (
        <p role="status" className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          此識別標籤已失效或無有效指派，請先人工確認案件，不可直接歸位。
        </p>
      )}

      {/*
        導覽全部走頁首下方那一列（第 3 層）：群組名 → 群組內頁籤 → 右側外部連結。

        ⚠️ 工作區內**不要再畫群組列**：四個功能群組（入住登記／寶寶登錄／後臺管理／
        系統設定）2026-10-21 已移到左側主選單第 2 層（lib/modules.ts 模組 17 的
        subItems，href 走 `?section=`）。客戶要求「導覽統一在左邊與上面」。
        群組名留在這一列，因為選單第 2 層不做選取高亮（見 SidebarNav 的說明）。
      */}
      <HeaderSlot slot="below">
        <div className="header-tablist flex items-center gap-2 overflow-x-auto">
          {groupTabs.length > 1 ? (
            <div role="group" aria-label={`${activeGroup.label}工作區`} className="flex gap-1">
              {groupTabs.map((tab) => (
                <button key={tab.id} type="button" aria-pressed={active.id === tab.id} onClick={() => selectTab(tab.id)} className={headerTabClass(active.id === tab.id)}>
                  {tab.label}
                </button>
              ))}
            </div>
          ) : (
            <span className="shrink-0 text-sm font-semibold text-stone-700">{active.label}</span>
          )}
          {/* 群組說明靠右（客戶指定）；群組名已在頁首標題，這裡不重複。 */}
          <span className="ml-auto hidden max-w-[48ch] shrink-0 truncate pl-4 text-xs text-stone-500 xl:block" title={activeGroup.description}>
            {activeGroup.description}
          </span>
        </div>
      </HeaderSlot>
      <HeaderSlot slot="below">
        <div className="header-page-actions flex flex-wrap items-center gap-2">
          <ButtonLink href="/babycam/scan/" size="sm">
            <QrCode className="h-3.5 w-3.5" aria-hidden="true" />
            QR 掃描
          </ButtonLink>
          <ButtonLink href="/view/mama" size="sm">
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            媽媽端畫面
          </ButtonLink>
          <ButtonLink href="/view/family" size="sm">
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            親友端畫面
          </ButtonLink>
        </div>
      </HeaderSlot>

      {active.id === "cameras" && <StatusSummary
        title="監視器健康摘要"
        description="狀態與設備主檔同源；選擇下方代碼可查看最後截圖與觀看時段。"
        items={[
          { label: "設備總數", value: `${data.cameras.length} 支`, tone: "brand" },
          { label: "正常啟用", value: `${data.cameras.filter((item) => item.enabled && item.health !== "異常").length} 支`, tone: "success" },
          { label: "健康異常", value: `${data.cameras.filter((item) => item.health === "異常").length} 支`, detail: "請優先檢查來源與最後截圖", tone: data.cameras.some((item) => item.health === "異常") ? "danger" : "success" },
          { label: "停用設備", value: `${data.cameras.filter((item) => !item.enabled).length} 支`, detail: "停用設備不提供觀看", tone: data.cameras.some((item) => !item.enabled) ? "warning" : "default" },
        ]}
      />}

      <Panel flush>

        {/* ── 01 入住登記 ── */}
        {active.id === "desk" && (
          <SplitWorkspace
            form={
              <div className="space-y-4">
                <SectionHeading no={1} title="櫃台登記與授權期間" description="選定案件後設定觀看起迄；親友可另訂期間，也可單獨關閉。" />
                {caseSelector}
                {binding ? (
                  <>
                    {binding.viewingRevoked && (
                      <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
                        觀看授權已作廢；重發後才恢復，寶寶原指派仍保留。
                      </p>
                    )}
                    <p className="rounded-lg bg-surface-muted px-3 py-2 text-sm">
                      {binding.motherName}｜{binding.room || "無房號托嬰"}｜
                      {binding.babies.length ? "已完成護理指派" : "櫃台已登記，待護理指派"}
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="space-y-1.5 text-sm">
                        觀看起日
                        <input
                          type="date"
                          className={input}
                          value={binding.validFrom}
                          onChange={(event) => run(() => babycamActions.updateBinding(binding.id, { validFrom: event.target.value }))}
                        />
                      </label>
                      <label className="space-y-1.5 text-sm">
                        觀看迄日
                        <input
                          type="date"
                          className={input}
                          value={binding.validTo}
                          onChange={(event) => run(() => babycamActions.updateBinding(binding.id, { validTo: event.target.value }))}
                        />
                      </label>
                      <label className="space-y-1.5 text-sm">
                        親友另訂起日（選填）
                        <input
                          aria-label="親友另訂起日"
                          type="date"
                          className={input}
                          value={binding.familyFrom}
                          onChange={(event) => run(() => babycamActions.updateBinding(binding.id, { familyFrom: event.target.value }))}
                        />
                      </label>
                      <label className="space-y-1.5 text-sm">
                        親友另訂迄日（選填）
                        <input
                          aria-label="親友另訂迄日"
                          type="date"
                          className={input}
                          value={binding.familyTo}
                          onChange={(event) => run(() => babycamActions.updateBinding(binding.id, { familyTo: event.target.value }))}
                        />
                      </label>
                    </div>
                    <label className="flex min-h-11 items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={binding.familyEnabled}
                        onChange={(event) => run(() => babycamActions.updateBinding(binding.id, { familyEnabled: event.target.checked }))}
                      />
                      開放親友觀看
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="primary" onClick={() => run(() => babycamActions.reissue(binding.id), "已重發，舊觀看連結及工作階段失效。")}>
                        重發連結
                      </Button>
                      {/* 「踢除親友登入」依客戶 2026-10-29 要求下架；babycamActions.kick 與其測試保留，
                          要開回只需把這顆按鈕加回來。要收回授權請用右邊的「作廢觀看授權」。 */}
                      <Button size="sm" onClick={() => run(() => babycamActions.passcode(binding.id, String(Math.floor(100000 + Math.random() * 900000))))}>
                        重設展示密碼
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => run(() => babycamActions.revoke(binding.id), "已作廢觀看授權，寶寶原指派保留。")}>
                        作廢觀看授權
                      </Button>
                    </div>
                    <SectionHeading no={2} title="本筆入住的時段覆寫" description="未設定時沿用全院與受眾時段；交集為空會顯示全天關閉。" />
                    <WindowEditor
                      key={`${binding.id}-internal`}
                      label="本筆入住院內時段"
                      value={binding.internalWindow}
                      onChange={(internalWindow) => run(() => babycamActions.updateBinding(binding.id, { internalWindow }))}
                    />
                    <WindowEditor
                      key={`${binding.id}-family`}
                      label="本筆入住親友時段"
                      value={binding.familyWindow}
                      onChange={(familyWindow) => run(() => babycamActions.updateBinding(binding.id, { familyWindow }))}
                    />
                  </>
                ) : (
                  <p className="text-sm text-stone-500">請先選擇一筆入住案件。</p>
                )}
              </div>
            }
            aside={
              <>
                <AsideHeading eyebrow="櫃檯交付" title="觀看 QRCode 與密碼" description="交付給家屬的親友觀看連結；掃描後以下方帳號密碼登入。" />
                {!binding ? (
                  <AsideEmpty mark="QR" title="等待選擇案件" description="選定入住案件後，交付資料會顯示在這裡。" />
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm">
                      <strong className="text-stone-800">{binding.room || "托嬰"} 房</strong> · {binding.motherName}
                    </p>
                    {/*
                      只交付親友觀看連結（客戶 2026-10-29）：院內媽媽即時畫面改由病房端自行進入，
                      櫃台不再一次給兩個連結。internalTicket 仍照常產生（/view/mama 照舊可用），
                      要開回就把院內那張卡加回來，並把 printFamilyNotice 的 internalHref 一併帶上。
                      只剩一張時放大 QR：櫃台當面交付，家屬常常是拿自己的手機隔著桌子掃。
                    */}
                    <article className="space-y-2 rounded-xl border border-border-subtle bg-surface-raised p-4 text-center">
                      <span className="inline-flex rounded-full bg-purple-100 px-2 py-0.5 text-[11px] font-bold text-purple-700">親友</span>
                      <h4 className="text-sm font-bold text-stone-800">親友觀看畫面</h4>
                      <TicketQr href={`/view/family/?ticket=${encodeURIComponent(binding.familyTicket)}`} size={240} />
                      <Link href={`/view/family/?ticket=${encodeURIComponent(binding.familyTicket)}`} className="block break-all text-xs text-brand-600 underline underline-offset-4">
                        開啟觀看頁
                      </Link>
                    </article>
                    <section className="space-y-1 rounded-xl border border-border-subtle bg-surface-raised p-3 text-sm">
                      <strong className="block text-stone-800">家屬登入資料</strong>
                      <span className="block text-stone-600">登入帳號：{binding.phone}</span>
                      <span className="block text-stone-600">
                        展示密碼：<strong className="tabular-nums tracking-[0.12em] text-stone-800">{binding.passcode}</strong>
                      </span>
                      <span className="block text-stone-600">
                        觀看期間：{binding.validFrom} 至 {binding.validTo}
                      </span>
                      <small className="block pt-1 text-xs text-stone-500">請交由指定家屬保管，不要公開或轉傳。</small>
                    </section>
                    <Button
                      size="sm"
                      onClick={() => {
                        void printFamilyNotice({
                          room: binding.room || "托嬰",
                          motherName: binding.motherName,
                          phone: binding.phone,
                          passcode: binding.passcode,
                          validFrom: binding.validFrom,
                          validTo: binding.validTo,
                          // 院內那張依客戶要求不印；familyNotice 的 internalHref 是選填，給了才會多印一張卡。
                          familyHref: `/view/family/?ticket=${encodeURIComponent(binding.familyTicket)}`,
                        });
                      }}
                    >
                      <Printer className="h-3.5 w-3.5" aria-hidden="true" />
                      列印家屬通知單
                    </Button>
                  </div>
                )}
              </>
            }
          />
        )}

        {active.id === "list" && (
          <div className="space-y-4 p-4 sm:p-5">
            <SectionHeading no={1} title="入住中的視訊授權" description="顯示狀態會即時反映到媽媽端與親友端；設為照護中會遮蔽畫面。" />
            <div className="overflow-x-auto rounded-xl border border-border-subtle">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="bg-surface-muted">
                  <tr>
                    {["房號／媽媽", "寶寶・車號・監視器", "顯示狀態", "照護", "觀看期間"].map((label) => (
                      <th key={label} className="p-3 font-semibold text-stone-600">
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.bindings
                    .filter((item) => !item.ended)
                    .flatMap((item) =>
                      (item.babies.length ? item.babies : [null]).map((baby, index) => (
                        <tr key={`${item.id}-${baby?.babyId ?? "none"}`} className="border-t border-border-subtle align-middle">
                          {index === 0 && (
                            <td className="p-3" rowSpan={Math.max(1, item.babies.length)}>
                              <strong className="text-stone-800">{item.room || "托嬰"}</strong>
                              <br />
                              <span className="text-stone-500">{item.motherName}</span>
                            </td>
                          )}
                          <td className="p-3">
                            {baby ? (
                              <>
                                {data.subjects.find((subject) => subject.id === baby.babyId)?.name}｜車 {baby.cartNo}｜
                                {data.cameras.find((cam) => cam.id === baby.cameraId)?.code}
                              </>
                            ) : (
                              <span className="text-stone-400">待護理指派</span>
                            )}
                          </td>
                          <td className="p-3">
                            {baby && (
                              <select
                                aria-label="寶寶顯示狀態"
                                className={`${input} sm:w-44`}
                                value={baby.state}
                                onChange={(event) => run(() => babycamActions.state(item.id, baby.babyId, event.target.value))}
                              >
                                {data.displayStates.map((state) => (
                                  <option key={state.key} value={state.key}>
                                    {state.name}
                                  </option>
                                ))}
                              </select>
                            )}
                          </td>
                          <td className="p-3">
                            {baby && (
                              <Button
                                size="sm"
                                variant={baby.careMode ? "primary" : "secondary"}
                                disabled={!canBabycamSection(data, "02")}
                                onClick={() => run(() => babycamActions.care(item.id, baby.babyId, !baby.careMode))}
                              >
                                {baby.careMode ? "結束照護" : "設為照護中"}
                              </Button>
                            )}
                          </td>
                          {index === 0 && (
                            <td className="p-3 text-stone-500" rowSpan={Math.max(1, item.babies.length)}>
                              {item.validFrom} ～ {item.validTo}
                              {item.viewingRevoked && <span className="ml-1 text-rose-600">（已作廢）</span>}
                            </td>
                          )}
                        </tr>
                      )),
                    )}
                </tbody>
              </table>
              {!data.bindings.some((item) => !item.ended) && <p className="p-6 text-center text-sm text-stone-500">目前沒有入住中的視訊授權。</p>}
            </div>
          </div>
        )}

        {/* ── 02 寶寶登錄 ── */}
        {active.id === "assign" && (
          <SplitWorkspace
            form={
              <div className="space-y-4">
                <SectionHeading no={2} title="護理指派寶寶與監視器" description="先選媽媽，再選監視器與寶寶資料；儲存後即可列印手圈及嬰兒車標籤。" />
                {caseSelector}
                {binding ? (
                  <>
                    <BindingEditor key={binding.id} data={data} binding={binding} onChange={() => setLabelImages([])} />
                    <PrintSettingsEditor value={data.printSettings} onSaved={() => setLabelImages([])} />
                  </>
                ) : (
                  <p className="text-sm text-stone-500">請先選擇一筆入住案件。</p>
                )}
              </div>
            }
            aside={
              <>
                <AsideHeading eyebrow="護理交付" title="手圈與嬰兒車標籤" description="識別 QR 只用於核對寶寶，不授予觀看權限；版型固定 40 × 15 mm 雙排。" />
                {!binding || !binding.babies.length ? (
                  <AsideEmpty mark="標籤" title="等待指派寶寶" description="完成寶寶與監視器指派後，可在這裡產生並列印標籤。" />
                ) : (
                  <div className="space-y-3">
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={async () => {
                        try {
                          await loadPrintFont(data.printSettings);
                          const images = binding.babies.map((baby) => {
                            const subject = data.subjects.find((item) => item.id === baby.babyId)!;
                            const rendered = renderWristband(
                              binding.room,
                              binding.motherName,
                              {
                                cameraId: Number(baby.cameraId.replace("camera-", "")) || 1,
                                cameraCode: data.cameras.find((item) => item.id === baby.cameraId)?.code ?? "",
                                babyName: subject.name,
                                cartNo: baby.cartNo,
                                identityCode: baby.identityCode,
                                scanUrl: `${window.location.origin}${BASE_PATH}/babycam/scan/?code=${encodeURIComponent(baby.identityCode)}`,
                                birthDate: subject.birthDate ?? "2026-10-01",
                                sex: subject.gender === "女" ? "female" : "male",
                                birthOrder: baby.birthOrder ?? 0,
                              },
                              data.printSettings,
                            );
                            if (rendered.overflow) throw new Error(rendered.reasons.join("、"));
                            return rendered.canvas.toDataURL();
                          });
                          setLabelImages(images);
                          setMessage("已產生本機標籤預覽。");
                        } catch (error) {
                          setMessage(error instanceof Error ? error.message : "標籤預覽失敗。");
                        }
                      }}
                    >
                      產生標籤預覽
                    </Button>
                    {labelImages.map((src, index) => (
                      <img key={index} src={src} alt={`寶寶 ${index + 1} 標籤預覽`} className="max-w-full rounded-lg border border-border-subtle bg-white" />
                    ))}
                    {labelImages.length > 0 && (
                      <Button size="sm" onClick={() => void printWristbands(labelImages, data.printSettings.gap).catch((error: Error) => setMessage(error.message))}>
                        <Printer className="h-3.5 w-3.5" aria-hidden="true" />
                        列印標籤
                      </Button>
                    )}
                  </div>
                )}
              </>
            }
          />
        )}

        {active.id === "scan" && (
          <div className="space-y-4 p-4 sm:p-5">
            <SectionHeading no={3} title="掃碼歸位核對" description="平板可用相機 App 掃標籤再於此核對；瀏覽器相機不可用時手動輸入識別碼即可。" />
            {caseSelector}
            {binding && (
              <>
                <label className="block space-y-1.5 text-sm">
                  應歸位的寶寶
                  <select aria-label="應歸位的寶寶" className={input} value={expectedBabyId} onChange={(event) => setScanBaby(event.target.value)}>
                    <option value="">請選擇</option>
                    {binding.babies.map((baby) => (
                      <option key={baby.babyId} value={baby.babyId}>
                        {data.subjects.find((subject) => subject.id === baby.babyId)?.name}｜車 {baby.cartNo}｜展示短碼 {baby.identityCode}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block space-y-1.5 text-sm">
                  掃碼結果／手動輸入識別碼
                  <input aria-label="掃碼結果／手動輸入識別碼" className={input} value={scanCode} onChange={(event) => setScanCode(event.target.value)} />
                </label>
                <Button variant="primary" onClick={() => run(() => babycamActions.scan(scanCode, expectedBabyId), "身分核對通過，寶寶已歸位並結束照護。")}>
                  核對並歸位
                </Button>
              </>
            )}
          </div>
        )}

        {/* ── 04 後臺管理 ── */}
        {active.id === "disinfect" && <DisinfectionSchedule data={data} onChange={() => setMessage("")} />}

        {active.id === "schedule" && (
          <div className="space-y-4 p-4 sm:p-5">
            <SectionHeading
              no={1}
              title="開放時段"
              description="先設定全院總時段，再分別調整院內與親友可觀看的時間；每筆入住自行關閉的時段仍會擋住畫面。"
            />
            <SchedulePanel data={data} run={run} />
          </div>
        )}

        {active.id === "rooms" && (
          <div className="space-y-4 p-4 sm:p-5">
            <SectionHeading no={1} title="房間清單" description="調整後會立即反映在「入住登記」的房號下拉與院務端的房況總覽。" />
            <RoomListPanel data={data} run={run} />
          </div>
        )}

        {active.id === "states" && (
          <div className="space-y-4 p-4 sm:p-5">
            <SectionHeading
              no={1}
              title="顯示狀態與背景"
              description="改成院內習慣的叫法即可，寶寶／監視器的狀態下拉會跟著換；卡片底圖就是家屬與院內在該狀態下看到的畫面。"
            />
            <StateMaintenance data={data} />
          </div>
        )}

        {active.id === "report" && (
          <div className="space-y-4 p-4 sm:p-5">
            <SectionHeading no={1} title="紀錄與報表" description="觀看與照護紀錄皆為模擬資料；可依日期與關鍵字篩選後匯出 Excel。" />
            <div className="flex flex-wrap items-end gap-2">
              {/* 「在鏡頭下」依客戶 2026-10-29 要求下架；報表分支與 cameraTimeRows 保留，要開回只需加回這裡。 */}
              {["照護", "觀看", ...(role === "管理者" ? ["操作"] : [])].map((item) => (
                <Button
                  key={item}
                  size="sm"
                  selected={report === item}
                  onClick={() => {
                    setReport(item);
                    setReportPage(1);
                  }}
                >
                  {item}
                </Button>
              ))}
              <input
                aria-label="篩選報表"
                className={`${input} sm:w-56`}
                placeholder="篩選房號、姓名、內容"
                value={keyword}
                onChange={(event) => {
                  setKeyword(event.target.value);
                  setReportPage(1);
                }}
              />
              <label className="space-y-1 text-xs text-stone-500">
                開始日期
                <input
                  aria-label="報表開始日期"
                  type="date"
                  className={input}
                  value={dateFrom}
                  onChange={(event) => {
                    setDateFrom(event.target.value);
                    setReportPage(1);
                  }}
                />
              </label>
              <label className="space-y-1 text-xs text-stone-500">
                結束日期
                <input
                  aria-label="報表結束日期"
                  type="date"
                  className={input}
                  value={dateTo}
                  onChange={(event) => {
                    setDateTo(event.target.value);
                    setReportPage(1);
                  }}
                />
              </label>
              <Button
                size="sm"
                onClick={() =>
                  downloadFile(
                    "寶寶視訊報表.xlsx",
                    toBrowserXlsx(reportHeaders, filteredRows),
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                  )
                }
              >
                匯出 Excel
              </Button>
            </div>
            <div className="overflow-x-auto rounded-xl border border-border-subtle">
              <table className="w-full min-w-[600px] text-left text-sm">
                <thead className="bg-surface-muted">
                  <tr>
                    {reportHeaders.map((item) => (
                      <th className="p-2.5 font-semibold text-stone-600" key={item}>
                        {item}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.slice((reportPage - 1) * 10, reportPage * 10).map((row, index) => (
                    <tr key={index} className="border-t border-border-subtle">
                      {row.map((value, cell) => (
                        <td className="p-2.5" key={cell}>
                          {value}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {!filteredRows.length && <p className="p-6 text-center text-sm text-stone-500">沒有符合條件的紀錄。</p>}
            </div>
            <div className="flex items-center gap-3">
              <Button size="sm" disabled={reportPage <= 1} onClick={() => setReportPage(reportPage - 1)}>
                上一頁
              </Button>
              <span className="text-sm text-stone-600">
                第 {reportPage} 頁，共 {filteredRows.length} 筆
              </span>
              <Button size="sm" disabled={reportPage * 10 >= filteredRows.length} onClick={() => setReportPage(reportPage + 1)}>
                下一頁
              </Button>
            </div>
          </div>
        )}

        {active.id === "demo" && (
          <div className="space-y-4 p-4 sm:p-5">
            <SectionHeading no={1} title="展示情境控制" description="調整示範時間與影像情境，用來演示過期截圖、連線異常與離車遮蔽。" />
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1.5 text-sm">
                台灣時間
                <input
                  type="datetime-local"
                  className={input}
                  defaultValue={data.demoAt.slice(0, 16)}
                  onBlur={(event) => {
                    if (event.target.value) run(() => babycamActions.settings({ demoAt: `${event.target.value}+08:00` }));
                  }}
                />
              </label>
              <label className="space-y-1.5 text-sm">
                展示影像情境
                <select
                  aria-label="展示影像情境"
                  className={input}
                  value={data.viewScenario}
                  onChange={(event) => run(() => babycamActions.settings({ viewScenario: event.target.value as typeof data.viewScenario }))}
                >
                  {[
                    ["normal", "正常"],
                    ["stale", "過期截圖"],
                    ["fault", "連線異常"],
                    ["cart-away", "嬰兒車離開鏡頭"],
                  ].map(([key, label]) => (
                    <option value={key} key={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className="block max-w-sm space-y-1.5 text-sm">
              院內網段前綴
              <input
                className={input}
                placeholder={DEFAULT_NETWORK_PREFIX}
                defaultValue={data.networkPrefix ?? DEFAULT_NETWORK_PREFIX}
                onBlur={(event) => {
                  const next = event.target.value.trim() || DEFAULT_NETWORK_PREFIX;
                  if (next !== (data.networkPrefix ?? DEFAULT_NETWORK_PREFIX)) run(() => babycamActions.settings({ networkPrefix: next }), "已更新網段前綴；燈號看板與繼電器板的位址同步改寫。");
                }}
              />
              <span className="block text-xs text-stone-500">
                預設為院內 IPCam 專網 {DEFAULT_NETWORK_PREFIX}；改動只存在這台瀏覽器，
                燈號看板、繼電器板與監視器明細的位址會一起改寫。
              </span>
            </label>
            {role === "管理者" && <DemoReset />}
          </div>
        )}

        {/* ── 08 系統設定 ── */}
        {active.id === "cameras" && (
          <div className="space-y-4 p-4 sm:p-5">
            <SectionHeading no={1} title={`監視器狀態（${data.cameras.length} 支）`} description="以代碼晶片挑選要檢視或維護的監視器；灰字為停用或異常。" />
            <ZoneFilter zones={["全部", "A", "B"]} active={zone} onSelect={setZone} count={`目前 ${zoneCameras.length} 支`} />
            <CameraChipGrid cameras={zoneCameras} selectedIds={camera ? [camera.id] : []} onToggle={(id) => setCameraId(id)} />
            {camera && (
              <section className={subPanel}>
                <h3 className="text-sm font-bold text-stone-800">{camera.code} 明細</h3>
                <div className="grid gap-2 text-sm sm:grid-cols-2">
                  <p>設備代號：{camera.code}</p>
                  <p>健康狀態：{camera.health}</p>
                  <p>
                    位址：<span className="font-mono" translate="no">{cameraHost(data.networkPrefix || DEFAULT_NETWORK_PREFIX, camera.code) ?? "未設定末碼"}</span>
                  </p>
                  <p>來源標示：{camera.sourceLabel || `展示-${camera.code}`}</p>
                  <p>解析度：{camera.resolution || "1920×1080"}</p>
                  <p>啟用狀態：{camera.enabled ? "啟用" : "停用"}</p>
                  <p>最後截圖（模擬）：{taipeiTimestamp(camera.lastShotAt)}</p>
                </div>
                {(["internal", "family"] as const).map((audience) => {
                  const result = effectiveViewingWindow(data, camera, audience);
                  return (
                    <p key={audience} className="text-sm text-stone-600">
                      {audience === "internal" ? "院內" : "親友"}實際生效：
                      {result.window.mode === "closed"
                        ? "全天關閉（交集為空）"
                        : result.window.mode === "always"
                          ? "全天"
                          : `${result.window.start}–${result.window.end}`}
                      {result.truncated ? "；不連續交集已保守採較長時段" : ""}
                    </p>
                  );
                })}
                <CamPreview mode={camera.health === "異常" ? "offline" : "snapshot"} room="展示" camCode={camera.code} />
                <CameraMetadata key={camera.id} camera={camera} />
                <div className="flex flex-wrap items-center gap-3">
                  <label className="flex min-h-11 items-center gap-2 text-sm">
                    <input type="checkbox" checked={camera.enabled} onChange={(event) => run(() => babycamActions.camera(camera.id, { enabled: event.target.checked }))} />
                    啟用監視器
                  </label>
                  <select
                    aria-label="監視器健康狀態"
                    className={`${input} sm:w-40`}
                    value={camera.health}
                    onChange={(event) => run(() => babycamActions.camera(camera.id, { health: event.target.value as typeof camera.health }))}
                  >
                    {["正常", "等待", "異常"].map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                  <Button size="sm" onClick={() => run(() => babycamActions.camera(camera.id, { baseline: true }), "已儲存模擬正常停放基準；未啟動真實影像偵測。")}>
                    設為正常停放基準
                  </Button>
                  <span className="text-xs text-stone-500">{camera.baseline ? "已設定正常停放基準" : "尚未設定基準"}</span>
                </div>
                <WindowEditor
                  key={`${camera.id}-internal`}
                  label="每機院內時段"
                  value={camera.scheduleInternal}
                  onChange={(rule) => run(() => babycamActions.camera(camera.id, { scheduleInternal: rule }))}
                />
                <WindowEditor
                  key={`${camera.id}-family`}
                  label="每機親友時段"
                  value={camera.scheduleFamily}
                  onChange={(rule) => run(() => babycamActions.camera(camera.id, { scheduleFamily: rule }))}
                />
              </section>
            )}
            {role === "管理者" && camera && <MaintenanceConsole key={camera.id} data={data} camera={camera} />}
          </div>
        )}

        {active.id === "ringlight" && (
          <div className="space-y-4 p-4 sm:p-5">
            <SectionHeading
              no={1}
              title="環狀燈號看板"
              description="燈色由顯示狀態推導，顯示的就是現場燈具實際會亮的顏色；佈線對照缺漏的監視器會標示略過。"
            />
            <RingLightBoard data={data} />
          </div>
        )}

        {active.id === "relay" && (
          <div className="space-y-4 p-4 sm:p-5">
            <SectionHeading
              no={1}
              title="繼電器通道點測"
              description="逐台逐通道點測環狀燈的紅／綠／藍。本原型只寫進瀏覽器記憶體，不會連線院內繼電器板。"
            />
            <RelayBoard data={data} onToggle={(channel, next) => run(() => babycamActions.relay(channel, next), `已切換 ${channel}（僅本機模擬）。`)} />
          </div>
        )}

        {active.id === "lightstates" && (
          <div className="space-y-4 p-4 sm:p-5">
            <SectionHeading
              no={1}
              title="院方燈號狀態"
              description="這份設定就是全站的燈號語意：環狀燈號看板顯示的顏色、繼電器板的對照圖例，都讀這一份。"
            />
            <LightStatePanel data={data} />
          </div>
        )}
      </Panel>
    </div>
  );
}
