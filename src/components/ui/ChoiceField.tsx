"use client";

import { buttonStyles } from "./buttonStyles";

/** 少量選項直接顯示；維持與原選單相同的單選值。 */
export default function ChoiceField({ label, value, options, onChange, required = false, hint }: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
  required?: boolean;
  hint?: string;
}) {
  return <fieldset className="choice-field">
    <legend>{label}{required && <em aria-hidden="true">*</em>}{hint && <span>{hint}</span>}</legend>
    <div className="flex flex-wrap gap-2">{options.map((option) => <button key={option} type="button" aria-pressed={value === option} className={buttonStyles({ size: "sm", selected: value === option })} onClick={() => onChange(option)}>{option}</button>)}</div>
  </fieldset>;
}
