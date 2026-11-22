"use client";

import { useState } from "react";
import { GUIDANCE_RESULTS, GUIDANCE_WAYS, guidanceActions, guidanceExtraStore, guidanceGroups, guidanceKeys, guidanceOverdue } from "@/lib/care/guidance";
import { todayTaipei } from "@/lib/dates";
import { careActions } from "@/lib/care/store";
import { canAuthorizeCare } from "@/lib/care/rules";
import { useCurrentRole } from "@/lib/roleStore";
import { ROLE_PROFILE } from "@/lib/permissions";

// 人員可從名單挑選（需求 G02），仍可手動輸入；選定姓名與實際操作者（簽出人）分開保存。
const STAFF_NAMES = Object.values(ROLE_PROFILE).map((profile) => profile.fullName);
import type { CareKind, CareValues } from "@/lib/care/types";
import { buttonStyles } from "@/components/ui/buttonStyles";
import styles from "./CareSheet.module.css";

type Props = {
  kind: CareKind;
  values: CareValues;
  onChange: (patch: CareValues) => void;
  currentUser: string;
  notify: (action: () => void, message?: string) => void;
};

const text = (value: CareValues[string] | undefined) => Array.isArray(value) ? value.join("、") : value ?? "";
const list = (value: CareValues[string] | undefined) => Array.isArray(value) ? value : value ? [value] : [];

