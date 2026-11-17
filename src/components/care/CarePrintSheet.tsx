/* eslint-disable @next/next/no-img-element */
import { Fragment } from "react";
import type { CareDocument, CareEntry, CareField, CareForm, CareSubject, CareValues } from "@/lib/care/types";
import { FEEDING_GROUPS, RED_BOTTOM, SHIFTS, sectionRows } from "@/lib/care/sheetDefinitions";
import { growthDays, type GrowthDay } from "@/lib/care/summary";
import { GUIDANCE_WAYS, guidanceGroups, guidanceKeys } from "@/lib/care/guidance";
import { legacySheetFields, normalizeSheetValues } from "@/lib/care/sheetValues";
import { scaleQuestions, scaleResult, type ScaleKind } from "@/lib/care/scales";
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

type PrintItem = { id: string; values: CareValues; author: string };
/** 歷次已簽出紀錄加上目前草稿，依日期時間排序；修改中的那一筆不重複列出。 */
function printItems(history: CareEntry[], document: CareDocument, blank: boolean): PrintItem[] {
  const items: PrintItem[] = history.filter((entry) => entry.id !== document.editingEntryId).map((entry) => ({ id: entry.id, values: entry.values, author: entry.author }));
  if (!document.signedAt && !blank) items.push({ id: "draft", values: document.values, author: document.author ? `${document.author}（未簽出）` : "未簽出" });
  return items.sort((a, b) => `${text(a.values.date)} ${text(a.values.time)}`.localeCompare(`${text(b.values.date)} ${text(b.values.time)}`));
}

