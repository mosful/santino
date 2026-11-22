"use client";

import { useEffect, useRef } from "react";
import type { CareEntry, CareForm, CareValues } from "@/lib/care/types";
import { legacySheetFields } from "@/lib/care/sheetValues";
import { paperShift } from "@/lib/care/paperTemplates";
import CareFieldInput from "./CareFields";
import styles from "./CareSheet.module.css";

type Props = { form: CareForm; sectionIndex: number; values: CareValues; onChange: (patch: CareValues) => void; personal: string[]; addPhrase: (value: string) => void; subjectEntries?: CareEntry[] };

const valueText = (value: string | string[] | undefined) => Array.isArray(value) ? value.join("、") : value ?? "";
const dailyShifts = ["N", "D", "E"] as const;

function dateWindow(value: string) {
  const end = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T12:00:00+08:00`) : new Date();
  return Array.from({ length: 5 }, (_, index) => {
    const date = new Date(end); date.setDate(end.getDate() - 4 + index);
    return date.toLocaleDateString("en-CA", { timeZone: "Asia/Taipei" });
  });
}

type DailyRecord = { values: CareValues; author?: string };

function DailyMatrix({ values, onChange, subjectEntries = [] }: Pick<Props, "values" | "onChange" | "subjectEntries">) {
  const dates = dateWindow(valueText(values.date));
  const dateKey = dates.join("|");
  const activeShift = paperShift(valueText(values.shift));
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const container = scrollRef.current;
    const cell = container?.querySelector<HTMLElement>("[data-active-column='true']");
    if (container && cell) container.scrollLeft = Math.max(0, cell.offsetLeft - (container.clientWidth - cell.offsetWidth) / 2);
  }, [dateKey, activeShift]);
  const record = (date: string, shift: string): DailyRecord | undefined => {
    if (date === valueText(values.date) && shift === activeShift) return { values };
    const entry = subjectEntries.find((item) => item.formKey === "daily" && valueText(item.values.date) === date && paperShift(valueText(item.values.shift)) === shift);
    return entry && { values: entry.values, author: entry.staffStamp?.author ?? entry.author };
  };
  const active = (date: string, shift: string) => date === valueText(values.date) && shift === activeShift;
  const input = (date: string, shift: string, key: string, label: string, type: "text" | "number" | "select" | "textarea" = "text", options: string[] = []) => {
    const item = record(date, shift);
    if (!active(date, shift)) return <span>{item ? valueText(item.values[key]) : ""}</span>;
    if (type === "select") return <select aria-label={label} value={valueText(values[key])} onChange={(event) => onChange({ [key]: event.target.value })}><option value="">—</option>{options.map((option) => <option key={option}>{option}</option>)}</select>;
    if (type === "textarea") return <textarea aria-label={label} value={valueText(values[key])} onChange={(event) => onChange({ [key]: event.target.value })} />;
    return <input aria-label={label} type={type} value={valueText(values[key])} onChange={(event) => onChange({ [key]: event.target.value })} />;
  };
  const check = (date: string, shift: string, key: string, option: string) => {
    const item = record(date, shift); const stored = item?.values[key]; const selected = Array.isArray(stored) ? stored.includes(option) : stored === option;
    if (!active(date, shift)) return selected ? "✓" : "";
    const current = Array.isArray(values[key]) ? values[key] as string[] : values[key] ? [String(values[key])] : [];
    return <input aria-label={`${option}（${date} ${shift} 班）`} type="checkbox" checked={selected} onChange={() => onChange({ [key]: selected ? current.filter((item) => item !== option) : [...current, option] })} />;
  };
  const rows: { label: string; key: string; type?: "text" | "number" | "select" | "textarea"; options?: string[] }[] = [
    { label: "時間", key: "time" }, { label: "體溫 ℃", key: "temperature", type: "number" }, { label: "心跳 次／分", key: "pulse", type: "number" }, { label: "呼吸 次／分", key: "respiration", type: "number" },
    { label: "活動力", key: "activity", type: "select", options: ["強", "適中", "弱"] }, { label: "吸吮力", key: "sucking", type: "select", options: ["強", "適中", "弱"] },
  ];
  const laterRows: typeof rows = [
    { label: "臍帶存／無", key: "cordPresent", type: "select", options: ["存", "無"] }, { label: "臍帶顏色味道", key: "cordAppearance" },
    { label: "紅臀有／無", key: "redBottomPresent", type: "select", options: ["無", "有"] }, { label: "紅臀分級", key: "redBottom", type: "select", options: ["0 無紅疹", "1 輕度紅疹", "2 中度紅疹及破皮", "3 重度及滲出物"] },
  ];
  return <div ref={scrollRef} className={styles.dailyMatrixScroll} aria-label="新生兒每日評估照護單五日三班矩陣">
    <table className={styles.dailyMatrix}>
      <thead><tr><th rowSpan={2}>評估項目</th>{dates.map((date) => <th key={date} colSpan={3}>{date}</th>)}</tr><tr>{dates.flatMap((date) => dailyShifts.map((shift) => <th key={`${date}-${shift}`} data-active-column={active(date, shift)}>{shift}</th>))}</tr></thead>
      <tbody>
        <tr><th>入住日數</th>{dates.map((date) => {
          const dayRecord = dailyShifts.map((shift) => record(date, shift)).find(Boolean);
          return <td key={date} colSpan={3}>{date === valueText(values.date) ? <input aria-label={`${date} 入住日數`} value={valueText(values.stayDay)} onChange={(event) => onChange({ stayDay: event.target.value })} /> : valueText(dayRecord?.values.stayDay)}</td>;
        })}</tr>
        {rows.map((row) => <tr key={row.key}><th>{row.label}</th>{dates.flatMap((date) => dailyShifts.map((shift) => <td key={`${date}-${shift}`} data-active-column={active(date, shift)}>{input(date, shift, row.key, `${date} ${shift} 班 ${row.label}`, row.type, row.options)}</td>))}</tr>)}
        {["乾燥", "臉疹", "身疹", "腋下浸潤", "股溝浸潤"].map((option, index) => <tr key={option}>{index === 0 && <th rowSpan={5}>皮膚<br />有左列狀況打勾</th>}{dates.flatMap((date) => dailyShifts.map((shift) => <td key={`${date}-${shift}`} data-active-column={active(date, shift)}>{check(date, shift, "skinFindings", option)}</td>))}</tr>)}
        {laterRows.map((row) => <tr key={row.key}><th>{row.label}</th>{dates.flatMap((date) => dailyShifts.map((shift) => <td key={`${date}-${shift}`} data-active-column={active(date, shift)}>{input(date, shift, row.key, `${date} ${shift} 班 ${row.label}`, row.type, row.options)}</td>))}</tr>)}
        <tr><th>親子同室持續時間</th>{dates.map((date) => {
          const dayRecord = dailyShifts.map((shift) => record(date, shift)).find(Boolean); const isCurrent = date === valueText(values.date);
          return <td key={date} colSpan={3} data-active-column={isCurrent}>{isCurrent ? <div className={styles.dailyRoomingCell}><select aria-label={`${date} 親子同室原表勾選`} value={valueText(values.roomingDailyStatus)} onChange={(event) => onChange({ roomingDailyStatus: event.target.value })}><option value="">—</option><option>≥8hrs</option><option>其他時數</option></select><input aria-label={`${date} 親子同室時數`} type="number" value={valueText(values.roomingDailyHours)} onChange={(event) => onChange({ roomingDailyHours: event.target.value })} /></div> : [valueText(dayRecord?.values.roomingDailyStatus), valueText(dayRecord?.values.roomingDailyHours)].filter(Boolean).join(" ")}</td>;
        })}</tr>
        <tr><th>照護問題</th>{dates.flatMap((date) => dailyShifts.map((shift) => <td key={`${date}-${shift}`} data-active-column={active(date, shift)}>{input(date, shift, "careIssue", `${date} ${shift} 班照護問題`, "textarea")}</td>))}</tr>
        <tr><th>照護人員簽章</th>{dates.flatMap((date) => dailyShifts.map((shift) => <td key={`${date}-${shift}`}>{record(date, shift)?.author ?? (active(date, shift) ? "簽出時加蓋" : "")}</td>))}</tr>
      </tbody>
    </table>
  </div>;
}

function makePaperInput({ form, values, onChange, personal, addPhrase }: Omit<Props, "sectionIndex">) {
  const fields = form.sections.flatMap((section) => section.fields);
  function renderPaperInput(key: string) {
    const field = fields.find((item) => item.key === key);
    return field && <CareFieldInput key={field.key} field={field} values={values} onChange={onChange} personal={personal} addPhrase={addPhrase} />;
  }
  return renderPaperInput;
}

function PaperRow({ label, children, large = false }: { label: string; children: React.ReactNode; large?: boolean }) {
  return <div className={`${styles.paperEditorRow} ${large ? styles.paperEditorRowLarge : ""}`}>
    <div className={styles.paperEditorLabel}>{label}</div>
    <div className={styles.paperEditorFields}>{children}</div>
  </div>;
}

function LegacyFields(props: Omit<Props, "sectionIndex">) {
  const fields = legacySheetFields(props.form, props.values);
  if (!fields.length) return null;
  return <div className={styles.paperEditorSupplement}><h4>原有資料補充</h4>{fields.map((field) => <CareFieldInput key={field.key} field={field} values={props.values} onChange={props.onChange} personal={props.personal} addPhrase={props.addPhrase} />)}</div>;
}

export function CareBabyDailySheet(props: Props) {
  const { form, sectionIndex } = props;
  const input = makePaperInput(props);
  if (sectionIndex > 0) {
    const section = form.sections[Math.min(sectionIndex, form.sections.length - 1)];
    return <div className={styles.paperEditor} data-care-sheet="baby-daily-supplement">
      <h3 className={styles.paperEditorTitle}>新生兒每日評估照護單－系統補充資料</h3>
      <p className={styles.paperEditorHint}>以下欄位供院內彙整使用；原紙本沒有獨立格位，列印主表時不會擠入其他欄位。</p>
      <div className={styles.paperEditorSupplement}>{section.fields.map((field) => input(field.key))}</div>
    </div>;
  }
  return <div className={styles.paperEditor} data-care-sheet="baby-daily">
    <p className={styles.paperEditorHint}>依原紙本列序填寫目前日期與班別；完成簽出後，列印會彙整成五日 × N／D／E 三班格式。</p>
    <div className={styles.paperEditorHeader}>
      {input("date")}{input("shift")}{input("birthDate")}{input("delivery")}{input("feedingType")}{input("feedingOther")}
    </div>
    <DailyMatrix values={props.values} onChange={props.onChange} subjectEntries={props.subjectEntries} />
    <div className={`${styles.paperEditorTable} ${styles.dailyCompactEditor}`} aria-label="目前日期班別放大填寫區">
      <h4 className={styles.dailyCompactTitle}>目前日期／班別放大填寫</h4>
      <PaperRow label="日期">{input("date")}</PaperRow>
      <PaperRow label="入住日數">{input("stayDay")}</PaperRow>
      <PaperRow label="班別／時間">{input("shift")}{input("time")}</PaperRow>
      <PaperRow label="體溫／心跳／呼吸">{input("temperature")}{input("pulse")}{input("respiration")}</PaperRow>
      <PaperRow label="活動力">{input("activity")}</PaperRow>
      <PaperRow label="吸吮力">{input("sucking")}</PaperRow>
      <PaperRow label="皮膚（有左列狀況打勾）">{input("skinFindings")}</PaperRow>
      <PaperRow label="臍帶">{input("cordPresent")}{input("cordAppearance")}</PaperRow>
      <PaperRow label="紅臀">{input("redBottomPresent")}{input("redBottom")}{input("redBottomNote")}</PaperRow>
      <PaperRow label="親子同室持續時間">{input("roomingDailyStatus")}{input("roomingDailyHours")}</PaperRow>
      <PaperRow label="照護問題（措施評值及護理紀錄）" large>{input("careIssue")}</PaperRow>
      <PaperRow label="照護人員簽章"><p className={styles.paperEditorStamp}>完成簽出時自動加蓋實際操作者與時間。</p></PaperRow>
    </div>
    <LegacyFields {...props} />
  </div>;
}

export function CareBabyAdmissionSheet(props: Props) {
  const { form, sectionIndex } = props;
  const input = makePaperInput(props);
  const selectedIndex = Math.min(sectionIndex, form.sections.length - 1);
  const section = form.sections[selectedIndex];
  const bodyPage = section.label === "身體評估";
  const supplement = section.label === "入住護理紀錄" || selectedIndex > 5;
  const title = bodyPage ? "新生兒入住身體狀況評估單" : supplement ? "新生兒入住評估－系統補充資料" : "新生兒入住評估單";
  return <div className={styles.paperEditor} data-care-sheet="baby-admission" data-paper-page={bodyPage ? "2" : supplement ? "supplement" : "1"}>
    {title !== form.printTitle && <h3 className={styles.paperEditorTitle}>{title}</h3>}
    {!supplement && <p className={styles.paperEditorHint}>欄位名稱、題序及選項依院方原紙本；列印時會將本頁資料套入同一張原紙本。</p>}
    {!bodyPage && !supplement && selectedIndex === 0 && <div className={styles.paperEditorHeader}>{input("date")}{input("time")}</div>}
    {bodyPage && <div className={styles.paperEditorHeader}>{input("bodyDate")}{input("bodyTime")}{input("temperatureSite")}{input("temperature")}{input("pulse")}{input("respiration")}{input("oxygen")}</div>}
    <section className={styles.paperEditorSection} aria-label={section.label}>
      <h4 className={styles.paperEditorSectionTitle}>{section.label}</h4>
      <div className={styles.paperEditorTable}>
        {(section.rows ?? []).map((row) => {
          const keys = row.keys.filter((key) => !bodyPage || !["bodyDate", "bodyTime", "temperatureSite", "temperature", "pulse", "respiration", "oxygen"].includes(key));
          return keys.length ? <PaperRow key={row.label} label={row.label} large={keys.some((key) => ["motherComplaint", "note"].includes(key))}>{keys.map(input)}</PaperRow> : null;
        })}
        {!section.rows?.length && <div className={styles.paperEditorSupplement}>{section.fields.map((field) => input(field.key))}</div>}
      </div>
    </section>
    {supplement && <LegacyFields {...props} />}
  </div>;
}
