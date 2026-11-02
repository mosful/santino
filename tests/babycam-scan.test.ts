import { test } from "node:test";
import assert from "node:assert/strict";
import { expectedReturnBaby, readIdentityCode } from "../src/lib/babycam/scan";
import type { ViewingBinding } from "../src/lib/domain/types";

const babies = [1, 2, 3].map((n) => ({ babyId: `baby-${n}`, identityCode: `DEMO-${n}`, cameraId: `camera-${n}`, cartNo: `C${n}`, state: "normal", careMode: true, birthOrder: n }));
const binding = { babies } as ViewingBinding;

test("單胞胎自動帶入，多胞胎須選擇或使用有效的標籤深連結", () => {
  assert.equal(expectedReturnBaby({ ...binding, babies: [babies[0]] }, "")?.babyId, "baby-1");
  assert.equal(expectedReturnBaby(binding, ""), undefined);
  assert.equal(expectedReturnBaby(binding, "baby-3")?.babyId, "baby-3");
  assert.equal(expectedReturnBaby(binding, "", "DEMO-2")?.babyId, "baby-2");
  assert.equal(expectedReturnBaby(binding, "baby-3", "DEMO-2")?.babyId, "baby-3");
});

test("其他案件或已解除指派的寶寶不能沿用為核對對象", () => {
  assert.equal(expectedReturnBaby(binding, "other-baby"), undefined);
  assert.equal(expectedReturnBaby(binding, "", "DEMO-REMOVED"), undefined);
  assert.equal(expectedReturnBaby({ ...binding, babies: [] }, "baby-1"), undefined);
  assert.equal(expectedReturnBaby(undefined, "baby-1"), undefined);
});

test("掃碼支援識別碼及根目錄／子路徑的既有標籤網址", () => {
  assert.equal(readIdentityCode(" DEMO-1 "), "DEMO-1");
  assert.equal(readIdentityCode("https://example.test/babycam/scan/?code=DEMO-2"), "DEMO-2");
  assert.equal(readIdentityCode("https://example.test/demo/babycam/scan?code=DEMO-3"), "DEMO-3");
  assert.equal(readIdentityCode("/babycam/scan/?code=DEMO-1"), "DEMO-1");
  for (const raw of ["", "https://example.test/view/mama/?code=DEMO-1", "https://example.test/babycam/scan/", "<script>", "javascript:alert(1)"]) {
    assert.throws(() => readIdentityCode(raw));
  }
});