export default function CarePrintSheet({ form, document, subject, history, subjectEntries = [], blank = false }: { form: CareForm; document: CareDocument; subject: CareSubject; history: CareEntry[]; subjectEntries?: CareEntry[]; blank?: boolean }) {
  const values = normalizeSheetValues(subject.kind, form.key, document.values);
  function legacy(extra: CareValues) { const fields = legacySheetFields(form, extra); return !blank && fields.length > 0 ? <div className={styles.legacyPrint}>原有資料補充：{fields.map((field) => <PrintField key={field.key} field={field} values={extra} blank={false} />)}</div> : null; }
  function header(title = form.printTitle ?? form.label) {
    return <><h2 className={styles.printTitle}>聖帝諾產後護理之家</h2><h3 className={styles.printSubtitle}>{title}</h3><p className={styles.printIdentity}>房號／車號：{subject.room || subject.carNo}　姓名：{subject.name}　病歷號：{subject.chartNo}</p><p className={styles.printIdentity}>填寫日期：{blank ? "　　　　　" : text(document.values.date)}　時間：{blank ? "　　　" : text(document.values.time)}　{subject.motherName !== subject.name ? `媽媽：${subject.motherName}` : ""}</p></>;
  }
  if (form.layout === "scale") {
    const kind = form.key as ScaleKind;
    const questions = scaleQuestions(kind);
    const result = scaleResult(kind, values);
    return <div className={styles.printDocument}><section className={styles.printPage}>
      <h2 className={styles.printTitle}>聖帝諾產後護理之家</h2>
      <h3 className={styles.printSubtitle}>{form.printTitle}</h3>
      <div className={styles.scalePrintIdentity}>
        <span>房號：{subject.room || "　　　　"}</span><span>姓名：{subject.name || "　　　　　　"}</span>
        <span>生日：{blank ? "　　　　　" : text(values.birthDate)}</span><span>日期：{blank ? "　　　　　" : text(values.date)}</span>
      </div>
      <p className={styles.scalePrintIntro}>{kind === "mood" ? "請依照您過去七天（不只是今天）的感受，選擇最接近的答案；每題只能選一個答案。" : "本量表共 6 題，每題 1 至 5 分；第 4、5 題採反向計分，總分越高代表家庭及社會支持程度越好。"}</p>
      {kind === "mood" ? <div className={styles.scaleMoodPrint}>
        {questions.map((question, index) => <section key={question.key}>
          <h4>{index + 1}. {question.text}</h4>
          {question.options.map((option, optionIndex) => {
            const selected = !blank && values[question.key] === String(option.score);
            return <p key={`${option.label}-${option.score}`}><span className={styles.scalePrintMark}>{selected ? "●" : "○"}</span>{String.fromCharCode(97 + optionIndex)}. {option.label}<small>{option.score} 分</small></p>;
          })}
        </section>)}
        <section aria-hidden="true" /><section aria-hidden="true" />
      </div> : <table className={styles.scalePrint}><thead><tr><th>題目</th>{questions[0].options.map((option) => <th key={option.label}>{option.label}</th>)}</tr></thead><tbody>
        {questions.map((question, index) => <tr key={question.key}>
          <th>{index + 1}. {question.text}</th>
          {question.options.map((option) => {
            const selected = !blank && values[question.key] === String(option.score);
            return <td key={`${option.label}-${option.score}`}><span className={styles.scalePrintMark}>{selected ? "●" : "○"}</span><small>{option.score} 分</small></td>;
          })}
        </tr>)}
      </tbody></table>}
      <div className={styles.scalePrintResult}><span>總分：{!blank && result.complete ? `${result.score} 分` : "　　　　"}</span>{kind === "mood" && <span>第 10 題：{!blank && text(values.question10) !== "" ? `${text(values.question10)} 分` : "　　　"}</span>}</div>
      <p className={styles.scalePrintFollowUp}>後續處理：{blank ? "" : text(values.followUp)}</p>
      <p className={styles.scalePrintStaff}>護理人員：{blank ? "　　　　　　　　　" : document.staffStamp?.author ?? document.author ?? "　　　　　　　　　"}</p>
    </section></div>;
  }
  if (form.layout === "feeding") {
    const entries = printItems(history, document, blank);
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
  if (form.layout === "daily") {
    const items = printItems(history, document, blank);
    // 院方紙本是一面連續五天、每天各班：取最近五個有紀錄的日期，不足的留空白欄位。
    const dates = blank ? [] : [...new Set(items.map((item) => text(item.values.date)))].slice(-5);
    while (dates.length < 5) dates.push("");
    const at = (date: string, shift: string) => date ? items.find((entry) => text(entry.values.date) === date && text(entry.values.shift) === shift) : undefined;
    const cell = (date: string, shift: string, key: string) => text(at(date, shift)?.values[key]);
    const join = (...parts: string[]) => parts.filter(Boolean).join(" ");
    const rows: { label: string; render: (date: string, shift: string) => string }[] = [
      { label: "入住日數", render: (d, s) => cell(d, s, "stayDay") },
      { label: "時間", render: (d, s) => cell(d, s, "time") },
      { label: "體溫 ℃", render: (d, s) => cell(d, s, "temperature") },
      { label: "心跳 次／分", render: (d, s) => cell(d, s, "pulse") },
      { label: "呼吸 次／分", render: (d, s) => cell(d, s, "respiration") },
      { label: "活動力", render: (d, s) => cell(d, s, "activity") },
      { label: "吸吮力", render: (d, s) => cell(d, s, "sucking") },
      { label: "皮膚", render: (d, s) => join(cell(d, s, "skin"), cell(d, s, "skinNote")) },
      { label: "臍帶", render: (d, s) => cell(d, s, "cord") },
      { label: "紅臀", render: (d, s) => join(cell(d, s, "redBottom"), cell(d, s, "redBottomNote")) },
      { label: "親子同室", render: (d, s) => join(cell(d, s, "roomingStart") && cell(d, s, "roomingEnd") ? cell(d, s, "roomingStart") + "–" + cell(d, s, "roomingEnd") : "", cell(d, s, "roomingHours") && cell(d, s, "roomingHours") + " 小時") },
      { label: "身長 cm", render: (d, s) => cell(d, s, "height") },
      { label: "體重 g", render: (d, s) => cell(d, s, "weight") },
      { label: "頭圍 cm", render: (d, s) => cell(d, s, "head") },
      { label: "照護問題", render: (d, s) => cell(d, s, "careIssue") },
      { label: "護理簽章", render: (d, s) => at(d, s)?.author ?? "" },
    ];
    return <div className={styles.printDocument}><section className={styles.printPage}>
      {header()}
      <table className={styles.matrixPrint}><thead>
        <tr><th rowSpan={2}>項目</th>{dates.map((date, index) => <th key={index} colSpan={SHIFTS.length}>{date || "第 " + (index + 1) + " 天"}</th>)}</tr>
        <tr>{dates.flatMap((date, index) => SHIFTS.map((shift) => <th key={index + "-" + shift}>{shift.split(" ")[0]}</th>))}</tr>
      </thead><tbody>
        {rows.map((row) => <tr key={row.label}><th className={styles.printRowLabel}>{row.label}</th>{dates.flatMap((date, index) => SHIFTS.map((shift) => <td key={index + "-" + shift}>{row.render(date, shift)}</td>))}</tr>)}
      </tbody></table>
      <p className={styles.printNote}>紅臀分級：{RED_BOTTOM.join("／")}。</p>
    </section></div>;
  }
  if (form.layout === "io") {
    const items = printItems(history, document, blank);
    const dates = blank ? [""] : [...new Set(items.map((item) => text(item.values.date)))].slice(-3);
    const columns: { label: string; render: (values: CareValues) => string }[] = [
      { label: "時間", render: (v) => text(v.time) },
      { label: "體溫 ℃", render: (v) => text(v.temperature) },
      { label: "體重 g", render: (v) => text(v.weight) },
      { label: "親餵 左／右 分", render: (v) => text(v.leftMinutes) || text(v.rightMinutes) ? (text(v.leftMinutes) || "0") + "／" + (text(v.rightMinutes) || "0") : "" },
      { label: "奶別", render: (v) => text(v.milkType) },
      { label: "瓶餵 cc", render: (v) => text(v.bottleAmount) + (text(v.bottleBreastAmount) ? `（母乳 ${text(v.bottleBreastAmount)}）` : "") },
      { label: "餵食情形", render: (v) => [text(v.condition), text(v.sucking) && "吸吮" + text(v.sucking)].filter(Boolean).join(" ") },
      { label: "小便", render: (v) => text(v.urine) === "自解" ? [(text(v.urineTimes) || "1") + " 次", text(v.urineColor)].filter(Boolean).join(" ") : text(v.urine) },
      { label: "大便", render: (v) => text(v.stool) === "自解" ? [(text(v.stoolTimes) || "1") + " 次", text(v.stoolAmount), text(v.stoolForm)].filter(Boolean).join(" ") : text(v.stool) },
      { label: "備註", render: (v) => text(v.note) },
      { label: "紀錄人", render: () => "" },
    ];
    return <div className={styles.printDocument}><section className={styles.printPage}>
      {header()}
      <table className={styles.matrixPrint}><thead><tr>{columns.map((column) => <th key={column.label}>{column.label}</th>)}</tr></thead><tbody>
        {dates.map((date) => {
          const rows = blank ? [] : items.filter((item) => text(item.values.date) === date);
          return <Fragment key={date}>
            <tr><th className={styles.printRowLabel} colSpan={columns.length}>{date || "　"}</th></tr>
            {rows.map((item) => <tr key={item.id}>{columns.map((column) => <td key={column.label}>{column.label === "紀錄人" ? item.author : column.render(item.values)}</td>)}</tr>)}
            {Array.from({ length: Math.max(0, 6 - rows.length) }, (_, index) => <tr key={"blank-" + index}>{columns.map((column) => <td key={column.label}>　</td>)}</tr>)}
          </Fragment>;
        })}
      </tbody></table>
    </section></div>;
  }
  if (form.layout === "growth") {
    const draft: CareEntry[] = document.signedAt || blank ? [] : [{ id: "draft", subjectId: document.subjectId, formKey: form.key, at: "", author: "", values: document.values, historical: false }];
    // 住 21／30 天要全部印出：由舊到新，每頁 16 天往下分頁（原本只取最近 14 天）。
    const days = blank ? [] : growthDays([...draft, ...subjectEntries]).reverse();
    const pages = Array.from({ length: Math.max(1, Math.ceil(days.length / 16)) }, (_, index) => days.slice(index * 16, index * 16 + 16));
    const columns: { label: string; render: (day: GrowthDay) => string }[] = [
      { label: "日期", render: (day) => day.date },
      { label: "體重 g", render: (day) => day.weight ? String(day.weight) : "" },
      { label: "身長 cm", render: (day) => day.height ? String(day.height) : "" },
      { label: "頭圍 cm", render: (day) => day.head ? String(day.head) : "" },
      { label: "母乳 cc", render: (day) => String(day.breastMilk) },
      { label: "配方奶 cc", render: (day) => String(day.formula) },
      { label: "總奶量 cc", render: (day) => String(day.totalMilk) },
      { label: "親餵 分鐘", render: (day) => String(day.breastMinutes) },
      { label: "排尿 次", render: (day) => String(day.urine) },
      { label: "糊便 次", render: (day) => String(day.stoolPaste) },
      { label: "滲便 次", render: (day) => String(day.stoolLeak) },
      { label: "其他便 次", render: (day) => String(day.stoolOther) },
    ];
    return <div className={styles.printDocument}>{pages.map((pageDays, page) => <section key={page} className={styles.printPage}>
      {header()}
      <table className={styles.matrixPrint}><thead><tr>{columns.map((column) => <th key={column.label}>{column.label}</th>)}</tr></thead><tbody>
        {pageDays.map((day) => <tr key={day.date}>{columns.map((column) => <td key={column.label}>{column.render(day)}</td>)}</tr>)}
        {Array.from({ length: Math.max(0, 10 - pageDays.length) }, (_, index) => <tr key={"blank-" + index}>{columns.map((column) => <td key={column.label}>　</td>)}</tr>)}
      </tbody></table>
      {page === pages.length - 1 && <>
        <p className={styles.printNote}>身長與頭圍一週量一次，未量測日留白。本表供家屬帶回，院內每日照護另有完整評估。</p>
        {!blank && text(document.values.note) && <p className={styles.printNote}>成長紀錄：{text(document.values.note)}</p>}
      </>}
    </section>)}</div>;
  }
  if (form.layout === "guidance") {
    const sheets = guidanceGroups(subject.kind);
    return <div className={styles.printDocument}>{sheets.map((group) => <section className={styles.printPage} key={group.label}>
      {header(group.label)}
      <table className={styles.guidancePrint}><thead><tr><th>衛教指導內容</th><th>指導方式</th><th>執行日期／執行者</th><th>產婦簽名</th><th>評值日期／評值者</th><th>結果評值</th><th>瞭解日期</th></tr></thead><tbody>
        {group.items.map((entry, index) => {
          const keys = guidanceKeys(entry.key);
          const ways = blank ? [] : (Array.isArray(values[keys.ways]) ? values[keys.ways] as string[] : []);
          const signed = !blank && (Array.isArray(values[keys.signed]) ? values[keys.signed] as string[] : []).includes("已簽名");
          return <tr key={entry.key}>
            <th>{index + 1}. {entry.label}</th>
            <td>{GUIDANCE_WAYS[subject.kind].map((way) => <span className={styles.printOption} key={way}>{ways.includes(way) ? "●" : "○"}{way}</span>)}</td>
            <td>{blank ? "" : <>{text(values[keys.date])}<br />{text(values[keys.executor])}</>}</td>
            <td>{signed && document.signature ? <img src={document.signature} alt={entry.label + " 產婦簽名"} /> : ""}</td>
            <td>{blank ? "" : <>{text(values[keys.evalDate])}<br />{text(values[keys.evaluator])}</>}</td>
            <td>{blank ? "" : text(values[keys.result])}</td>
            <td>{blank ? "" : text(values[keys.understandDate])}</td>
          </tr>;
        })}
      </tbody></table>
      <p className={styles.printNote}>執行日期：{blank ? "　　　　　" : text(values.date)}　執行者：{blank ? "　　　　" : text(values.executor) || document.author}</p>
    </section>)}
    {subject.kind === "baby" && <section className={styles.printPage}>{header("備註")}<p className={styles.printValue}>{blank ? "" : text(values.baby_note)}</p></section>}
  </div>;
  }
  // 媽媽護理紀錄列印歷次全部紀錄，每筆印各自的填寫者（需求 G02／M05），不是只印目前這一筆。
  if (subject.kind === "mama" && form.key === "record") {
    const items = printItems(history, document, blank);
    const fields = form.sections.flatMap((section) => section.fields).filter((field) => ["executionNote", "continuousNote", "abnormal"].includes(field.key));
    return <div className={styles.printDocument}><section className={styles.printPage}>
      {header()}
      <table className={styles.matrixPrint}><thead><tr><th>日期時間</th>{fields.map((field) => <th key={field.key}>{field.label}</th>)}<th>紀錄人</th></tr></thead><tbody>
        {items.map((item) => <tr key={item.id}><td>{text(item.values.date)} {text(item.values.time)}</td>{fields.map((field) => <td key={field.key}>{text(item.values[field.key])}</td>)}<td>{item.author}</td></tr>)}
        {Array.from({ length: Math.max(0, 8 - items.length) }, (_, index) => <tr key={"blank-" + index}><td>　</td>{fields.map((field) => <td key={field.key}>　</td>)}<td>　</td></tr>)}
      </tbody></table>
      {!blank && items.map((item) => <div key={item.id}>{legacy(item.values)}</div>)}
    </section></div>;
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