export default function CareGuidanceSheet({ kind, values, onChange, currentUser, notify }: Props) {
  const role = useCurrentRole();
  const extras = guidanceExtraStore.useStore().data;
  const [newItem, setNewItem] = useState("");
  const groups = guidanceGroups(kind, extras);
  const today = todayTaipei();
  const overdue = guidanceOverdue(kind, values, today, undefined, extras);
  const taught = groups.flatMap((group) => group.items).filter((item) => list(values[guidanceKeys(item.key).ways]).length);

  /* 院方原表的「全選」：一次把本次執行資訊帶到各列，不必逐列重打。
     只套用到已勾選指導方式的項目——否則會替沒教過的項目蓋上執行日期。 */
  function fillExecution() {
    if (!taught.length) throw new Error("請先勾選要帶入的項目指導方式。");
    const patch: CareValues = {};
    for (const item of taught) { const keys = guidanceKeys(item.key); patch[keys.date] = text(values.date) || today; patch[keys.executor] = text(values.executor) || currentUser; }
    onChange(patch);
  }
  function fillEvaluation() {
    const done = taught.filter((item) => text(values[guidanceKeys(item.key).date]) && !text(values[guidanceKeys(item.key).evalDate]));
    if (!done.length) throw new Error("沒有待填評值的項目。");
    const patch: CareValues = {};
    for (const item of done) { const keys = guidanceKeys(item.key); patch[keys.evalDate] = today; patch[keys.evaluator] = currentUser; }
    onChange(patch);
  }

  return <div className={styles.sheet} data-care-sheet="guidance">
    <div className={styles.guidanceBar} data-no-print>
      <label className={styles.guidanceField}>執行日期<input type="date" value={text(values.date)} onChange={(event) => onChange({ date: event.target.value })} /></label>
      <label className={styles.guidanceField}>執行者<input type="text" list="care-staff-names" value={text(values.executor) || currentUser} onChange={(event) => onChange({ executor: event.target.value })} /></label><datalist id="care-staff-names">{STAFF_NAMES.map((name) => <option key={name} value={name} />)}</datalist>
      <button type="button" className={buttonStyles({ size: "sm" })} onClick={() => notify(fillExecution, "已帶入執行日期與執行者。")}>帶入執行日期／執行者</button>
      <button type="button" className={buttonStyles({ size: "sm" })} onClick={() => notify(fillEvaluation, "已帶入評值日期與評值者。")}>評值日期／評值者全選</button>
    </div>
    {overdue.length > 0 && <p role="status" className={styles.guidanceAlert}>下列項目指導後已超過 7 日仍無結果評值，請補評值：{overdue.map((item) => item.label).join("、")}。（起訖計日與例外規則待院方確認，此處僅提醒不擋簽出。）</p>}
    {groups.map((group) => <section key={group.label} aria-label={group.label}>
      <h4 className={styles.groupTitle}>{group.label}</h4>
      <div className={styles.guidanceScroll}>
        <table className={styles.guidanceTable}>
          <thead><tr><th scope="col">衛教指導內容</th><th scope="col">指導方式</th><th scope="col">執行日期／執行者</th><th scope="col">評值日期／評值者</th><th scope="col">結果評值</th><th scope="col">瞭解日期</th></tr></thead>
          <tbody>{group.items.map((item, index) => {
            const keys = guidanceKeys(item.key);
            const ways = list(values[keys.ways]);
            return <tr key={item.key}>
              <th scope="row">{index + 1}. {item.label}{item.key.startsWith("extra-") && canAuthorizeCare(role) && <button type="button" className={styles.clear} data-no-print onClick={() => notify(() => careActions.removeGuidanceItem(kind, item.key), "已移除新增的衛教項目。")}>移除</button>}</th>
              <td><div role="group" aria-label={`${item.label} 指導方式`} className={styles.guidanceWays}>{GUIDANCE_WAYS[kind].map((way) => <label key={way}><input type="checkbox" checked={ways.includes(way)} onChange={() => onChange({ [keys.ways]: ways.includes(way) ? ways.filter((value) => value !== way) : [...ways, way], ...(!ways.includes(way) && !text(values[keys.date]) ? { [keys.date]: text(values.date) || today, [keys.executor]: text(values[keys.executor]) || text(values.executor) || currentUser } : {}) })} />{way}</label>)}</div></td>
              <td><input type="date" aria-label={`${item.label} 執行日期`} value={text(values[keys.date])} onChange={(event) => onChange({ [keys.date]: event.target.value })} /><input type="text" list="care-staff-names" aria-label={`${item.label} 執行者`} value={text(values[keys.executor])} onChange={(event) => onChange({ [keys.executor]: event.target.value })} /></td>
              <td><input type="date" aria-label={`${item.label} 評值日期`} value={text(values[keys.evalDate])} onChange={(event) => onChange({ [keys.evalDate]: event.target.value })} /><input type="text" list="care-staff-names" aria-label={`${item.label} 評值者`} value={text(values[keys.evaluator])} onChange={(event) => onChange({ [keys.evaluator]: event.target.value })} /></td>
              <td><select aria-label={`${item.label} 結果評值`} value={text(values[keys.result])} onChange={(event) => onChange({ [keys.result]: event.target.value })}><option value="">---</option>{GUIDANCE_RESULTS.map((result) => <option key={result}>{result}</option>)}</select></td>
              <td><input type="date" aria-label={`${item.label} 瞭解日期`} value={text(values[keys.understandDate])} onChange={(event) => onChange({ [keys.understandDate]: event.target.value })} /></td>
            </tr>;
          })}</tbody>
        </table>
      </div>
    </section>)}
    {kind === "baby" && <section aria-label="備註"><h4 className={styles.groupTitle}>備註</h4><div className="p-4"><textarea aria-label="備註" value={text(values.baby_note)} onChange={(event) => onChange({ baby_note: event.target.value })} className={styles.guidanceNote} /></div></section>}
    {/* 2026-11-20 會議：產婦簽名不逐項簽，於本表最下方「本筆簽名」簽一次（G07 修訂）。 */}
    <p className="px-4 pt-3 text-sm text-stone-600" data-no-print>產婦簽名於本表最下方簽一次，不逐項簽名。</p>
    <section className="p-4" data-no-print aria-label="新增衛教項目">
      <h4 className="mb-2 text-sm font-medium">新增衛教項目</h4>
      <p className="mb-2 text-xs text-stone-600">新增的項目接在最後一組，不改院方原表的題序；已簽出的舊紀錄不受影響。</p>
      <div className="flex flex-wrap gap-2">
        <input type="text" aria-label="新增衛教項目名稱" value={newItem} onChange={(event) => setNewItem(event.target.value)} className={styles.guidanceNewItem} />
        <button type="button" className={buttonStyles({ size: "sm" })} onClick={() => notify(() => { guidanceActions.add(kind, newItem); setNewItem(""); }, "已新增衛教項目。")}>新增</button>
      </div>
    </section>
  </div>;
}
