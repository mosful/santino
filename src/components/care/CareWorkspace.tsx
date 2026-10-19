"use client";
/* 本機簽名與照片直接使用 data／Blob URL，不經伺服器圖片服務。 */
/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { ArrowLeft, Check, FileText, LockKeyhole, Printer, Save, UnlockKeyhole, X } from "lucide-react";
import RequireAccess from "@/components/ui/RequireAccess";
import PageHeader from "@/components/ui/PageHeader";
import { useCurrentRole } from "@/lib/roleStore";
import { careForms } from "@/lib/care/forms";
import { careSubject } from "@/lib/care/subjects";
import { useDomainStore } from "@/lib/demo/domainStore";
import { careActions, careStore, useCareStore } from "@/lib/care/store";
import { useAssessmentFields } from "@/lib/assessmentConfigStore";
import { backfillDeadline, canAuthorizeCare, canEditCare, canViewCare, isBackfillExpired, moodNeedsAttention, needsFeedingReassessment, taipeiTimestamp } from "@/lib/care/rules";
import type { CareKind, CareSignatureRole, CareSubject } from "@/lib/care/types";
import CareFieldInput, { GrowthChart, buttonClass, inputClass, valueText } from "./CareFields";
import CareSignature from "./CareSignature";
import styles from "./CareWorkspace.module.css";
import LocalMedia from "../babycam/LocalMedia";

function identity(subject: CareSubject) { const location = subject.room ? `房號 ${subject.room}${subject.carNo ? `｜車號 ${subject.carNo}` : ""}` : `車號 ${subject.carNo || "待指派"}`; return `${location}｜${subject.name}｜${subject.chartNo}`; }
const signatureRoles: { key: CareSignatureRole; label: string }[] = [{ key: "recipient", label: "媽媽／家屬簽名" }, { key: "executor", label: "執行者簽名" }, { key: "evaluator", label: "評值者簽名" }];
const hydrationSubscribe = () => () => {};

