"use client";
/* 本機簽名與照片直接使用 data／Blob URL，不經伺服器圖片服務。 */
/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { report, reportFail } from "@/lib/demo/lenient";
import Link from "next/link";
import { ArrowLeft, Check, FileText, LockKeyhole, Printer, Save, UnlockKeyhole, X } from "lucide-react";
import RequireAccess from "@/components/ui/RequireAccess";
import PageHeader from "@/components/ui/PageHeader";
import HeaderSlot from "@/components/layout/HeaderSlot";
import { useCurrentRole } from "@/lib/roleStore";
import { careForms } from "@/lib/care/forms";
import { careSubject } from "@/lib/care/subjects";
import { useDomainStore } from "@/lib/demo/domainStore";
import { careActions, careStore, useCareStore } from "@/lib/care/store";
import { useAssessmentFields } from "@/lib/assessmentConfigStore";
import { backfillDeadline, canAuthorizeCare, canEditCare, canViewCare, documentKey, isBackfillBlocked, isBackfillExpired, moodNeedsAttention, needsFeedingReassessment, taipeiTimestamp, validateCareForm } from "@/lib/care/rules";
import type { CareKind, CareSignatureRole, CareSubject } from "@/lib/care/types";
import CareFieldInput, { GrowthChart, buttonClass, inputClass, valueText } from "./CareFields";
import CareSignature from "./CareSignature";
import CareFieldGroups from "./CareFieldGroups";
import styles from "./CareWorkspace.module.css";
import LocalMedia from "../babycam/LocalMedia";
import { buttonStyles } from "@/components/ui/buttonStyles";
import { ActionDock } from "@/components/ui/Workspace";
import { Toast, useToast } from "@/components/ui/Toast";


/**
 * 對象識別列後半段的狀態摘要。
 *
 * ⚠️ 不要把 `subject.motherName` 無條件放進來：對媽媽而言它就等於 `subject.name`，
 * 而 `identity()` 已經印過一次，畫面上會看到同一個名字連出現兩次（客戶回報）。
 * 只有寶寶（母嬰姓名不同）才需要標出媽媽是誰。
 */
function subjectSummary(subject: CareSubject) {
  return [
    subject.motherName && subject.motherName !== subject.name ? `媽媽 ${subject.motherName}` : null,
    subject.status,
    `入住第 ${subject.stayDay} 天`,
    subject.gender ? `${subject.gender}寶寶` : null,
  ]
    .filter(Boolean)
    .join("｜");
}

/** 托嬰沒有房號，識別改以車號為主，後面補上媽媽退房前的房號（v24 §4.6）。 */
function identity(subject: CareSubject) {
  const location = subject.room
    ? `房號 ${subject.room}${subject.carNo ? `｜車號 ${subject.carNo}` : ""}`
    : `車號 ${subject.carNo || "待指派"}${subject.previousRoom ? `｜原 ${subject.previousRoom} 房` : ""}`;
  return `${location}｜${subject.name}｜${subject.chartNo}`;
}
const signatureRoles: { key: CareSignatureRole; label: string }[] = [{ key: "recipient", label: "媽媽／家屬簽名" }, { key: "executor", label: "執行者簽名" }, { key: "evaluator", label: "評值者簽名" }];
const hydrationSubscribe = () => () => {};

