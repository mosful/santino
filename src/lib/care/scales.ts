import type { CareForm, CareValues } from "./types";

export const SCALE_VERSION = "20261117";

export type ScaleKind = "mood" | "social";
export type ScaleOption = { label: string; score: number };
export type ScaleQuestion = { key: string; text: string; options: ScaleOption[] };

const moodPositive = [
  { label: "同以前一樣", score: 0 },
  { label: "沒有以前那麼多", score: 1 },
  { label: "肯定比以前少", score: 2 },
  { label: "完全不能", score: 3 },
];
const moodNegative = [
  { label: "總是如此", score: 3 },
  { label: "時常如此", score: 2 },
  { label: "偶爾如此", score: 1 },
  { label: "從未如此", score: 0 },
];

export const MOOD_QUESTIONS: ScaleQuestion[] = [
  { key: "scaleQ1", text: "我能看到事物有趣的一面，並笑得開心", options: moodPositive },
  { key: "scaleQ2", text: "我欣然期待未來的一切", options: moodPositive },
  { key: "scaleQ3", text: "當事情出錯時，我會完全責備自己", options: moodNegative },
  { key: "scaleQ4", text: "我無緣無故感到焦慮和擔心", options: [
    { label: "從未如此", score: 0 }, { label: "偶爾如此", score: 1 }, { label: "時常如此", score: 2 }, { label: "總是如此", score: 3 },
  ] },
  { key: "scaleQ5", text: "我無緣無故感到害怕和驚慌", options: moodNegative },
  { key: "scaleQ6", text: "很多事情衝著我來，使我透不過氣", options: moodNegative },
  { key: "scaleQ7", text: "我很不開心，以致失眠", options: moodNegative },
  { key: "scaleQ8", text: "我感到難過和悲傷", options: moodNegative },
  { key: "scaleQ9", text: "我不開心到哭泣", options: moodNegative },
  { key: "scaleQ10", text: "我有想過要傷害自己", options: moodNegative },
];

const socialLabels = ["沒有", "很少", "一些時候是", "大部份是", "總是"];
export const SOCIAL_QUESTIONS: ScaleQuestion[] = [
  "我有能支持我的好朋友。",
  "當我需要時，我的家人能提供協助。",
  "我的先生／伴侶可以幫助我許多事情。",
  "我與先生／伴侶之間有衝突。",
  "我有被先生／伴侶所控制，而失去自己的感覺。",
  "我能感受到先生／伴侶的愛。",
].map((text, index) => ({
  key: `scaleQ${index + 1}`,
  text,
  options: socialLabels.map((label, optionIndex) => ({ label, score: [3, 4].includes(index) ? 5 - optionIndex : optionIndex + 1 })),
}));

export const scaleQuestions = (kind: ScaleKind) => kind === "mood" ? MOOD_QUESTIONS : SOCIAL_QUESTIONS;

export function scaleResult(kind: ScaleKind, values: CareValues) {
  const questions = scaleQuestions(kind);
  const scores = questions.map((question) => {
    const value = values[question.key];
    return typeof value === "string" && value !== "" && Number.isFinite(Number(value)) ? Number(value) : undefined;
  });
  const answered = scores.filter((score): score is number => score !== undefined).length;
  return { answered, totalQuestions: questions.length, complete: answered === questions.length, score: scores.reduce<number>((sum, score) => sum + (score ?? 0), 0) };
}

export function scaleAnswerPatch(kind: ScaleKind, values: CareValues, key: string, value: string): CareValues {
  const next = { ...values, [key]: value };
  const result = scaleResult(kind, next);
  return {
    [key]: value,
    score: result.complete ? String(result.score) : "",
    ...(kind === "mood" ? { question10: key === "scaleQ10" ? value : String(next.scaleQ10 ?? "") } : {}),
  };
}

export function scaleForm(kind: ScaleKind): CareForm {
  const mood = kind === "mood";
  return {
    key: kind,
    label: mood ? "心情量表" : "社會支持",
    layout: "scale",
    printTitle: mood ? "產後心情量表" : "產婦家庭及社會支持量表",
    templateVersion: SCALE_VERSION,
    sections: [
      { label: "基本資料", fields: [
        { key: "date", label: "填寫日期", type: "date", required: true },
        { key: "birthDate", label: "生日", type: "date" },
      ] },
      { label: "量表題目", fields: scaleQuestions(kind).map((question, index) => ({ key: question.key, label: `第 ${index + 1} 題：${question.text}`, type: "radio", options: question.options.map((option) => String(option.score)), required: true })) },
      { label: "評分與後續處理", fields: [
        { key: "score", label: "總分", type: "number", min: mood ? 0 : 6, max: 30 },
        ...(mood ? [{ key: "question10", label: "第 10 題得分", type: "number" as const, min: 0, max: 3 }] : []),
        { key: "followUp", label: "後續處理內容", type: "textarea" },
      ] },
    ],
  };
}
