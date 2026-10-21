"use client";

import { createPersistentStore } from "../demo/persistentStore";
import { getCurrentRole } from "../roleStore";
import { ROLE_PROFILE } from "../permissions";
import { domainStore } from "../demo/domainStore";
import { careForms } from "./forms";
import { careSubject } from "./subjects";
import { canAuthorizeCare, canEditCare, canViewCare, documentKey, isBackfillExpired, validateCareForm } from "./rules";
import type { CareDocument, CareKind, CareSignatureRole, CareState, CareValues } from "./types";

const initial: CareState = { version: 1, documents: {}, open: [], active: { mama: null, baby: null }, unlockedCase: null, entries: [], events: [], authorizations: {}, personalPhrases: {}, backfillDays: 3 };
function valid(value: unknown): value is CareState {
  if (!value || typeof value !== "object") return false;
  const state = value as CareState;
  return state.version === 1 && !!state.documents && Array.isArray(state.open) && !!state.active && Array.isArray(state.entries) && Array.isArray(state.events) && !!state.authorizations && !!state.personalPhrases && Number.isFinite(state.backfillDays);
}
export const careStore = createPersistentStore("santino_care_workspace_v1", initial, valid);
export const useCareStore = careStore.useStore;
const author = () => `${ROLE_PROFILE[getCurrentRole()].name}（${getCurrentRole()}）`;
const now = () => new Date().toISOString();

