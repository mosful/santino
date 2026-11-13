/* eslint-disable @next/next/no-img-element */
import type { CareDocument, CareEntry, CareField, CareForm, CareSubject, CareValues } from "@/lib/care/types";
import { FEEDING_GROUPS, sectionRows } from "@/lib/care/sheetDefinitions";
import { legacySheetFields, normalizeSheetValues } from "@/lib/care/sheetValues";
import styles from "./CareSheet.module.css";

function text(value: string | string[] | undefined) { return Array.isArray(value) ? value.join("、") : value ?? ""; }
function PrintField({ field, values, blank }: { field: CareField; values: CareValues; blank: boolean }) {
  const value = blank ? undefined : values[field.key];
  const selected = Array.isArray(value) ? value : value ? [value] : [];
  const options = field.options;
  return <span className={styles.printField}>
    <span className={styles.printLabel}>{field.label}：</span>
    {options ? <>{options.map((option) => <span className={styles.printOption} key={option}>{selected.includes(option) ? "●" : "○"}{option}</span>)}{selected.filter((item) => !options.includes(item)).map((item) => <span key={item}>（已存：{item}）</span>)}</> : <span className={styles.printValue}>{text(value) || "　　　　　　　"}</span>}
  </span>;
}

export default function CarePrintSheet({ form, document, subject, history, blank = false }: { form: CareForm; document: CareDocument; subject: CareSubject; history: CareEntry[]; blank?: boolean }) {
  const values = normalizeSheetValues(subject.kind, form.key, document.values);
  function legacy(extra: CareValues) { const fields = legacySheetFields(form, extra); return !blank && fields.length > 0 ? <div className={styles.legacyPrint}>原有資料補充：{fields.map((field) => <PrintField key={field.key} field={field} values={extra} blank={false} />)}</div> : null; }
  function header(title = form.printTitle ?? form.label) {
    return <><h2 className={styles.printTitle}>聖帝諾產後護理之家</h2><h3 className={styles.printSubtitle}>{title}</h3><p className={styles.printIdentity}>房號／車號：{subject.room || subject.carNo}　姓名：{subject.name}　病歷號：{subject.chartNo}</p><p className={styles.printIdentity}>填寫日期：{blank ? "　　　　　" : text(document.values.date)}　時間：{blank ? "　　　" : text(document.values.time)}　{subject.motherName !== subject.name ? `媽媽：${subject.motherName}` : ""}</p></>;
  }
  if (form.layout === "feeding") {
    const entries = history.filter((entry) => entry.id !== document.editingEntryId).map((entry) => ({ id: entry.id, values: entry.values, author: entry.author }));
    if (!document.signedAt && !blank) entries.push({ id: "draft", values: document.values, author: document.author ? `${document.author}（未簽出）` : "未簽出" });
    entries.sort((a, b) => `${text(a.values.date)} ${text(a.values.time)}`.localeCompare(`${text(b.values.date)} ${text(b.values.time)}`));
    const pages = Array.from({ length: Math.max(1, Math.ceil(entries.length / 7)) }, (_, index) => entries.slice(index * 7, index * 7 + 7));
    return <div className={styles.printDocument}>{pages.map((items, page) => <section className={styles.printPage} key={page}>
      {header("哺餵母乳觀察紀錄總表")}
      <table className={styles.feedingPrint}><thead><tr><th>觀察項目</th><th>哺餵順利之表現</th><th>哺餵困難之表現</th>{Array.from({ length: 7 }, (_, i) => <th key={i}>{!blank && items[i] ? <>{text(items[i].values.date)}<br />{text(items[i].values.time)}</> : `第 ${page * 7 + i + 1} 次`}</th>)}</tr></thead><tbody>
        {FEEDING_GROUPS.flatMap((group) => group.rows.map(([positive, negative], index) => <tr key={`${group.code}${index}`}>
          {index === 0 && <th rowSpan={group.rows.length}>{group.code}<br />{group.label}</th>}<td>{positive}</td><td>{negative}</td>{Array.from({ length: 7 }, (_, i) => <td key={i}>{blank ? "" : text(items[i]?.values[`breast-${group.code}${index + 1}`]) === "順利" ? "○" : text(items[i]?.values[`breast-${group.code}${index + 1}`]) === "困難" ? "×" : ""}</td>)}
        </tr>))}
        {[{ key: "leftMinutes", label: "左乳房分鐘" }, { key: "rightMinutes", label: "右乳房分鐘" }, { key: "feedingResult", label: "評估結果" }, { key: "feedingNote", label: "哺餵紀錄" }, { key: "reassessmentNote", label: "再評估護理紀錄" }].map((field) => <tr key={field.key}><th colSpan={3}>{field.label}</th>{Array.from({ length: 7 }, (_, i) => <td key={i}>{blank ? "" : text(items[i]?.values[field.key])}</td>)}</tr>)}
        <tr><th colSpan={3}>紀錄人</th>{Array.from({ length: 7 }, (_, i) => <td key={i}>{blank ? "" : items[i]?.author}</td>)}</tr>
      </tbody></table>
      {!blank && items.map((item) => <div key={item.id}>{legacy(item.values)}</div>)}
    </section>)}</div>;
  }
  const groups = form.printGroups ?? [form.sections.map((_, i) => i)];
  return <div className={styles.printDocument}>{groups.map((indexes, page) => <section className={styles.printPage} key={page}>
    {header()}
    {indexes.map((index) => {
      const section = form.sections[index];
      if (!section) return null;
      const rows = sectionRows(section);
      return <table className={styles.assessmentPrint} key={section.label}><tbody>{rows.map((row, i) => <tr key={row.label}>
        {i === 0 && <th className={styles.printSection} rowSpan={rows.length}>{section.label}</th>}
        <th className={styles.printRowLabel}>{row.label}</th><td>{row.keys.map((key) => { const field = section.fields.find((item) => item.key === key); return field && <PrintField key={key} field={field} values={values} blank={blank} />; })}</td>
      </tr>)}</tbody></table>;
    })}
    {page === groups.length - 1 && legacy(values)}
    <div className={styles.printSignatures}><span>產婦／填表人簽名：{!blank && document.signature ? <img src={document.signature} alt="本筆產婦簽名" /> : "　　　　　　　　　"}</span><span>護理人員：{blank ? "　　　　　　　　　" : document.staffStamp?.author ?? document.author ?? "　　　　　　　　　"}</span></div>
  </section>)}</div>;
}
