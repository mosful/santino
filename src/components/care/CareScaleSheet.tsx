import { scaleAnswerPatch, scaleQuestions, scaleResult, type ScaleKind } from "@/lib/care/scales";
import type { CareForm, CareValues } from "@/lib/care/types";
import CareFieldInput from "./CareFields";
import styles from "./CareSheet.module.css";

type Props = { form: CareForm; values: CareValues; onChange: (patch: CareValues) => void; personal: string[]; addPhrase: (value: string) => void };

export default function CareScaleSheet({ form, values, onChange, personal, addPhrase }: Props) {
  const kind = form.key as ScaleKind;
  const questions = scaleQuestions(kind);
  const result = scaleResult(kind, values);
  const fields = form.sections.flatMap((section) => section.fields);
  const field = (key: string) => fields.find((item) => item.key === key);
  const renderField = (key: string) => {
    const item = field(key);
    return item && <CareFieldInput key={key} field={item} values={values} onChange={onChange} personal={personal} addPhrase={addPhrase} />;
  };
  return <div className={styles.sheet} data-care-sheet="scale">
    <h3 className={styles.title}>{form.printTitle}</h3>
    <div className={styles.scaleMeta}>{renderField("date")}{renderField("birthDate")}</div>
    <div className={styles.scaleIntro}>
      {kind === "mood" ? <p>請依照您過去七天（不只是今天）的感受，選擇最接近的答案。每題只能選一個答案。</p> : <>
        <p>以下問題想瞭解您目前獲得的家庭及社會支持，請依實際情況選擇最接近的答案。</p>
        <p>本量表共 6 題，每題 1 至 5 分；第 4、5 題採反向計分，總分越高代表支持程度越好。</p>
      </>}
    </div>
    {kind === "social" ? <div className={styles.scaleSocialTable} role="table" aria-label="產婦家庭及社會支持量表題目">
      <div className={styles.scaleSocialHead} role="row"><span role="columnheader">題目</span>{questions[0].options.map((option) => <span role="columnheader" key={option.label}>{option.label}</span>)}</div>
      {questions.map((question, index) => <div key={question.key} className={styles.scaleSocialRow} role="radiogroup" aria-label={`第 ${index + 1} 題：${question.text}`}>
        <div className={styles.scaleSocialQuestion}><span>{index + 1}. {question.text}</span><button type="button" onClick={() => onChange(scaleAnswerPatch(kind, values, question.key, ""))}>清除</button></div>
        {question.options.map((option) => {
          const selected = values[question.key] === String(option.score);
          return <label key={`${option.label}-${option.score}`} data-selected={selected} className={styles.scaleSocialOption}>
            <input type="radio" name={`${form.key}-${question.key}`} checked={selected} onChange={() => onChange(scaleAnswerPatch(kind, values, question.key, String(option.score)))} />
            <span className={styles.scaleSocialMobileLabel}>{option.label}</span><strong>{option.score}</strong>
          </label>;
        })}
      </div>)}
    </div> : <ol className={styles.scaleQuestions} data-kind="mood">
      {questions.map((question, index) => <li key={question.key} className={styles.scaleQuestion}>
        <div className={styles.scaleQuestionHead}><span>{index + 1}. {question.text}</span><button type="button" onClick={() => onChange(scaleAnswerPatch(kind, values, question.key, ""))}>清除本題</button></div>
        <div className={styles.scaleOptions} role="radiogroup" aria-label={`第 ${index + 1} 題：${question.text}`}>
          {question.options.map((option, optionIndex) => {
            const selected = values[question.key] === String(option.score);
            return <label key={`${option.label}-${option.score}`} data-selected={selected} className={styles.scaleOption}>
              <input type="radio" name={`${form.key}-${question.key}`} checked={selected} onChange={() => onChange(scaleAnswerPatch(kind, values, question.key, String(option.score)))} />
              <span>{String.fromCharCode(97 + optionIndex)}. {option.label}</span><small>{option.score} 分</small>
            </label>;
          })}
        </div>
      </li>)}
    </ol>}
    <section className={styles.scaleResult} aria-live="polite">
      <div><span>作答進度</span><strong>{result.answered}／{result.totalQuestions} 題</strong></div>
      <div><span>量表總分</span><strong>{result.complete ? `${result.score} 分` : "完成全部題目後計算"}</strong></div>
      {kind === "mood" && <p>系統沿用院內提醒：總分達 13 分，或第 10 題達 2 分時，請依院內流程進一步關懷與處理。</p>}
    </section>
    <section className={styles.scaleFollowUp} aria-label="後續處理">{renderField("followUp")}</section>
  </div>;
}