export default function CareWorkspace({ kind }: { kind: CareKind }) {
  const role = useCurrentRole();
  const { data, storageError } = useCareStore();
  const { data: domain } = useDomainStore();
  const subjectFor = (id: string) => domain.subjects.find((item) => item.id === id);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("在館");
  const [toast, toastProps] = useToast();
  /*
    頁內確認面板的待辦動作。
    ⚠️ 關閉的單位是「房間」（close-subject）不是單張表單：表單是這間房的頁籤，
    關掉其中一張沒有意義。帶 subjectId 是因為使用者可以關閉非作用中的那一間。
  */
  type PendingAction =
    | "complete" | "all" | "unlock" | "authorize" | "workorder"
    | { kind: "close-subject"; subjectId: string }
    | { kind: "delete-entry"; entryId: string };
  const [pending, setPending] = useState<PendingAction | null>(null);
  /** 每位對象上次看的表單，切回這間房時回到原處。 */
  const [lastFormBySubject, setLastFormBySubject] = useState<Record<string, string>>({});
  const [reason, setReason] = useState("");
  const [signing, setSigning] = useState(false);
  const [signingRole, setSigningRole] = useState<CareSignatureRole>("recipient");
  const [listVisible, setListVisible] = useState(false);
  // 列印空白表格（手冊第 41 頁「評估表要可以印空白表格」）：臨時手寫或補單時用。
  const [blankSheet, setBlankSheet] = useState(false);
  const hydrated = useSyncExternalStore(hydrationSubscribe, () => true, () => false);
  const confirmation = useRef<HTMLElement>(null);
  const configured = useAssessmentFields();
  const forms = careForms(kind, configured).filter((form) => role !== "衛教師 琳雅" || canEditCare(role, kind, form.key));
  const activeKey = data.active[kind];
  const document = activeKey ? data.documents[activeKey] : undefined;
  const sectionIndex = document?.viewport?.sectionIndex ?? 0;
  function setSectionIndex(index: number) { if (activeKey) careActions.viewport(activeKey, { sectionIndex: index }); }
  const subject = document ? subjectFor(document.subjectId) : undefined;
  const form = forms.find((item) => item.key === document?.formKey);
  const hasActive = !!document && !!subject && !!form && !listVisible;
  /*
    「已逾期」與「不能編輯」是兩件事（客戶 2026-10-22）：逾期後護理長與管理者
    仍可直接補登，其餘角色要先經授權。顯示用 expired，判斷編輯權一律用 blocked。
  */
  const expired = subject ? isBackfillExpired(subject, data.backfillDays) : false;
  const blocked = subject ? isBackfillBlocked(role, subject, data.backfillDays, !!data.authorizations[subject.id]) : false;
  const permitted = !!subject && !!document && canEditCare(role, kind, document.formKey);
  const editable = permitted && data.unlockedCase === subject?.caseId && !blocked && !document?.signedAt;
  const openDocuments = data.open.map((key) => data.documents[key]).filter((item) => subjectFor(item.subjectId)?.kind === kind);
  /*
    表單列依「照護對象」分組。

    同時開六、七張表單時，每顆按鈕都前綴一次房號（301｜301｜301…）既佔空間
    又看不出哪幾張屬於同一間房。改成一間房一個群組：房號只出現一次當群組標籤，
    群組內只留表單名。客戶回報「同時開啟多個房間表單要能一眼區分」。
    用 Map 而不是先排序，維持使用者實際開啟的先後順序。
  */
  const trayGroups = Array.from(
    openDocuments.reduce((groups, item) => {
      const target = subjectFor(item.subjectId)!;
      const group = groups.get(item.subjectId);
      if (group) group.items.push(item);
      else groups.set(item.subjectId, { target, items: [item] });
      return groups;
    }, new Map<string, { target: NonNullable<ReturnType<typeof subjectFor>>; items: typeof openDocuments }>()).values(),
  );
  const drafts = Object.values(data.documents).filter((item) => !item.signedAt && (item.savedAt || item.dirty) && subjectFor(item.subjectId)?.kind === kind && forms.some((available) => available.key === item.formKey));
  const history = data.entries.filter((entry) => entry.subjectId === subject?.id && entry.formKey === document?.formKey);
  const completionErrors = form && document ? validateCareForm(form, document.values) : [];
  if (form?.signature && document && !document.signature) completionErrors.push("尚未完成本筆簽名。");
  if (form?.key === "guidance" && document && ["recipient", "executor", "evaluator"].some((key) => !document.signatures?.[key as CareSignatureRole])) completionErrors.push("三方簽名尚未完成。");
  const searchedSubjects = domain.subjects.filter((item) => item.kind === kind).filter((item) => [item.name, item.motherName, item.room, item.carNo, item.chartNo].join(" ").toLowerCase().includes(query.toLowerCase()));
  const subjects = searchedSubjects.filter((item) => filter === "退房回補" ? item.historical : filter === "托嬰" ? !item.historical && item.status === "托嬰" : !item.historical);
  const backfillSubjects = filter === "在館" ? searchedSubjects.filter((item) => item.historical) : [];

  /** 回補卡片上的逾期提示：主管看到的是「可直接補登」，其餘角色才是「需授權」。 */
  function expiryHint(item: CareSubject) {
    if (!isBackfillExpired(item, data.backfillDays)) return "";
    if (data.authorizations[item.id]) return "（已授權回補）";
    return canAuthorizeCare(role) ? "（已逾期，主管可直接補登）" : "（逾期需主管授權）";
  }

  function run(action: () => void, success = "") {
    try { action(); report(toast, success); setPending(null); setReason(""); return true; }
    catch (error) { reportFail(toast, error, "操作失敗，請重試。"); return false; }
  }
  function open(id: string, key: string) {
    if (!run(() => careActions.open(id, key))) return;
    setListVisible(false); setSigning(false);
  }
  useEffect(() => {
    careActions.syncRole();
    const params = new URLSearchParams(window.location.search);
    const linkedSubject = careSubject(params.get("subject") ?? "");
    const linkedForm = params.get("form") ?? "";
    if (linkedSubject?.kind !== kind || !careForms(kind).some((item) => item.key === linkedForm)) return;
    const timer = window.setTimeout(() => {
      try { careActions.open(linkedSubject.id, linkedForm); setListVisible(false); setSigning(false); }
      catch (error) { toast.fail(error instanceof Error ? error.message : "無法開啟指定照護表單。"); }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [kind, toast]);
  useEffect(() => {
    if (!activeKey || !hasActive) return;
    const key = activeKey; let timer = 0; let frame = 0; let disposed = false; let restoring = true;
    let position = careStore.get().documents[key]?.viewport?.scrollY ?? 0;
    const previousRestoration = window.history.scrollRestoration; window.history.scrollRestoration = "manual";
    // 等待字型與版面落定，避免瀏覽器原生還原或短暫列表高度覆寫儲存位置。
    void window.document.fonts.ready.then(() => {
      if (disposed || !restoring) return;
      frame = requestAnimationFrame(() => { window.scrollTo({ top: position, behavior: "instant" }); frame = requestAnimationFrame(() => { window.scrollTo({ top: position, behavior: "instant" }); restoring = false; }); });
    });
    const save = () => { if (careStore.get().documents[key]?.viewport?.scrollY !== position) careActions.viewport(key, { scrollY: position }); };
    const onScroll = () => { if (restoring) return; position = window.scrollY; clearTimeout(timer); timer = window.setTimeout(save, 250); };
    const userScroll = () => { restoring = false; cancelAnimationFrame(frame); };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("wheel", userScroll, { passive: true }); window.addEventListener("touchstart", userScroll, { passive: true }); window.addEventListener("keydown", userScroll);
    return () => { disposed = true; cancelAnimationFrame(frame); clearTimeout(timer); window.removeEventListener("scroll", onScroll); window.removeEventListener("wheel", userScroll); window.removeEventListener("touchstart", userScroll); window.removeEventListener("keydown", userScroll); window.history.scrollRestoration = previousRestoration; if (!restoring) save(); };
  }, [activeKey, hasActive]);
  useEffect(() => {
    if (pending) confirmation.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [pending]);
  useEffect(() => {
    const listener = () => { careActions.switchRole(); setSigning(false); setPending(null); setListVisible(false); toast.ok("已切換角色，開啟中的表單及編輯鎖已釋放；草稿仍保留。"); };
    window.addEventListener("santino-role-changed", listener);
    return () => window.removeEventListener("santino-role-changed", listener);
  }, [toast]);
  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => { if (Object.values(data.documents).some((item) => item.dirty)) event.preventDefault(); };
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [data.documents]);

  if (!hydrated) return <div className="page-frame"><div className="h-16 animate-pulse rounded-xl bg-white/70" aria-label="照護工作區載入中" /></div>;

  /** 確認面板目前針對的對象：關閉某一間房，或刪除某一筆已簽出紀錄。 */
  const closeTarget = pending && typeof pending === "object" && pending.kind === "close-subject" ? pending : null;
  const deleteTarget = pending && typeof pending === "object" && pending.kind === "delete-entry" ? pending : null;
  const deletingEntry = deleteTarget ? data.entries.find((entry) => entry.id === deleteTarget.entryId) : undefined;
  /** 確認面板要關閉的那一間房怎麼稱呼（可能不是目前作用中的那一間）。 */
  const closingSubject = closeTarget ? subjectFor(closeTarget.subjectId) : undefined;
  const closingLabel = closingSubject
    ? `${closingSubject.room || closingSubject.carNo || ""} ${closingSubject.name}`.trim()
    : "";
  return <div className={`${styles.workspace} page-frame`}>
    <RequireAccess moduleNo={kind === "mama" ? "2" : "3"}>
      <PageHeader title={kind === "mama" ? "媽媽照護" : "寶寶照護"} moduleNo={kind === "mama" ? "2" : "3"} />
      {storageError && <p role="alert" className="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">{storageError}</p>}
      <Toast {...toastProps} />
      {/*
        照護對象只有房卡一種呈現。
        ⚠️ 原本有「卡片／清單」切換（careViewStore＋CareSubjectTable），同一份資料
        兩種版面、兩段 JSX 要同步維護。客戶（老闆）表示「同樣的資料不需要太多種
        呈現方式」，2026-10-21 移除清單，保留房卡——顏色與房號是現場既有語彙。
      */}
      {hasActive ? <>
        {pending && <section ref={confirmation} className="mb-6 space-y-3 rounded-xl border border-amber-300 bg-amber-50 p-4" aria-label="頁內操作確認" data-no-print>
          <h3 className="font-semibold">{closeTarget ? `關閉 ${closingLabel}的所有表單` : deleteTarget ? "刪除已簽出紀錄" : ({ complete: "確認完成簽出", all: "保留草稿並關閉全部表單", unlock: "切換編輯對象", authorize: "逾期回補授權", workorder: "建立示範工單" })[pending as "complete" | "all" | "unlock" | "authorize" | "workorder"]}</h3>
          <p className="text-sm">{pending === "complete" ? (document.editingEntryId ? `請確認 ${identity(subject)} 的修改內容。儲存後會覆蓋原紀錄，並在該筆留下修改者與時間。` : `請確認 ${identity(subject)} 的資料無誤。簽出後保留本筆紀錄，後續請新增一筆。`) : pending === "unlock" ? "切換後其他對象改為唯讀，原有草稿會保留。" : closeTarget ? "可保留草稿後關閉這一間，或捨棄這間尚未簽出的草稿。" : deleteTarget ? `將刪除 ${deletingEntry ? taipeiTimestamp(deletingEntry.at) : "這一筆"} 的紀錄，刪除原因會寫入操作歷程。` : "這項操作會保留目前操作者與時間。"}</p>
          {(deleteTarget || (typeof pending === "string" && ["authorize", "workorder"].includes(pending))) && <label className="block text-sm">{pending === "authorize" ? "授權原因（必填）" : deleteTarget ? "刪除原因（必填）" : "工單內容（必填）"}<textarea className={`${inputClass} mt-2`} value={reason} onChange={(event) => setReason(event.target.value)} /></label>}
          <div className="flex flex-wrap gap-2"><button type="button" className={buttonClass} onClick={() => setPending(null)}>取消</button>
            {closeTarget && <button type="button" className={buttonClass} onClick={() => run(() => careActions.closeSubject(closeTarget.subjectId, true), "已捨棄這間的草稿並關閉。")}>捨棄並關閉</button>}
            <button type="button" className={buttonClass} onClick={() => run(() => {
              if (pending === "complete") careActions.complete(document.key);
              if (closeTarget) { if (editable && !document.signedAt) careActions.save(document.key); careActions.closeSubject(closeTarget.subjectId); }
              if (deleteTarget) careActions.deleteEntry(deleteTarget.entryId, reason);
              if (pending === "all") careActions.closeAll(kind);
              if (pending === "unlock") careActions.unlock(document.key);
              if (pending === "authorize") careActions.authorize(subject.id, reason);
              if (pending === "workorder") careActions.workOrder(document.key, reason);
            }, "操作完成，資料與歷程已更新。")}>{closeTarget ? "保留草稿並關閉" : deleteTarget ? "確認刪除" : "確認"}</button>
          </div>
        </section>}
        <div className={styles.layout}>
          <article className={`${styles.form} work-surface min-w-0 p-4 sm:p-6`}>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-xl font-semibold">{form.label}</h2>
              <button type="button" className={buttonStyles({ size: "sm" })} data-no-print onClick={() => setBlankSheet((value) => !value)}>{blankSheet ? "回到填寫畫面" : "列印空白表格"}</button>
            </div>
            {blankSheet && <section className="mb-6 space-y-4 rounded-xl border border-stone-300 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-semibold">{form.label}（空白表格）</h3>
                <button type="button" className={buttonStyles({ size: "sm" })} data-no-print onClick={() => window.print()}>列印</button>
              </div>
              <p className="text-sm text-stone-600">房號／姓名／病歷號：____________________　日期：__________</p>
              {form.sections.map((section) => <div key={section.label} className="space-y-2">
                <h4 className="font-medium">{section.label}</h4>
                <dl className="grid gap-3 sm:grid-cols-2">{section.fields.map((field) => <div key={field.key} className="flex items-end gap-2 text-sm"><dt className="shrink-0 text-stone-600">{field.label}</dt><dd className="min-w-16 flex-1 border-b border-dotted border-stone-400">&nbsp;</dd></div>)}</dl>
              </div>)}
              <p className="text-sm text-stone-600">護理人員簽章：____________________</p>
            </section>}
            <p className="mb-4 text-sm text-stone-600">{document.savedAt ? `${document.dirty ? "有未完成暫存的修改｜" : ""}儲存 ${taipeiTimestamp(document.savedAt)}｜${document.author}` : "尚未暫存；欄位變更會保留於本機草稿。"}</p>
            {document.editingEntryId && <p role="status" className="mb-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">正在修改一筆已簽出的紀錄：完成後請重新簽名並簽出，系統會覆蓋原紀錄並記下修改者與時間。想保留原紀錄請改用「新增一筆」。</p>}
            {form.sections.length > 1 && <nav aria-label="表單區段" className={styles.sectionNav} data-no-print>{form.sections.map((section, index) => <button type="button" key={section.label} aria-label={section.label} aria-pressed={index === sectionIndex} className={buttonStyles({ selected: index === sectionIndex })} onClick={() => setSectionIndex(index)}><span className={styles.sectionNo} aria-hidden="true">{index + 1}</span>{section.label}</button>)}</nav>}
            {form.key === "growth" && <div className="mb-6"><h3 className="mb-3 font-medium">體重趨勢</h3><GrowthChart points={history.filter((entry) => Number(entry.values.weight) > 0).slice(0, 8).reverse().map((entry) => ({ date: valueText(entry.values.date), weight: Number(entry.values.weight) }))} /></div>}
            {form.key === "mood" && moodNeedsAttention(document.values) && <p role="status" className="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">達 v24 示範關注門檻，請記錄後續處理。此為護理長提醒情境，未發送通知。</p>}
            <fieldset disabled={!editable} className="space-y-5">
              <legend className="sr-only">{form.label}欄位</legend>
              {form.sections.map((section, index) => <section key={section.label} className={index !== Math.min(sectionIndex, form.sections.length - 1) ? styles.hiddenSection : ""}><h3 className="mb-4 font-medium">{section.label}</h3><CareFieldGroups key={`${document.key}-${section.label}`} formKey={form.key} fields={section.fields} values={document.values} onChange={(patch) => run(() => careActions.change(document.key, patch))} personal={data.personalPhrases[role] ?? []} addPhrase={(value) => run(() => careActions.addPhrase(value), "已加入目前角色的常用語。")} /></section>)}
              {form.key === "feeding" && needsFeedingReassessment(document.values) && <section className="space-y-3 rounded-lg border border-amber-300 bg-amber-50 p-4"><h3 className="font-semibold">媽媽護理紀錄（再評估）</h3><p className="text-sm">{subject.motherName}｜請於此直接補充評估與處理內容。</p><CareFieldInput field={{ key: "reassessmentNote", label: "再評估護理紀錄", type: "textarea", required: true }} values={document.values} onChange={(patch) => run(() => careActions.change(document.key, patch))} personal={data.personalPhrases[role] ?? []} addPhrase={(value) => run(() => careActions.addPhrase(value))} /></section>}
            </fieldset>
            {form.signature && <div className="mt-6 space-y-3"><h3 className="font-medium">本筆簽名與員工署名</h3><p className="text-sm text-stone-600">對象：{identity(subject)}。簽出時記錄實際操作者；此為靜態原型簽名。</p>

              {form.key === "guidance" ? <div className="grid gap-3 sm:grid-cols-3">{signatureRoles.map((roleItem) => <section key={roleItem.key} className="rounded-lg border border-stone-200 p-3"><h4 className="text-sm font-medium">{roleItem.label}</h4>{document.signatures?.[roleItem.key] ? <img src={document.signatures[roleItem.key]} alt={roleItem.label} className={styles.signedImage} /> : <p className="my-3 text-xs text-stone-500">尚未簽名</p>}{editable && !signing && <button type="button" className={buttonStyles({ size: "sm" })} onClick={() => { setSigningRole(roleItem.key); setSigning(true); }}>簽署{roleItem.label}</button>}</section>)}</div> : <>{document.signature && <img src={document.signature} alt={`${subject.name}本筆簽名`} className={styles.signedImage} />}{editable && !signing && <button type="button" className={buttonClass} onClick={() => { setSigningRole("recipient"); setSigning(true); }}>確認對象並簽名</button>}</>}
              {editable && !signing && <button type="button" className={`${buttonClass} ml-2`} onClick={() => run(() => careActions.carryContractSignature(document.key), "已確認同一案件媽媽，帶入合約簽名。")}>
                帶入本案合約媽媽簽名
              </button>}
              {editable && !signing && <button type="button" className={buttonClass} onClick={() => run(() => careActions.carrySubjectSignature(document.key), "已確認相同照護對象，帶入上一筆媽媽簽名。")}>帶入此對象上一筆簽名</button>}
              <p className="text-sm text-stone-600">完成簽出時加蓋實際操作者員工印章及時間。</p>
              {editable && signing && <CareSignature identity={`${identity(subject)}｜${form.key === "guidance" ? signatureRoles.find((item) => item.key === signingRole)?.label : "媽媽本人"}`} onCancel={() => setSigning(false)} onConfirm={(image) => { if (run(() => form.key === "guidance" ? careActions.signRole(document.key, signingRole, image) : careActions.sign(document.key, image), "已保存此個案本筆簽名。")) setSigning(false); }} />}
            </div>}
            {document.staffStamp && <p className="mt-4 text-sm">員工印章：{document.staffStamp.author}｜{taipeiTimestamp(document.staffStamp.at)}</p>}
            <ActionDock title={document.signedAt ? "本筆紀錄已簽出" : "完成本筆照護紀錄"} description={document.signedAt ? `簽出 ${taipeiTimestamp(document.signedAt)}` : completionErrors[0] ?? "必要欄位已完成，可確認簽出。"}>
              <button type="button" disabled={!editable} onClick={() => run(() => careActions.carryLast(document.key), "已帶入同個案上一筆；日期時間已更新，簽名不帶入。")} className={buttonClass}>帶入上一筆</button>
              <button type="button" disabled={!editable} onClick={() => run(() => careActions.save(document.key), "已暫存，可關閉後從草稿重新開啟。")} className={buttonClass}><Save size={16} />暫存</button>
              <button type="button" disabled={!editable} onClick={() => setPending("complete")} className={buttonStyles({ selected: true })}><Check size={16} />完成簽出</button>
              {permitted && document.signedAt && <button type="button" className={buttonClass} onClick={() => { setSigning(false); run(() => careActions.newEntry(document.key), "已新增空白紀錄，歷史簽出仍保留。"); }}>新增一筆</button>}
              {kind === "mama" && form.key === "ongoing" && <button type="button" disabled={!editable} className={buttonClass} onClick={() => setPending("workorder")}>開立工單</button>}
              <button type="button" className={buttonClass} onClick={() => window.print()}><Printer size={16} />列印本頁</button>
            </ActionDock>
            <section className="mt-8 border-t border-stone-200 pt-5"><h3 className="mb-3 font-semibold">已簽出紀錄（{history.length}）</h3>{permitted && !!history.length && <p className="mb-3 text-xs text-stone-600">每一筆都可以再次修改或刪除；修改後需重新簽名簽出，系統會記下修改者與時間。</p>}{!history.length && <div className="rounded-lg border border-dashed border-stone-300 bg-stone-50 p-4"><p className="text-sm font-medium">匿名示範歷程</p><p className="mt-1 text-xs text-stone-500">正式簽出後會改列實際操作者、日期、內容與簽名。</p><div className="mt-3 overflow-x-auto"><table className="w-full min-w-[440px] text-left text-sm"><thead><tr><th className="p-2">日期</th><th className="p-2">狀態</th><th className="p-2">摘要</th><th className="p-2">記錄人</th></tr></thead><tbody><tr className="border-t border-stone-200"><td className="p-2">2026-10-16</td><td className="p-2">已完成</td><td className="p-2">例行紀錄正常</td><td className="p-2">示範護理師</td></tr><tr className="border-t border-stone-200"><td className="p-2">2026-10-15</td><td className="p-2">已完成</td><td className="p-2">持續觀察，無異常</td><td className="p-2">示範護理師</td></tr></tbody></table></div></div>}{history.map((entry) => <details key={entry.id} className="border-b border-stone-200 py-3"><summary className="min-h-12 cursor-pointer text-sm">{taipeiTimestamp(entry.at)}｜{entry.author}{entry.historical ? "｜退房回補" : ""}</summary><dl className="mt-3 grid gap-3 sm:grid-cols-2">{Object.entries(entry.values).filter(([key, value]) => key !== "photo" && valueText(value)).map(([key, value]) => <div key={key}><dt className="text-xs text-stone-500">{form.sections.flatMap((section) => section.fields).find((field) => field.key === key)?.label ?? (key === "reassessmentNote" ? "媽媽護理紀錄（再評估）" : key)}</dt><dd className="mt-1 whitespace-pre-wrap break-words text-sm">{valueText(value)}</dd></div>)}</dl>{valueText(entry.values.photo) && <LocalMedia key={valueText(entry.values.photo)} id={valueText(entry.values.photo)} alt="此筆歷史紀錄的本機照片" className="mt-3 max-h-64 max-w-full object-contain" />}{entry.signatures && Object.entries(entry.signatures).map(([roleKey, image]) => <div key={roleKey} className="mt-3"><p className="text-xs text-stone-500">{signatureRoles.find((item) => item.key === roleKey)?.label}</p><img src={image} alt={signatureRoles.find((item) => item.key === roleKey)?.label ?? "此筆簽名"} className={styles.signedImage} /></div>)}{entry.signature && !entry.signatures?.recipient && <img src={entry.signature} alt="此筆歷史媽媽簽名" className={styles.signedImage} />}{entry.staffStamp && <p className="mt-3 text-sm">員工印章：{entry.staffStamp.author}｜{taipeiTimestamp(entry.staffStamp.at)}</p>}{entry.revisions?.map((revision, index) => <p key={`${entry.id}-rev-${index}`} className="mt-2 text-xs text-amber-800">修改紀錄：{taipeiTimestamp(revision.at)}｜{revision.author}｜{revision.note}</p>)}{permitted && <div className="mt-3 flex flex-wrap gap-2" data-no-print><button type="button" className={buttonStyles({ size: "sm" })} onClick={() => run(() => careActions.editEntry(entry.id), "已載入這筆紀錄，修改後請重新簽名並簽出。")}>修改這筆</button><button type="button" className={buttonStyles({ size: "sm" })} onClick={() => { setReason(""); setPending({ kind: "delete-entry", entryId: entry.id }); }}>刪除這筆</button></div>}</details>)}</section>
          </article>
          <aside className={`${styles.sidebar} space-y-6`} data-no-print>
            {/* ⚠️「此對象的其他表單」已移到頁首的分組列（作用中那一組會列出未開啟的表單）。
                不要加回來：同一批東西出現兩次，而且右側欄在長表單捲到一半時看不到。 */}
            <section><h3 className="mb-3 font-semibold">同案件媽媽／寶寶</h3><div className="space-y-3">{domain.subjects.filter((item) => item.caseId === subject.caseId && item.id !== subject.id && !item.historical).map((item) => <div key={item.id} className="rounded-lg border border-stone-200 p-3"><p className="text-sm font-medium">{item.kind === "mama" ? "媽媽" : "寶寶"}：{item.name}</p><div className="mt-2 flex flex-wrap gap-2">{careForms(item.kind, configured).filter((itemForm) => canViewCare(role, item.kind, itemForm.key)).map((itemForm) => item.kind === kind ? <button type="button" key={itemForm.key} className={buttonStyles({ size: "sm" })} onClick={() => open(item.id, itemForm.key)}>{itemForm.label}</button> : <Link key={itemForm.key} className={buttonStyles({ size: "sm" })} href={`/${item.kind}/?subject=${encodeURIComponent(item.id)}&form=${encodeURIComponent(itemForm.key)}`}>{itemForm.label}</Link>)}</div></div>)}</div></section>
            <section><h3 className="mb-3 font-semibold">最近操作歷程</h3><ol className="space-y-3 text-sm">{data.events.filter((event) => event.subjectId === subject.id).slice(0, 6).map((event) => <li key={event.id}><p>{event.action}</p><p className="mt-1 text-xs text-stone-600">{taipeiTimestamp(event.at)}<br />{event.author}</p></li>)}</ol></section>
          </aside>
        </div>
      </> : <>
        <p className="mb-5 text-sm leading-6 text-stone-600">直接選擇房卡上的表單，於完整頁面填寫。草稿、編輯鎖與已簽出紀錄會保留於本機瀏覽器。</p>
        <div className="task-filter mb-5 flex flex-wrap gap-3" data-no-print><label className="min-w-0 flex-1"><span className="sr-only">搜尋照護對象</span><input className={inputClass} placeholder="搜尋房號、車號、姓名、病歷號" value={query} onChange={(event) => setQuery(event.target.value)} /></label><div className="flex flex-wrap gap-2">{["在館", "托嬰", "退房回補"].map((status) => <button type="button" key={status} aria-pressed={filter === status} className={buttonStyles({ selected: filter === status })} onClick={() => setFilter(status)}>{status}</button>)}</div></div>
        {drafts.length > 0 && <section className="mb-6 rounded-xl border border-stone-200 p-4"><h2 className="mb-3 flex items-center gap-2 font-semibold"><FileText size={18} />暫存中表單（{drafts.length}）</h2><div className="flex flex-wrap gap-2">{drafts.map((item) => { const target = subjectFor(item.subjectId)!; return <button type="button" key={item.key} className={buttonClass} onClick={() => open(target.id, item.formKey)}>{target.name}｜{forms.find((available) => available.key === item.formKey)?.label ?? item.formKey}</button>; })}</div></section>}
        {canAuthorizeCare(role) && <label className="mb-4 flex flex-wrap items-center gap-3 text-sm" data-no-print>退房回補天數（示範設定）<input aria-label="退房回補天數" type="number" min={0} max={30} className={`${inputClass} !w-24`} value={data.backfillDays} onChange={(event) => run(() => careActions.backfillDays(Number(event.target.value)), "已更新回補期限，所有照護對象同步。")} /></label>}
        <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-stone-600"><span>綠色：入住</span><span>粉色：親子同室</span><span>托嬰以車號識別</span><span>退房回補 {data.backfillDays} 天（示範設定）</span><span className="ml-auto">{subjects.length} 位</span></div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">{subjects.map((item) => <section key={item.id} data-status={item.historical ? "退房回補" : item.status} className={`${styles.subjectCard} min-w-0 rounded-xl border p-4`}>
          <div className="flex items-center justify-between gap-2"><h2 className="text-lg font-semibold">{item.room ? `房 ${item.room}` : `車 ${item.carNo || "待指派"}`}</h2><span className={`${styles.status} text-xs`}>{item.status}</span></div><p className="mt-2 font-medium">{item.name}</p>{kind === "baby" && <p className="mt-1 break-words text-xs text-stone-600">{item.motherName}{item.room && item.carNo ? `｜車號 ${item.carNo}` : ""}{!item.room && item.previousRoom ? `｜原 ${item.previousRoom} 房` : ""}</p>}<p className="mt-1 break-words text-xs text-stone-600">{item.chartNo}｜第 {item.stayDay} 天</p>{item.historical && <p className="mt-2 text-xs text-amber-900">可補至 {taipeiTimestamp(backfillDeadline(item, data.backfillDays)!)}{expiryHint(item)}</p>}
          <div className="mt-4 grid grid-cols-2 gap-2">{forms.map((itemForm) => <button type="button" key={itemForm.key} onClick={() => open(item.id, itemForm.key)} className={buttonStyles({ size: "sm" })}>{itemForm.label}</button>)}</div>
        </section>)}</div>
        {backfillSubjects.length > 0 && <section className="mt-9"><div className="mb-4 flex flex-wrap items-center justify-between gap-2"><h2 className="text-xl font-semibold">退房回補</h2><span className="rounded-full bg-amber-100 px-3 py-1 text-xs text-amber-900">退房日起 {data.backfillDays} 天內（當日 23:59 截止），逾期僅護理長／管理者可補或授權</span></div><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">{backfillSubjects.map((item) => <section key={item.id} data-status="退房回補" className={`${styles.subjectCard} min-w-0 rounded-xl border p-4`}><div className="flex items-center justify-between gap-2"><h3 className="font-semibold">房 {item.room}</h3><span className={`${styles.status} text-xs`}>退房回補</span></div><p className="mt-2 font-medium">{item.name}</p><p className="mt-1 text-xs text-stone-600">{item.chartNo}｜退房 {taipeiTimestamp(item.dischargedAt!)}</p><p className="mt-2 text-xs text-amber-900">可補至 {taipeiTimestamp(backfillDeadline(item, data.backfillDays)!)}{expiryHint(item)}</p><div className="mt-4 grid grid-cols-2 gap-2">{forms.map((itemForm) => <button type="button" key={itemForm.key} onClick={() => open(item.id, itemForm.key)} className={buttonStyles({ size: "sm" })}>{itemForm.label}</button>)}</div></section>)}</div></section>}
        {!subjects.length && <p className="rounded-lg border border-dashed border-stone-300 p-8 text-center text-sm text-stone-600">沒有符合條件的照護對象，請調整搜尋或篩選。</p>}
      </>}
      {/*
        導覽第 3 層，兩行（依客戶指定，參考 santinov1 的視窗式工作列）：

          行 1：目前這位對象的**全部**表單頁籤——六張（寶寶八張）固定都在，
                沒開過的點一下就開，不再分「已開／未開」兩種樣子。
          行 2：開啟中的房間，切房間、單間關閉、全部關閉。

        ⚠️ 關閉的單位是**房間**不是單張表單：表單是這間房的頁籤，
        關掉其中一張沒有意義（santinov1 也沒有這個動作）。
        ⚠️ 兩行都留在頁首，不要搬回頁面底部：客戶回報過「放最下面很容易被忽略」。
        鎖定／解鎖在頁首列本身（對象識別列），不在這裡。
      */}
      {hasActive && subject && (
        <HeaderSlot>
          <nav aria-label="此對象的照護表單" className={styles.tray} data-no-print>
            <div className={styles.trayScroll}>
              <button type="button" title="回照護列表" className={buttonStyles({ size: "sm" })} onClick={() => { setListVisible(true); setSigning(false); }}><ArrowLeft size={14} />回列表</button>
              <span className={styles.trayDivider} aria-hidden="true" />
              {forms.map((item) => {
                const key = documentKey(subject.id, item.key);
                const opened = openDocuments.find((entry) => entry.key === key);
                const state = opened?.signedAt ? " ✓" : opened?.dirty ? " · 草稿" : "";
                return (
                  <button
                    key={item.key}
                    type="button"
                    aria-pressed={key === activeKey && !listVisible}
                    title={`${identity(subject)}｜${item.label}`}
                    className={buttonStyles({ size: "sm", selected: key === activeKey && !listVisible })}
                    onClick={() => { setSigning(false); setLastFormBySubject((current) => ({ ...current, [subject.id]: key })); if (opened) run(() => careActions.activate(key)); else open(subject.id, item.key); }}
                  >
                    {item.label}{state}
                  </button>
                );
              })}
            </div>
          </nav>
        </HeaderSlot>
      )}
      {openDocuments.length > 0 && (
        <HeaderSlot>
          <nav aria-label="開啟中的照護對象" className={styles.roomBar} data-no-print>
            <span className={styles.roomBarLabel}>開啟中 {trayGroups.length}</span>
            <div className={styles.trayScroll}>
              {trayGroups.map(({ target, items }) => {
                const place = target.room || target.carNo || target.name;
                const current = items.some((item) => item.key === activeKey) && !listVisible;
                const draft = items.some((item) => item.dirty && !item.signedAt);
                // 鎖頭在房號左邊（v24 的作法）：一眼看出同時開著的幾間裡，哪一間是可以編輯的。
                const unlocked = data.unlockedCase === target.caseId;
                return (
                  <span key={target.id} data-active={current} className={styles.roomChip}>
                    <button
                      type="button"
                      aria-pressed={current}
                      title={`切換到 ${place} ${target.name}（開啟 ${items.length} 張，${unlocked ? "編輯中" : "唯讀"}）`}
                      className={styles.roomChipMain}
                      onClick={() => {
                        setSigning(false);
                        setListVisible(false);
                        // 回到這間房上次看的那張表單；沒記錄就用最近開的那張。
                        const back = items.find((item) => item.key === lastFormBySubject[target.id]) ?? items[items.length - 1];
                        run(() => careActions.activate(back.key));
                      }}
                    >
                      {unlocked
                        ? <UnlockKeyhole className={styles.roomChipLock} data-state="open" size={14} strokeWidth={2.5} aria-label="編輯中" />
                        : <LockKeyhole className={styles.roomChipLock} data-state="closed" size={14} strokeWidth={2.5} aria-label="唯讀" />}
                      {place}｜{target.name}
                      {draft && <em className={styles.roomChipDraft} title="有未簽出的草稿" aria-label="有未簽出的草稿" />}
                    </button>
                    <button
                      type="button"
                      title={`關閉 ${place} ${target.name} 的所有表單`}
                      aria-label={`關閉 ${place} ${target.name}`}
                      className={styles.roomChipClose}
                      onClick={() => setPending({ kind: "close-subject", subjectId: target.id })}
                    >
                      <X size={13} />
                    </button>
                  </span>
                );
              })}
            </div>
            <button type="button" className={buttonStyles({ size: "sm" })} title="保留草稿並關閉全部" onClick={() => { if (hasActive) setPending("all"); else run(() => careActions.closeAll(kind), "已保留草稿並關閉全部表單。"); }}>全部關閉</button>
          </nav>
        </HeaderSlot>
      )}
      {/*
        目前對象的識別列，放進頁首列本身（標題與角色切換之間）。

        原本是頁面內一張卡片會跟著內容捲走，先搬到表單列下方自成一列，客戶再要求
        併進頁首——省掉一整列固定高度，表單可視範圍多出約 40px。
        窄螢幕放不下時，AppShell 的插槽會讓它自動掉到頁首第二行。

        ⚠️ 房號／姓名／病歷號與狀態壓成同一行。原本拆成兩行，而第二行開頭又是
        一次 motherName——對媽媽而言跟第一行的姓名完全重複。寶寶才需要另外標出
        媽媽是誰，所以只有名字不同時才補「媽媽 ○○○」。
      */}
      {hasActive && subject && document && (
        <HeaderSlot slot="inline">
          <div className={styles.subjectBar}>
            <p className={styles.subjectBarText}>
              <strong className="font-semibold text-stone-800">{identity(subject)}</strong>
              <span>｜{subjectSummary(subject)}</span>
              {subject.historical && <span className="text-amber-800">｜退房回補 {taipeiTimestamp(subject.dischargedAt!)}｜可補至 {taipeiTimestamp(backfillDeadline(subject, data.backfillDays)!)}{expired ? (blocked ? "｜已逾期，需主管授權" : "｜已逾期（主管補登）") : ""}</span>}
            </p>
            <div className={styles.subjectBarActions} data-no-print>
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-stone-100 px-2.5 py-1 text-xs text-stone-600">{editable ? <UnlockKeyhole size={14} /> : <LockKeyhole size={14} />}{document.signedAt ? "已完成簽出" : editable ? "編輯中" : "唯讀"}</span>
              {permitted && !document.signedAt && data.unlockedCase !== subject.caseId && <button type="button" className={buttonStyles({ size: "sm" })} onClick={() => setPending("unlock")}>解鎖此對象</button>}
              {expired && canAuthorizeCare(role) && !data.authorizations[subject.id] && <button type="button" className={buttonStyles({ size: "sm" })} onClick={() => setPending("authorize")}>授權回補</button>}
            </div>
          </div>
        </HeaderSlot>
      )}
    </RequireAccess>
  </div>;
}
