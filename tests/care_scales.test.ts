import assert from "node:assert/strict";
import { test } from "node:test";
import { MAMA_FORMS } from "../src/lib/care/forms";
import { MOOD_QUESTIONS, SOCIAL_QUESTIONS, scaleAnswerPatch, scaleResult } from "../src/lib/care/scales";
import type { CareValues } from "../src/lib/care/types";

test("量表改用原生表單與列印版面，不再指定掃描紙本母版", () => {
  for (const key of ["social", "mood"]) {
    const form = MAMA_FORMS.find((item) => item.key === key);
    assert.equal(form?.layout, "scale");
    assert.equal(form?.paperTemplate, undefined);
    assert.ok(form?.sections.flatMap((section) => section.fields).every((field) => field.type !== "photo"));
    assert.equal(form?.sections[0].fields.find((field) => field.key === "birthDate")?.label, "生產日期");
  }
});

test("產後心情量表十題依院方原紙本選項配分", () => {
  assert.equal(MOOD_QUESTIONS.length, 10);
  assert.deepEqual(MOOD_QUESTIONS[0].options.map((option) => option.score), [0, 1, 2, 3]);
  assert.deepEqual(MOOD_QUESTIONS[2].options.map((option) => option.score), [3, 2, 1, 0]);
  assert.deepEqual(MOOD_QUESTIONS[3].options.map((option) => option.score), [0, 1, 2, 3]);
  assert.deepEqual(MOOD_QUESTIONS[9].options.map((option) => option.score), [3, 2, 1, 0]);
  const values = Object.fromEntries(MOOD_QUESTIONS.map((question) => [question.key, "3"]));
  assert.deepEqual(scaleResult("mood", values), { answered: 10, totalQuestions: 10, complete: true, score: 30 });
});

test("家庭及社會支持量表第 4、5 題採反向計分", () => {
  assert.equal(SOCIAL_QUESTIONS.length, 6);
  assert.deepEqual(SOCIAL_QUESTIONS[0].options.map((option) => option.score), [1, 2, 3, 4, 5]);
  assert.deepEqual(SOCIAL_QUESTIONS[3].options.map((option) => option.score), [5, 4, 3, 2, 1]);
  assert.deepEqual(SOCIAL_QUESTIONS[4].options.map((option) => option.score), [5, 4, 3, 2, 1]);
});

test("未完成全部題目不產生總分，完成後同步第十題與總分", () => {
  let values: CareValues = {};
  for (const question of MOOD_QUESTIONS) values = { ...values, ...scaleAnswerPatch("mood", values, question.key, "2") };
  assert.equal(values.score, "20");
  assert.equal(values.question10, "2");
  values = { ...values, ...scaleAnswerPatch("mood", values, "scaleQ1", "") };
  assert.equal(values.score, "");
});