export default function CareWorkspace({ kind }: { kind: CareKind }) {
  const role = useCurrentRole();
  const { data, storageError } = useCareStore();
  const { data: domain } = useDomainStore();
  const subjectFor = (id: string) => domain.subjects.find((item) => item.id === id);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("在館");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState<"complete" | "close" | "all" | "unlock" | "authorize" | "workorder" | null>(null);
  const [reason, setReason] = useState("");
  const [signing, setSigning] = useState(false);
  const [signingRole, setSigningRole] = useState<CareSignatureRole>("recipient");
  const [listVisible, setListVisible] = useState(false);
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
  const expired = subject ? isBackfillExpired(subject, data.backfillDays) && !data.authorizations[subject.id] : false;
  const permitted = !!subject && !!document && canEditCare(role, kind, document.formKey);
  const editable = permitted && data.unlockedCase === subject?.caseId && !expired && !document?.signedAt;
  const openDocuments = data.open.map((key) => data.documents[key]).filter((item) => subjectFor(item.subjectId)?.kind === kind);
  const drafts = Object.values(data.documents).filter((item) => !item.signedAt && (item.savedAt || item.dirty) && subjectFor(item.subjectId)?.kind === kind && forms.some((available) => available.key === item.formKey));
  const history = data.entries.filter((entry) => entry.subjectId === subject?.id && entry.formKey === document?.formKey);
  const searchedSubjects = domain.subjects.filter((item) => item.kind === kind).filter((item) => [item.name, item.motherName, item.room, item.carNo, item.chartNo].join(" ").toLowerCase().includes(query.toLowerCase()));
  const subjects = searchedSubjects.filter((item) => filter === "退房回補" ? item.historical : filter === "托嬰" ? !item.historical && item.status === "托嬰" : !item.historical);
  const backfillSubjects = filter === "在館" ? searchedSubjects.filter((item) => item.historical) : [];
  const allDrafts = Object.values(data.documents).filter((item) => !item.signedAt && (item.savedAt || item.dirty)).length;
  const lockedSubject = domain.subjects.find((item) => item.caseId === data.unlockedCase);

  function run(action: () => void, success = "") {
    try { action(); setMessage(success); setPending(null); setReason(""); return true; }
    catch (error) { setMessage(error instanceof Error ? error.message : "操作失敗，請重試。"); return false; }
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
      catch (error) { setMessage(error instanceof Error ? error.message : "無法開啟指定照護表單。"); }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [kind]);
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
    const listener = () => { careActions.switchRole(); setSigning(false); setPending(null); setListVisible(false); setMessage("已切換角色，開啟中的表單及編輯鎖已釋放；草稿仍保留。"); };
    window.addEventListener("santino-role-changed", listener);
    return () => window.removeEventListener("santino-role-changed", listener);
  }, []);
  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => { if (Object.values(data.documents).some((item) => item.dirty)) event.preventDefault(); };
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [data.documents]);

  if (!hydrated) return <div className="page-frame"><div className="h-16 animate-pulse rounded-xl bg-white/70" aria-label="照護工作區載入中" /></div>;

  return <div className={`${styles.workspace} page-frame`}>
    <RequireAccess moduleNo={kind === "mama" ? "2" : "3"}>
      <PageHeader title={kind === "mama" ? "2. 媽媽照護" : "3. 寶寶照護"} moduleNo={kind === "mama" ? "2" : "3"} />
      {storageError && <p role="alert" className="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">{storageError}</p>}
      {message && <div role="status" className="mb-4 whitespace-pre-line rounded-lg border border-stone-300 bg-stone-50 p-3 text-sm">{message}</div>}
      {hasActive ? <>
        <div className="mb-4 flex flex-wrap gap-2" data-no-print>
          <button type="button" className={buttonClass} onClick={() => { setListVisible(true); setSigning(false); }}><ArrowLeft size={16} />回照護列表</button>
          <button type="button" className={buttonClass} onClick={() => setPending("close")}><X size={16} />關閉此表單</button>
        </div>
        <header className="mb-6 flex flex-wrap items-start justify-between gap-4 rounded-xl border border-stone-300 bg-white p-4">
          <div><h2 className="text-xl font-semibold">{identity(subject)}</h2><p className="mt-2 text-sm text-stone-600">{subject.motherName}｜{subject.status}｜入住第 {subject.stayDay} 天{subject.gender ? `｜${subject.gender}寶寶` : ""}</p>
            {subject.historical && <p className="mt-2 text-sm text-amber-900">退房回補｜退房 {taipeiTimestamp(subject.dischargedAt!)}｜可補至 {taipeiTimestamp(backfillDeadline(subject, data.backfillDays)!)}{expired ? "｜已逾期" : ""}</p>}
          </div>
          <div className="flex flex-wrap gap-2" data-no-print><span className="flex min-h-12 items-center gap-2 rounded-lg bg-stone-100 px-3 text-sm">{editable ? <UnlockKeyhole size={16} /> : <LockKeyhole size={16} />}{document.signedAt ? "已完成簽出" : editable ? "編輯中" : "唯讀"}</span>
            {permitted && !document.signedAt && data.unlockedCase !== subject.caseId && <button type="button" className={buttonClass} onClick={() => setPending("unlock")}>解鎖此對象</button>}
            {expired && canAuthorizeCare(role) && <button type="button" className={buttonClass} onClick={() => setPending("authorize")}>授權回補</button>}
          </div>
        </header>
        {pending && <section ref={confirmation} className="mb-6 space-y-3 rounded-xl border border-amber-300 bg-amber-50 p-4" aria-label="頁內操作確認" data-no-print>
          <h3 className="font-semibold">{({ complete: "確認完成簽出", close: "關閉此表單", all: "保留草稿並關閉全部表單", unlock: "切換編輯對象", authorize: "逾期回補授權", workorder: "建立示範工單" })[pending]}</h3>
          <p className="text-sm">{pending === "complete" ? `請確認 ${identity(subject)} 的資料無誤。簽出後保留本筆紀錄，後續請新增一筆。` : pending === "unlock" ? "切換後其他對象改為唯讀，原有草稿會保留。" : pending === "close" ? "可保留草稿後關閉，或捨棄目前尚未簽出的草稿。" : "這項操作會保留目前操作者與時間。"}</p>
          {["authorize", "workorder"].includes(pending) && <label className="block text-sm">{pending === "authorize" ? "授權原因（必填）" : "工單內容（必填）"}<textarea className={`${inputClass} mt-2`} value={reason} onChange={(event) => setReason(event.target.value)} /></label>}
          <div className="flex flex-wrap gap-2"><button type="button" className={buttonClass} onClick={() => setPending(null)}>取消</button>
            {pending === "close" && !document.signedAt && <button type="button" className={buttonClass} onClick={() => run(() => careActions.close(document.key, true), "已捨棄本筆草稿並關閉。")}>捨棄並關閉</button>}
            <button type="button" className={buttonClass} onClick={() => run(() => {
              if (pending === "complete") careActions.complete(document.key);
              if (pending === "close") { if (editable && !document.signedAt) careActions.save(document.key); careActions.close(document.key); }
              if (pending === "all") careActions.closeAll(kind);
              if (pending === "unlock") careActions.unlock(document.key);
              if (pending === "authorize") careActions.authorize(subject.id, reason);
              if (pending === "workorder") careActions.workOrder(document.key, reason);
            }, "操作完成，資料與歷程已更新。")}>{pending === "close" ? "保留草稿並關閉" : "確認"}</button>
          </div>
        </section>}
        <div className={styles.layout}>
          <article className={`${styles.form} min-w-0 rounded-xl border border-stone-200 bg-white p-4 sm:p-6`}>
            <h2 className="mb-4 text-xl font-semibold">{form.label}</h2>
            <p className="mb-4 text-sm text-stone-600">{document.savedAt ? `${document.dirty ? "有未完成暫存的修改｜" : ""}儲存 ${taipeiTimestamp(document.savedAt)}｜${document.author}` : "尚未暫存；欄位變更會保留於本機草稿。"}</p>
            {form.sections.length > 1 && <nav aria-label="表單區段" className="mb-5 flex flex-wrap gap-2" data-no-print>{form.sections.map((section, index) => <button type="button" key={section.label} aria-pressed={index === sectionIndex} className={`${buttonClass} ${index === sectionIndex ? "!border-stone-800 !bg-stone-800 !text-white" : ""}`} onClick={() => setSectionIndex(index)}>{section.label}</button>)}</nav>}
            {form.key === "growth" && <div className="mb-6"><h3 className="mb-3 font-medium">體重趨勢</h3><GrowthChart points={history.filter((entry) => Number(entry.values.weight) > 0).slice(0, 8).reverse().map((entry) => ({ date: valueText(entry.values.date), weight: Number(entry.values.weight) }))} /></div>}
            {form.key === "mood" && moodNeedsAttention(document.values) && <p role="status" className="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">達 v24 示範關注門檻，請記錄後續處理。此為護理長提醒情境，未發送通知。</p>}
            <fieldset disabled={!editable} className="space-y-5">
              <legend className="sr-only">{form.label}欄位</legend>
              {form.sections.map((section, index) => <section key={section.label} className={index !== Math.min(sectionIndex, form.sections.length - 1) ? styles.hiddenSection : ""}><h3 className="mb-4 font-medium">{section.label}</h3><div className="grid gap-4 sm:grid-cols-2">{section.fields.map((field) => <CareFieldInput key={`${document.key}-${field.key}`} field={field} values={document.values} onChange={(patch) => run(() => careActions.change(document.key, patch))} personal={data.personalPhrases[role] ?? []} addPhrase={(value) => run(() => careActions.addPhrase(value), "已加入目前角色的常用語。")} />)}</div></section>)}
              {form.key === "feeding" && needsFeedingReassessment(document.values) && <section className="space-y-3 rounded-lg border border-amber-300 bg-amber-50 p-4"><h3 className="font-semibold">媽媽護理紀錄（再評估）</h3><p className="text-sm">{subject.motherName}｜請於此直接補充評估與處理內容。</p><CareFieldInput field={{ key: "reassessmentNote", label: "再評估護理紀錄", type: "textarea", required: true }} values={document.values} onChange={(patch) => run(() => careActions.change(document.key, patch))} personal={data.personalPhrases[role] ?? []} addPhrase={(value) => run(() => careActions.addPhrase(value))} /></section>}
            </fieldset>
            {form.signature && <div className="mt-6 space-y-3"><h3 className="font-medium">本筆簽名與員工署名</h3><p className="text-sm text-stone-600">對象：{identity(subject)}。簽出時記錄實際操作者；此為靜態原型簽名。</p>

              {form.key === "guidance" ? <div className="grid gap-3 sm:grid-cols-3">{signatureRoles.map((roleItem) => <section key={roleItem.key} className="rounded-lg border border-stone-200 p-3"><h4 className="text-sm font-medium">{roleItem.label}</h4>{document.signatures?.[roleItem.key] ? <img src={document.signatures[roleItem.key]} alt={roleItem.label} className={styles.signedImage} /> : <p className="my-3 text-xs text-stone-500">尚未簽名</p>}{editable && !signing && <button type="button" className={`${buttonClass} !min-h-10 !px-2 text-xs`} onClick={() => { setSigningRole(roleItem.key); setSigning(true); }}>簽署{roleItem.label}</button>}</section>)}</div> : <>{document.signature && <img src={document.signature} alt={`${subject.name}本筆簽名`} className={styles.signedImage} />}{editable && !signing && <button type="button" className={buttonClass} onClick={() => { setSigningRole("recipient"); setSigning(true); }}>確認對象並簽名</button>}</>}
              {editable && !signing && <button type="button" className={`${buttonClass} ml-2`} onClick={() => run(() => careActions.carryContractSignature(document.key), "已確認同一案件媽媽，帶入合約簽名。")}>
                帶入本案合約媽媽簽名
              </button>}
              {editable && !signing && <button type="button" className={buttonClass} onClick={() => run(() => careActions.carrySubjectSignature(document.key), "已確認相同照護對象，帶入上一筆媽媽簽名。")}>帶入此對象上一筆簽名</button>}
              <p className="text-sm text-stone-600">完成簽出時加蓋實際操作者員工印章及時間。</p>
              {editable && signing && <CareSignature identity={`${identity(subject)}｜${form.key === "guidance" ? signatureRoles.find((item) => item.key === signingRole)?.label : "媽媽本人"}`} onCancel={() => setSigning(false)} onConfirm={(image) => { if (run(() => form.key === "guidance" ? careActions.signRole(document.key, signingRole, image) : careActions.sign(document.key, image), "已保存此個案本筆簽名。")) setSigning(false); }} />}
            </div>}
            {document.staffStamp && <p className="mt-4 text-sm">員工印章：{document.staffStamp.author}｜{taipeiTimestamp(document.staffStamp.at)}</p>}
            <div className="mt-6 flex flex-wrap gap-2 border-t border-stone-200 pt-4" data-no-print>
              <button type="button" disabled={!editable} onClick={() => run(() => careActions.carryLast(document.key), "已帶入同個案上一筆；日期時間已更新，簽名不帶入。")} className={buttonClass}>帶入上一筆</button>
              <button type="button" disabled={!editable} onClick={() => run(() => careActions.save(document.key), "已暫存，可關閉後從草稿重新開啟。")} className={buttonClass}><Save size={16} />暫存</button>
              <button type="button" disabled={!editable} onClick={() => setPending("complete")} className={`${buttonClass} !border-stone-800 !bg-stone-800 !text-white`}><Check size={16} />完成簽出</button>
              {permitted && document.signedAt && <button type="button" className={buttonClass} onClick={() => { setSigning(false); run(() => careActions.newEntry(document.key), "已新增空白紀錄，歷史簽出仍保留。"); }}>新增一筆</button>}
              {kind === "mama" && form.key === "ongoing" && <button type="button" disabled={!editable} className={buttonClass} onClick={() => setPending("workorder")}>開立工單</button>}
              <button type="button" className={buttonClass} onClick={() => window.print()}><Printer size={16} />列印本頁</button>
            </div>
            <section className="mt-8 border-t border-stone-200 pt-5"><h3 className="mb-3 font-semibold">已簽出紀錄（{history.length}）</h3>{!history.length && <div className="rounded-lg border border-dashed border-stone-300 bg-stone-50 p-4"><p className="text-sm font-medium">匿名示範歷程</p><p className="mt-1 text-xs text-stone-500">正式簽出後會改列實際操作者、日期、內容與簽名。</p><div className="mt-3 overflow-x-auto"><table className="w-full min-w-[440px] text-left text-sm"><thead><tr><th className="p-2">日期</th><th className="p-2">狀態</th><th className="p-2">摘要</th><th className="p-2">記錄人</th></tr></thead><tbody><tr className="border-t border-stone-200"><td className="p-2">2026-10-16</td><td className="p-2">已完成</td><td className="p-2">例行紀錄正常</td><td className="p-2">示範護理師</td></tr><tr className="border-t border-stone-200"><td className="p-2">2026-10-15</td><td className="p-2">已完成</td><td className="p-2">持續觀察，無異常</td><td className="p-2">示範護理師</td></tr></tbody></table></div></div>}{history.map((entry) => <details key={entry.id} className="border-b border-stone-200 py-3"><summary className="min-h-12 cursor-pointer text-sm">{taipeiTimestamp(entry.at)}｜{entry.author}{entry.historical ? "｜退房回補" : ""}</summary><dl className="mt-3 grid gap-3 sm:grid-cols-2">{Object.entries(entry.values).filter(([key, value]) => key !== "photo" && valueText(value)).map(([key, value]) => <div key={key}><dt className="text-xs text-stone-500">{form.sections.flatMap((section) => section.fields).find((field) => field.key === key)?.label ?? (key === "reassessmentNote" ? "媽媽護理紀錄（再評估）" : key)}</dt><dd className="mt-1 whitespace-pre-wrap break-words text-sm">{valueText(value)}</dd></div>)}</dl>{valueText(entry.values.photo) && <LocalMedia key={valueText(entry.values.photo)} id={valueText(entry.values.photo)} alt="此筆歷史紀錄的本機照片" className="mt-3 max-h-64 max-w-full object-contain" />}{entry.signatures && Object.entries(entry.signatures).map(([roleKey, image]) => <div key={roleKey} className="mt-3"><p className="text-xs text-stone-500">{signatureRoles.find((item) => item.key === roleKey)?.label}</p><img src={image} alt={signatureRoles.find((item) => item.key === roleKey)?.label ?? "此筆簽名"} className={styles.signedImage} /></div>)}{entry.signature && !entry.signatures?.recipient && <img src={entry.signature} alt="此筆歷史媽媽簽名" className={styles.signedImage} />}{entry.staffStamp && <p className="mt-3 text-sm">員工印章：{entry.staffStamp.author}｜{taipeiTimestamp(entry.staffStamp.at)}</p>}</details>)}</section>
          </article>
          <aside className={`${styles.sidebar} space-y-6`} data-no-print>
            <section><h3 className="mb-3 font-semibold">此對象的其他表單</h3><div className="grid gap-2">{forms.map((item) => <button type="button" key={item.key} className={`${buttonClass} justify-start ${form.key === item.key ? "!bg-stone-100 font-semibold" : ""}`} onClick={() => open(subject.id, item.key)}>{item.label}</button>)}</div></section>
            <section><h3 className="mb-3 font-semibold">同案件媽媽／寶寶</h3><div className="space-y-3">{domain.subjects.filter((item) => item.caseId === subject.caseId && item.id !== subject.id && !item.historical).map((item) => <div key={item.id} className="rounded-lg border border-stone-200 p-3"><p className="text-sm font-medium">{item.kind === "mama" ? "媽媽" : "寶寶"}：{item.name}</p><div className="mt-2 flex flex-wrap gap-2">{careForms(item.kind, configured).filter((itemForm) => canViewCare(role, item.kind, itemForm.key)).map((itemForm) => item.kind === kind ? <button type="button" key={itemForm.key} className={`${buttonClass} !min-h-10 !px-2 text-xs`} onClick={() => open(item.id, itemForm.key)}>{itemForm.label}</button> : <Link key={itemForm.key} className={`${buttonClass} !min-h-10 !px-2 text-xs`} href={`/${item.kind}/?subject=${encodeURIComponent(item.id)}&form=${encodeURIComponent(itemForm.key)}`}>{itemForm.label}</Link>)}</div></div>)}</div></section>
            <section><h3 className="mb-3 font-semibold">最近操作歷程</h3><ol className="space-y-3 text-sm">{data.events.filter((event) => event.subjectId === subject.id).slice(0, 6).map((event) => <li key={event.id}><p>{event.action}</p><p className="mt-1 text-xs text-stone-600">{taipeiTimestamp(event.at)}<br />{event.author}</p></li>)}</ol></section>
          </aside>
        </div>
      </> : <>
        <p className="mb-5 text-sm leading-6 text-stone-600">直接選擇房卡上的表單，於完整頁面填寫。草稿、編輯鎖與已簽出紀錄會保留於本機瀏覽器。</p>
        <div className="mb-5 flex flex-wrap gap-3" data-no-print><label className="min-w-0 flex-1"><span className="sr-only">搜尋照護對象</span><input className={inputClass} placeholder="搜尋房號、車號、姓名、病歷號" value={query} onChange={(event) => setQuery(event.target.value)} /></label><div className="flex flex-wrap gap-2">{["在館", "托嬰", "退房回補"].map((status) => <button type="button" key={status} aria-pressed={filter === status} className={`${buttonClass} ${filter === status ? "!bg-stone-800 !text-white" : ""}`} onClick={() => setFilter(status)}>{status}</button>)}</div></div>
        {drafts.length > 0 && <section className="mb-6 rounded-xl border border-stone-200 p-4"><h2 className="mb-3 flex items-center gap-2 font-semibold"><FileText size={18} />暫存中表單（{drafts.length}）</h2><div className="flex flex-wrap gap-2">{drafts.map((item) => { const target = subjectFor(item.subjectId)!; return <button type="button" key={item.key} className={buttonClass} onClick={() => open(target.id, item.formKey)}>{target.name}｜{forms.find((available) => available.key === item.formKey)?.label ?? item.formKey}</button>; })}</div></section>}
        {canAuthorizeCare(role) && <label className="mb-4 flex flex-wrap items-center gap-3 text-sm" data-no-print>退房回補天數（示範設定）<input aria-label="退房回補天數" type="number" min={0} max={30} className={`${inputClass} !w-24`} value={data.backfillDays} onChange={(event) => run(() => careActions.backfillDays(Number(event.target.value)), "已更新回補期限，所有照護對象同步。")} /></label>}
        <div className="mb-4 flex flex-wrap gap-3 text-sm text-stone-600"><span>綠色：入住</span><span>粉色：親子同室</span><span>托嬰以車號識別</span><span>退房回補 {data.backfillDays} 天（示範設定）</span><span className="ml-auto">{subjects.length} 位</span></div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">{subjects.map((item) => <section key={item.id} data-status={item.historical ? "退房回補" : item.status} className={`${styles.subjectCard} min-w-0 rounded-xl border p-4`}>
          <div className="flex items-center justify-between gap-2"><h2 className="text-lg font-semibold">{item.room ? `房 ${item.room}` : `車 ${item.carNo || "待指派"}`}</h2><span className={`${styles.status} text-xs`}>{item.status}</span></div><p className="mt-2 font-medium">{item.name}</p>{kind === "baby" && <p className="mt-1 break-words text-xs text-stone-600">{item.motherName}{item.room && item.carNo ? `｜車號 ${item.carNo}` : ""}</p>}<p className="mt-1 break-words text-xs text-stone-600">{item.chartNo}｜第 {item.stayDay} 天</p>{item.historical && <p className="mt-2 text-xs text-amber-900">可補至 {taipeiTimestamp(backfillDeadline(item, data.backfillDays)!)}{isBackfillExpired(item, data.backfillDays) ? "（逾期需主管授權）" : ""}</p>}
          <div className="mt-4 grid grid-cols-2 gap-2">{forms.map((itemForm) => <button type="button" key={itemForm.key} onClick={() => open(item.id, itemForm.key)} className={`${buttonClass} !px-2 text-xs`}>{itemForm.label}</button>)}</div>
        </section>)}</div>
        {backfillSubjects.length > 0 && <section className="mt-9"><div className="mb-4 flex flex-wrap items-center justify-between gap-2"><h2 className="text-xl font-semibold">退房回補</h2><span className="rounded-full bg-amber-100 px-3 py-1 text-xs text-amber-900">期限 {data.backfillDays} 天，逾期需主管授權</span></div><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">{backfillSubjects.map((item) => <section key={item.id} data-status="退房回補" className={`${styles.subjectCard} min-w-0 rounded-xl border p-4`}><div className="flex items-center justify-between gap-2"><h3 className="font-semibold">房 {item.room}</h3><span className={`${styles.status} text-xs`}>退房回補</span></div><p className="mt-2 font-medium">{item.name}</p><p className="mt-1 text-xs text-stone-600">{item.chartNo}｜退房 {taipeiTimestamp(item.dischargedAt!)}</p><p className="mt-2 text-xs text-amber-900">可補至 {taipeiTimestamp(backfillDeadline(item, data.backfillDays)!)}{isBackfillExpired(item, data.backfillDays) ? "（逾期需授權）" : ""}</p><div className="mt-4 grid grid-cols-2 gap-2">{forms.map((itemForm) => <button type="button" key={itemForm.key} onClick={() => open(item.id, itemForm.key)} className={`${buttonClass} !px-2 text-xs`}>{itemForm.label}</button>)}</div></section>)}</div></section>}
        {!subjects.length && <p className="rounded-lg border border-dashed border-stone-300 p-8 text-center text-sm text-stone-600">沒有符合條件的照護對象，請調整搜尋或篩選。</p>}
      </>}
      {openDocuments.length > 0 && <nav aria-label="開啟中的照護表單" className={styles.tray} data-no-print><div className="mb-2 flex flex-wrap items-center gap-3 text-xs text-stone-600"><span>全部開啟 {data.open.length}</span><span>草稿 {allDrafts}</span><span>{lockedSubject ? `編輯鎖：${lockedSubject.room || lockedSubject.carNo} ${lockedSubject.name}` : "尚未鎖定對象"}</span><Link href="/" className="ml-auto underline">回首頁</Link></div><div className="flex flex-wrap items-center gap-2">{openDocuments.map((item) => { const target = subjectFor(item.subjectId)!; return <button type="button" key={item.key} aria-pressed={item.key === activeKey && !listVisible} className={`${buttonClass} ${item.key === activeKey && !listVisible ? "!bg-stone-800 !text-white" : ""}`} onClick={() => { run(() => careActions.activate(item.key)); setListVisible(false); setSigning(false); }}>{target.room || target.carNo} {target.name}｜{forms.find((available) => available.key === item.formKey)?.label ?? item.formKey}{item.signedAt ? " ✓" : item.dirty ? " · 草稿" : ""}</button>; })}<button type="button" className={buttonClass} onClick={() => { if (hasActive) setPending("all"); else run(() => careActions.closeAll(kind), "已保留草稿並關閉全部表單。"); }}>保留草稿，全部關閉</button></div></nav>}
    </RequireAccess>
  </div>;
}
