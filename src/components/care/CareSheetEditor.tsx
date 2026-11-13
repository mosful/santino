import type { CareEntry, CareForm, CareValues } from "@/lib/care/types";
import { growthDays } from "@/lib/care/summary";
import { FEEDING_GROUPS, sectionRows } from "@/lib/care/sheetDefinitions";
import { legacySheetFields } from "@/lib/care/sheetValues";
import CareFieldInput from "./CareFields";
import styles from "./CareSheet.module.css";

type Props = { form: CareForm; sectionIndex: number; values: CareValues; onChange: (patch: CareValues) => void; personal: string[]; addPhrase: (value: string) => void; subjectEntries?: CareEntry[]; onCarryFeeding?: () => void };

export default function CareSheetEditor(props: Props) {
  const { form, values, onChange, sectionIndex, personal, addPhrase, subjectEntries = [], onCarryFeeding } = props;
  const summary = form.layout === "growth" ? growthDays(subjectEntries) : [];
  const fields = form.sections.flatMap((section) => section.fields);
  const input = (key: string) => {
    const field = fields.find((item) => item.key === key);
    return field && <CareFieldInput key={field.key} field={field} values={values} onChange={onChange} personal={personal} addPhrase={addPhrase} />;
  };
  return <div className={styles.sheet} data-care-sheet={form.layout}>
    <h3 className={styles.title}>{form.printTitle}</h3>
    <div className={styles.meta}>{input("date")}{input("time")}</div>
    {form.layout === "feeding" ? <>
      <div className={styles.feedingHead}><span>觀察項目</span><span>哺餵順利之表現</span><span>哺餵困難之表現</span></div>
      {FEEDING_GROUPS.map((group) => <section key={group.code} aria-label={`${group.code} ${group.label}`}>
        <h4 className={styles.groupTitle}>{group.code}　{group.label}</h4>
        {group.rows.map(([positive, negative], index) => {
          const key = `breast-${group.code}${index + 1}`;
          return <div key={key} className={styles.feedingRow} role="radiogroup" aria-label={`${group.label} ${index + 1}`}>
            <span className={styles.itemNo}>{index + 1}</span>
            <label><input type="radio" name={`sheet-${key}`} checked={values[key] === "順利"} onChange={() => onChange({ [key]: "順利" })} />{positive}</label>
            <label><input type="radio" name={`sheet-${key}`} checked={values[key] === "困難"} onChange={() => onChange({ [key]: "困難" })} />{negative}</label>
            <button type="button" className={styles.clear} aria-label={`清除${group.label} ${index + 1}`} onClick={() => onChange({ [key]: "" })}>清除</button>
          </div>;
        })}
      </section>)}
      <div className={styles.meta}>{input("leftMinutes")}{input("rightMinutes")}{input("feedingResult")}</div>
      {input("feedingNote")}
    </> : form.sections.map((section, index) => <section key={section.label} hidden={index !== Math.min(sectionIndex, form.sections.length - 1)} aria-label={section.label}>
      <h4 className={styles.groupTitle}>{section.label}</h4>
      {sectionRows(section).map((row) => <div key={row.label} className={styles.row}>
        <div className={styles.rowLabel}>{row.label}</div>
        <div className={styles.rowFields}>{row.keys.map(input)}</div>
      </div>)}
    </section>)}
    {form.layout === "io" && onCarryFeeding && <p className="px-4 py-3 text-sm"><button type="button" className={styles.carry} onClick={onCarryFeeding}>帶入上一筆奶別與奶量</button>　時間、排尿與排便仍請依本次實況填寫。</p>}
    {form.layout === "growth" && <section className="mt-5" aria-label="每日彙整">
      <h4 className={styles.groupTitle}>每日彙整（由每日照護與 I/O 自動帶入）</h4>
      {summary.length === 0 ? <p className="px-4 py-3 text-sm text-stone-600">尚無已簽出的每日照護或 I/O 紀錄，簽出後此處會自動彙整。</p>
        : <div className={styles.summaryScroll}><table className={styles.summaryTable}><thead><tr><th>日期</th><th>體重 g</th><th>身長 cm</th><th>頭圍 cm</th><th>母乳 cc</th><th>配方奶 cc</th><th>總奶量 cc</th><th>親餵 分鐘</th><th>排尿 次</th><th>糊便 次</th><th>滲便 次</th><th>其他便 次</th></tr></thead><tbody>
          {summary.slice(0, 14).map((day) => <tr key={day.date}><th scope="row">{day.date}</th><td>{day.weight ?? ""}</td><td>{day.height ?? ""}</td><td>{day.head ?? ""}</td><td>{day.breastMilk}</td><td>{day.formula}</td><td>{day.totalMilk}</td><td>{day.breastMinutes}</td><td>{day.urine}</td><td>{day.stoolPaste}</td><td>{day.stoolLeak}</td><td>{day.stoolOther}</td></tr>)}
        </tbody></table></div>}
    </section>}
    {legacySheetFields(form, values).length > 0 && <section className="mt-5 space-y-3" aria-label="原有資料補充"><h4 className={styles.groupTitle}>原有資料補充</h4><p className="text-sm text-stone-600">換版前已填的內容保留於此；請核對新表單對應欄位。</p>{legacySheetFields(form, values).map((field) => <CareFieldInput key={field.key} field={field} values={values} onChange={onChange} personal={personal} addPhrase={addPhrase} />)}</section>}
  </div>;
}
