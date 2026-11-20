"use client";
/* 原紙本預覽為本機靜態檔案，保留原始掃描比例。 */
/* eslint-disable @next/next/no-img-element */
import { useEffect, useState, type RefObject } from "react";
import { Download, FileText } from "lucide-react";
import Button, { ButtonLink } from "@/components/ui/Button";
import { BASE_PATH } from "@/lib/basePath";
import type { CareDocument, CareEntry, CareForm, CareSubject } from "@/lib/care/types";
import { PAPER_TEMPLATES } from "@/lib/care/paperTemplates";
import { PAPER_VERSION } from "@/lib/care/paperForms";
import { paperConflicts, paperRecords, paperText, type PaperRequest } from "@/lib/care/paperRecords";
import styles from "./CarePaperOutput.module.css";
import Choice from "@/components/ui/Choice";

type Props = { form: CareForm; document: CareDocument; subject: CareSubject; history: CareEntry[]; blank: boolean; generateButtonRef: RefObject<HTMLButtonElement | null>; onStatus?: (status: { busy: boolean; url?: string; error?: string }) => void };
export default function CarePaperOutput({ form, document, subject, history, blank, generateButtonRef, onStatus }: Props) {
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [includeDraft, setIncludeDraft] = useState(!!document.dirty || !!document.savedAt && !document.signedAt);
  const [paperSize, setPaperSize] = useState<"source" | "a4">("source");
  const [choices, setChoices] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ url: string; fingerprint: string }>();
  const isDaily = form.paperTemplate!.endsWith("daily");
  const request: PaperRequest = { form, document, subject, history, blank, start, end, includeDraft, paperSize, choices };
  const fingerprint = JSON.stringify({ v: document.values, signed: document.signature, history, blank, start, end, includeDraft, paperSize, choices, subject });
  const current = result?.fingerprint === fingerprint;
  useEffect(() => () => { if (result?.url) URL.revokeObjectURL(result.url); }, [result]);
  // 讓頁首的表單操作列也能顯示產生進度與下載連結，按「列印本頁」時不必捲到這一區。內容變更後連結失效就收起來。
  useEffect(() => { onStatus?.({ busy, url: current ? result?.url : undefined, error: error || undefined }); }, [onStatus, busy, current, result, error]);
  const conflicts = paperConflicts(request);
  const olderRecords = (isDaily ? paperRecords(request).filter(record=>(!start || paperText(record.values.date)>=start) && (!end || paperText(record.values.date)<=end)) : [document]).filter(record=>record.templateVersion !== PAPER_VERSION);
  const supplemental = form.sections.flatMap((section) => section.fields).filter((field) => form.supplementalKeys?.includes(field.key) && paperText(document.values[field.key]));
  async function generate() {
    setBusy(true); setError("");
    try {
      const { createPaperPdf } = await import("@/lib/care/paperPdf");
      const bytes = await createPaperPdf(request, async (asset) => {
        const response = await fetch(`${BASE_PATH}/${asset}`);
        if (!response.ok) throw new Error("目前無法讀取院方紙本母版，請稍後重試或請管理者確認母版檔案。");
        return new Uint8Array(await response.arrayBuffer());
      });
      const blob = new Blob([Uint8Array.from(bytes).buffer], { type: "application/pdf" });
      setResult({ url: URL.createObjectURL(blob), fingerprint });
    } catch (cause) { setError(cause instanceof Error ? cause.message : "紙本產生失敗，請重試。原紀錄已保留。"); }
    finally { setBusy(false); }
  }
  return <section id="care-paper-output" className={styles.output} aria-label="依紙本列印" data-no-print>
    <div className={styles.heading}><h3>依紙本列印</h3><span>母版 {PAPER_VERSION}・{blank ? "空白表格" : "填寫內容"}</span></div>
    <p className={styles.description}>保留紙本格線、選項與原分頁。請先產生 PDF，再由 PDF 的列印功能輸出。</p>
    {!blank && isDaily && <div className={styles.controls}>
      <label>列印起日<input type="date" value={start} onChange={(event) => setStart(event.target.value)} /></label>
      <label>列印迄日<input type="date" value={end} onChange={(event) => setEnd(event.target.value)} /></label>
      <label className={styles.check}><input type="checkbox" checked={includeDraft} disabled={!!document.signedAt} onChange={(event) => setIncludeDraft(event.target.checked)} />包含目前未簽出草稿</label>
      <p>不指定日期時列印全部已簽紀錄。{form.paperTemplate === "mama-daily" ? "每頁四次紀錄。" : "每頁五個連續日曆日，缺日與缺班留白；N 班依紀錄日期歸屬。"}</p>
    </div>}
    <div className={styles.actions}>
      <div>紙張<Choice label="紙張" value={paperSize} options={[{ value: "source", label: "原紙本尺寸" }, { value: "a4", label: "A4 等比例置中" }]} onChange={(next) => setPaperSize(next as "source" | "a4")} /></div>
      <Button ref={generateButtonRef} onClick={() => void generate()} disabled={busy}><FileText size={16} />{busy ? "正在產生 PDF…" : blank ? "產生空白紙本 PDF" : "產生填寫紙本 PDF"}</Button>
      {current && result && <ButtonLink href={result.url} download={`${form.printTitle ?? form.label}.pdf`}><Download size={16} />下載紙本 PDF</ButtonLink>}
      {current && result && <a href={result.url} target="_blank" rel="noopener noreferrer">開啟 PDF 列印</a>}
    </div>
    {!!conflicts.size && <div className={styles.conflicts} aria-label="同班多筆列印選擇"><p>同日同班有多筆紀錄，請選擇這次印入原格的紀錄。未選資料仍保留，可另次列印。</p>{[...conflicts].map(([key, records]) => <label key={key}>{key}<select value={choices[key] ?? ""} onChange={(event) => setChoices({ ...choices, [key]: event.target.value })}><option value="">請選擇紀錄</option>{records.map((record) => <option key={record.id} value={record.id}>{paperText(record.values.time)}｜{record.author ?? "未簽出草稿"}｜{record.id === "draft" ? "目前草稿" : "已簽出紀錄"}</option>)}</select></label>)}</div>}
    {!!supplemental.length && !blank && <details className={styles.note}><summary>原表以外的資料保留於系統（{supplemental.length} 項）</summary><p>{supplemental.map((field) => field.label).join("、")}。這些欄位不插入紙本主表；可於相應紀錄查閱完整內容。</p></details>}
    {!blank && !!olderRecords.length && <p className={styles.note}>範圍內有 {olderRecords.length} 筆紀錄未註記紙本版本或使用不同版本；本次依新版母版輸出，請核對原欄位。</p>}
    {!blank && includeDraft && !document.signedAt && <p className={styles.note}>本次包含未簽出草稿，請先確認內容；儲存狀態不會加印到原紙本。</p>}
    {error && <p role="alert" className={styles.error}>{error}</p>}
    {result && !current && <p role="status" className={styles.note}>內容或列印條件已變更，請重新產生 PDF。</p>}
    {current && result && <div className={styles.result}><p role="status">紙本 PDF 已產生。列印時請關閉額外頁首頁尾並核對縮放；iPad 可使用「開啟 PDF 列印」。</p><details><summary>在頁面內預覽 PDF</summary><p>若瀏覽器未顯示預覽，請使用上方「開啟 PDF 列印」。</p><iframe title="紙本 PDF 預覽" src={result.url} loading="lazy" /></details></div>}
    {blank && <details open className={styles.reference}><summary>檢視院方原紙本</summary><div className={styles.pages}>{PAPER_TEMPLATES[form.paperTemplate!].map((page) => <a key={page.page} href={`${BASE_PATH}/care-paper/templates/${page.source}-${page.page + 1}.png`} target="_blank" rel="noopener noreferrer"><img src={`${BASE_PATH}/care-paper/templates/${page.source}-${page.page + 1}.png`} width={954} height={1361} alt={`${page.title}原紙本第 ${page.page + 1} 頁，保留原題目、選項、格線及簽名位置`} /></a>)}</div></details>}
  </section>;
}
