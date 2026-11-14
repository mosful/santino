import { test } from "node:test";
import assert from "node:assert/strict";
import { fuzzyScore, searchCaseStages } from "../src/lib/domain/caseStageSearch";

test("欄位模糊搜尋：連續包含優先，子序列也能找到", () => {
  assert.ok(fuzzyScore("收字第○號（合約編號）", "合約編號") > fuzzyScore("收字第○號（合約編號）", "收號"));
  assert.ok(fuzzyScore("收字第○號（合約編號）", "收號") > 0);
  assert.equal(fuzzyScore("訂金", "房號"), 0);
  assert.equal(fuzzyScore("訂金", "  "), 0);
});

test("搜尋結果帶出所屬階段，階段名稱本身也搜得到", () => {
  assert.equal(searchCaseStages("訂金")[0]?.stage, 2);
  assert.equal(searchCaseStages("退房")[0]?.stage, 6);
  const signed = searchCaseStages("簽約日")[0];
  assert.equal(signed?.stage, 3);
  assert.equal(signed?.step, "審閱期與入住日");
  assert.equal(searchCaseStages("媽媽姓名")[0]?.stage, -1);
  assert.deepEqual(searchCaseStages("zzzz"), []);
});
