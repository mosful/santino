import type { CareForm, CareValues } from "@/lib/care/types";
import { FEEDING_GROUPS, sectionRows } from "@/lib/care/sheetDefinitions";
import { legacySheetFields } from "@/lib/care/sheetValues";
import CareFieldInput from "./CareFields";
import styles from "./CareSheet.module.css";

type Props = { form: CareForm; sectionIndex: number; values: CareValues; onChange: (patch: CareValues) => void; personal: string[]; addPhrase: (value: string) => void };

export default function CareSheetEditor(props: Props) {
  const { form, values, onChange, sectionIndex, personal, addPhrase } = props;
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
    {legacySheetFields(form, values).length > 0 && <section className="mt-5 space-y-3" aria-label="原有資料補充"><h4 className={styles.groupTitle}>原有資料補充</h4><p className="text-sm text-stone-600">換版前已填的內容保留於此；請核對新表單對應欄位。</p>{legacySheetFields(form, values).map((field) => <CareFieldInput key={field.key} field={field} values={values} onChange={onChange} personal={personal} addPhrase={addPhrase} />)}</section>}
  </div>;
}
