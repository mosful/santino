import { test } from "node:test";
import assert from "node:assert/strict";
import { DOMAIN_SEED } from "../src/lib/demo/domainSeed";
import { DEFAULT_VIEWING_SETTINGS, migrateViewingSettings, viewingSettingsOf } from "../src/lib/babycam/viewingSettings";
import { viewingBlock } from "../src/lib/babycam/viewing";

test("開放時段預設為全院與院內 10–22、親友 10–20，同時觀看兩位", () => {
  assert.deepEqual(viewingSettingsOf(DOMAIN_SEED), DEFAULT_VIEWING_SETTINGS);
  const data = structuredClone(DOMAIN_SEED);
  const binding = data.bindings[0];
  const baby = binding.babies[0];
  data.disinfections = [];
  for (const audience of ["internal", "family"] as const) {
    assert.match(viewingBlock(data, binding, baby, audience, new Date("2026-10-16T09:59:00+08:00"))!, /非開放時段/);
    assert.equal(viewingBlock(data, binding, baby, audience, new Date("2026-10-16T10:00:00+08:00")), null);
  }
  assert.equal(viewingBlock(data, binding, baby, "internal", new Date("2026-10-16T20:01:00+08:00")), null);
  assert.match(viewingBlock(data, binding, baby, "family", new Date("2026-10-16T20:01:00+08:00"))!, /非開放時段/);
  assert.match(viewingBlock(data, binding, baby, "internal", new Date("2026-10-16T22:01:00+08:00"))!, /非開放時段/);
});

test("舊版預設局部升級，不清除案件、寶寶與觀看授權", () => {
  const data = structuredClone(DOMAIN_SEED);
  delete data.viewingSettingsRevision;
  data.houseWindow = { mode: "always", start: "00:00", end: "23:59" };
  data.enforceInternal = false;
  data.enforceFamily = false;
  const cases = structuredClone(data.cases);
  const bindings = structuredClone(data.bindings);
  migrateViewingSettings(data);
  assert.deepEqual(viewingSettingsOf(data), DEFAULT_VIEWING_SETTINGS);
  assert.deepEqual(data.cases, cases);
  assert.deepEqual(data.bindings, bindings);
  assert.equal(data.viewingSettingsRevision, 1);
});

test("升級保留已自訂的指定時間與開關，後續不重複覆寫", () => {
  const data = structuredClone(DOMAIN_SEED);
  delete data.viewingSettingsRevision;
  data.houseWindow = { mode: "scheduled", start: "09:00", end: "23:00" };
  data.familyWindow = { mode: "scheduled", start: "11:00", end: "19:00" };
  data.enforceFamily = false;
  data.familyLimit = 4;
  const before = viewingSettingsOf(data);
  migrateViewingSettings(data);
  assert.deepEqual(viewingSettingsOf(data), before);
  data.familyLimit = 3;
  migrateViewingSettings(data);
  assert.equal(data.familyLimit, 3);
});