function stamp(state: CareState, subjectId: string, action: string) {
  state.events.unshift({ id: crypto.randomUUID(), at: now(), subjectId, action, author: author() });
}
function writable(state: CareState, key: string): CareDocument {
  const document = state.documents[key];
  const subject = document && careSubject(document.subjectId);
  if (!document || !subject || !canEditCare(getCurrentRole(), subject.kind, document.formKey)) throw new Error("目前角色不能編輯此表單。");
  if (state.unlockedCase !== subject.caseId) throw new Error("此對象目前為唯讀，請先解鎖編輯。");
  if (isBackfillExpired(subject, state.backfillDays) && !state.authorizations[subject.id]) throw new Error("已超過回補期限，請由護理長或管理員填寫原因授權。");
  if (document.signedAt) throw new Error("此筆已完成簽出，請新增一筆紀錄。");
  return document;
}
export function defaultCareValues() {
  const at = new Date();
  return { date: at.toLocaleDateString("en-CA", { timeZone: "Asia/Taipei" }), time: at.toLocaleTimeString("en-GB", { timeZone: "Asia/Taipei", hour12: false }).slice(0, 5) };
}
export const careActions = {
  open(subjectId: string, formKey: string) {
    const subject = careSubject(subjectId);
    if (!subject || !careForms(subject.kind).some((form) => form.key === formKey)) return;
    if (!canViewCare(getCurrentRole(), subject.kind, formKey)) throw new Error("目前角色沒有此照護表單的權限。");
    careStore.update((state) => {
      const key = documentKey(subjectId, formKey);
      const defaults: CareValues = { ...defaultCareValues(), ...(subject.birthDate ? { birthDate: subject.birthDate } : {}), ...(subject.gender ? { sex: subject.gender } : {}) };
      if (subject.birthOrder !== undefined) defaults.birthOrder = String(subject.birthOrder);
      if (formKey === "feeding") for (let index = 0; index < 6; index++) defaults[`feeding-${index}`] = "通過";
      state.documents[key] ??= { key, subjectId, formKey, values: defaults, dirty: false };
      if (!state.open.includes(key)) state.open.push(key);
      state.active[subject.kind] = key;
      if (!state.unlockedCase) state.unlockedCase = subject.caseId;
    });
  },
  activate(key: string) {
    careStore.update((state) => { const subject = careSubject(state.documents[key]?.subjectId); if (subject && state.open.includes(key)) state.active[subject.kind] = key; });
  },
  change(key: string, patch: CareValues) {
    careStore.update((state) => { const document = writable(state, key); Object.assign(document.values, patch); document.dirty = true; });
  },
  unlock(key: string) {
    careStore.update((state) => {
      const document = state.documents[key];
      const subject = document && careSubject(document.subjectId);
      if (!subject || !canEditCare(getCurrentRole(), subject.kind, document.formKey)) throw new Error("目前角色不能解鎖此表單。");
      state.unlockedCase = subject.caseId;
      stamp(state, subject.id, "解鎖編輯；其他對象改為唯讀，草稿保留");
    });
  },
  save(key: string) {
    careStore.update((state) => { const document = writable(state, key); document.savedAt = now(); document.values.time = new Date(document.savedAt).toLocaleTimeString("en-GB", { timeZone: "Asia/Taipei", hour12: false }).slice(0, 5); document.author = author(); document.dirty = false; stamp(state, document.subjectId, `暫存 ${document.formKey}`); });
  },
  sign(key: string, signature: string) {
    careStore.update((state) => { const document = writable(state, key); document.signature = signature; document.signatures = { ...document.signatures, recipient: signature }; document.dirty = true; });
  },
  signRole(key: string, role: CareSignatureRole, signature: string) {
    careStore.update((state) => { const document = writable(state, key); document.signatures = { ...document.signatures, [role]: signature }; if (role === "recipient") document.signature = signature; document.dirty = true; });
  },
  carryContractSignature(key: string) {
    careStore.update((state) => {
      const document = writable(state, key);
      const subject = careSubject(document.subjectId)!;
      const record = domainStore.get().cases.find((item) => item.id === subject.caseId);
      if (!record?.signed || !record.signature) throw new Error("本案尚無已簽署的合約媽媽簽名，請在本頁簽名。");
      if (record.proxySigned) throw new Error("本案合約由家屬代簽，請於本頁確認媽媽本人簽名。");
      document.signature = record.signature; document.signatures = { ...document.signatures, recipient: record.signature }; document.dirty = true;
      stamp(state, subject.id, `確認本案媽媽 ${record.name}，帶入合約媽媽簽名`);
    });
  },
  carrySubjectSignature(key: string) {
    careStore.update((state) => { const document = writable(state, key); const previous = state.entries.find((entry) => entry.subjectId === document.subjectId && entry.signature); if (!previous?.signature) throw new Error("此照護對象尚無已簽出簽名，請於本頁簽名。"); document.signature = previous.signature; document.signatures = { ...document.signatures, recipient: previous.signature }; document.dirty = true; stamp(state, document.subjectId, "確認相同照護對象，帶入上一筆媽媽簽名"); });
  },
  complete(key: string) {
    careStore.update((state) => {
      const document = writable(state, key);
      const subject = careSubject(document.subjectId)!;
      const form = careForms(subject.kind).find((item) => item.key === document.formKey)!;
      const errors = validateCareForm(form, document.values);
      if (form.signature && !document.signature) errors.push("請先確認對象並完成本筆簽名。");
      if (form.key === "guidance" && ["recipient", "executor", "evaluator"].some((role) => !document.signatures?.[role as CareSignatureRole])) errors.push("護理指導單須完成媽媽／家屬、執行者及評值者三方簽名。");
      if (errors.length) throw new Error(errors.join("\n"));
      const at = now();
      document.values.time = new Date(at).toLocaleTimeString("en-GB", { timeZone: "Asia/Taipei", hour12: false }).slice(0, 5);
      document.signedAt = at; document.savedAt = at; document.author = author(); document.dirty = false;
      document.staffStamp = { author: author(), at };
      state.entries.unshift({ id: crypto.randomUUID(), subjectId: subject.id, formKey: form.key, at, author: author(), values: structuredClone(document.values), signature: document.signature, signatures: structuredClone(document.signatures ?? {}), staffStamp: document.staffStamp, historical: !!subject.historical });
      stamp(state, subject.id, `${form.label}完成簽出${subject.historical ? "（退房回補）" : ""}`);
    });
  },
  newEntry(key: string) {
    careStore.update((state) => {
      const old = state.documents[key];
      const subject = old && careSubject(old.subjectId);
      if (!subject || !canEditCare(getCurrentRole(), subject.kind, old.formKey)) throw new Error("目前角色不能新增紀錄。");
      if (!old.signedAt && old.dirty) throw new Error("請先暫存或關閉目前草稿。");
      state.documents[key] = { key, subjectId: old.subjectId, formKey: old.formKey, values: defaultCareValues(), dirty: false };
    });
  },
  carryLast(key: string) {
    careStore.update((state) => {
      const document = writable(state, key);
      const last = state.entries.find((entry) => entry.subjectId === document.subjectId && entry.formKey === document.formKey);
      if (!last) throw new Error("此個案目前沒有上一筆紀錄。");
      document.values = { ...structuredClone(last.values), ...defaultCareValues() }; document.dirty = true;
    });
  },
  close(key: string, discard = false) {
    careStore.update((state) => {
      const document = state.documents[key];
      if (!document) return;
      if (discard && !document.signedAt) delete state.documents[key];
      state.open = state.open.filter((item) => item !== key);
      const subject = careSubject(document.subjectId);
      if (subject && state.active[subject.kind] === key) state.active[subject.kind] = state.open.findLast((item) => careSubject(state.documents[item]?.subjectId)?.kind === subject.kind) ?? null;
      if (!state.open.some((item) => careSubject(state.documents[item]?.subjectId)?.caseId === state.unlockedCase)) state.unlockedCase = null;
    });
  },
  /**
   * 關閉某位照護對象的**所有**表單（房間層級的關閉）。
   *
   * 表單列是「一間房一組頁籤」，關閉的單位是房間而不是單張表單，
   * 所以一次處理完再重算 active，避免逐張 close 時 active 連續跳好幾次。
   */
  closeSubject(subjectId: string, discard = false) {
    careStore.update((state) => {
      const subject = careSubject(subjectId);
      if (!subject) return;
      const keys = state.open.filter((key) => state.documents[key]?.subjectId === subjectId);
      for (const key of keys) {
        if (discard && !state.documents[key]?.signedAt) delete state.documents[key];
      }
      state.open = state.open.filter((key) => !keys.includes(key));
      if (state.active[subject.kind] && keys.includes(state.active[subject.kind]!)) {
        state.active[subject.kind] =
          state.open.findLast((key) => careSubject(state.documents[key]?.subjectId)?.kind === subject.kind) ?? null;
      }
      if (!state.open.some((key) => careSubject(state.documents[key]?.subjectId)?.caseId === state.unlockedCase)) {
        state.unlockedCase = null;
      }
    });
  },
  closeAll(kind: CareKind) {
    careStore.update((state) => { state.open = state.open.filter((key) => careSubject(state.documents[key]?.subjectId)?.kind !== kind); state.active[kind] = null; state.unlockedCase = null; });
  },
  switchRole() { careStore.update((state) => { state.open = []; state.active = { mama: null, baby: null }; state.unlockedCase = null; state.lastRole = getCurrentRole(); }); },
  syncRole() { if (careStore.get().lastRole !== getCurrentRole()) { if (careStore.get().lastRole) careActions.switchRole(); else careStore.update((state) => { state.lastRole = getCurrentRole(); }); } },
  viewport(key: string, patch: Partial<{ sectionIndex: number; scrollY: number }>) { careStore.update((state) => { const document = state.documents[key]; if (document) document.viewport = { sectionIndex: 0, scrollY: 0, ...document.viewport, ...patch }; }); },
  backfillDays(days: number) { if (!canAuthorizeCare(getCurrentRole())) throw new Error("僅護理長及管理員可設定回補期限。"); if (!Number.isInteger(days) || days < 0 || days > 30) throw new Error("回補天數請填 0 至 30。"); careStore.update((state) => { state.backfillDays = days; }); },
  authorize(subjectId: string, reason: string) {
    if (!canAuthorizeCare(getCurrentRole())) throw new Error("只有護理長與管理員能授權回補。");
    if (!reason.trim()) throw new Error("請填寫授權原因。");
    careStore.update((state) => { state.authorizations[subjectId] = { reason: reason.trim(), author: author(), at: now() }; stamp(state, subjectId, `授權退房回補：${reason.trim()}`); });
  },
  addPhrase(phrase: string) {
    if (!phrase.trim()) throw new Error("請先輸入常用語。");
    careStore.update((state) => { const key = getCurrentRole(); state.personalPhrases[key] = [...new Set([phrase.trim(), ...(state.personalPhrases[key] ?? [])])]; });
  },
  workOrder(key: string, reason: string) {
    if (!reason.trim()) throw new Error("請填寫工單內容。");
    careStore.update((state) => { const document = writable(state, key); stamp(state, document.subjectId, `建立示範工單：${reason.trim()}`); });
  },
};
