"use client";

import { useState } from "react";
import { Users } from "lucide-react";
import QueryList, { type Column } from "@/components/ui/QueryList";
import Modal from "@/components/ui/Modal";
import Badge from "@/components/ui/Badge";
import PlaceholderNotice from "@/components/ui/PlaceholderNotice";
import Link from "next/link";
import { useDomainStore } from "@/lib/demo/domainStore";
import { babycamActions, canBabycamSection } from "@/lib/babycam/actions";
import { type Binding } from "@/lib/mock/babycam";
import { useLegacyBabycam } from "@/lib/babycam/legacyAdapter";

type Row = Binding & { id: string };

export default function CamBinding() {
const { data } = useDomainStore();
const [message, setMessage] = useState("");
const { BINDINGS, CAMERA_BY_ID, STATUS_BY_KEY } = useLegacyBabycam();
const ROWS: Row[] = BINDINGS.map((b) => ({ ...b, id: b.id }));

const COLUMNS: Column<Row>[] = [
  { key: "room", label: "房號" },
  { key: "motherName", label: "媽媽" },
  { key: "babyName", label: "寶寶" },
  {
    key: "camIds",
    label: "綁定監視器",
    render: (r) => (
      <div className="flex flex-wrap items-center gap-1">
        {r.camIds.map((id) => (
          <span key={id} className="rounded bg-stone-100 px-1.5 py-0.5 font-mono text-xs text-stone-600">
            {CAMERA_BY_ID[id]?.code ?? id}
          </span>
        ))}
        {r.camIds.length > 1 && (
          <Badge color="purple">
            <span className="inline-flex items-center gap-0.5">
              <Users className="h-3 w-3" />
              雙胞胎
            </span>
          </Badge>
        )}
      </div>
    ),
  },
  {
    key: "statusKey",
    label: "目前狀態",
    render: (r) => {
      const s = STATUS_BY_KEY[r.statusKey];
      return <Badge color={s?.masked ? "amber" : "green"}>{s?.label ?? r.statusKey}</Badge>;
    },
  },
  {
    key: "open",
    label: "開放時段",
    render: (r) => (
      <span className="font-mono text-xs">
        {r.openFrom}–{r.openTo}
        {r.openTo < r.openFrom && <span className="ml-1 text-amber-600">跨夜</span>}
      </span>
    ),
  },
];

  const [editing, setEditing] = useState<Row | null>(null);

  return (
    <div className="space-y-4">
      {message && <p role="status" className="text-sm text-stone-600">{message}</p>}
      <PlaceholderNotice text="設定監視器編號與房號的對應關係，以及該房號對應的媽媽資訊。雙胞胎可在同一房綁定多支監視器，媽媽端以分頁切換觀看。" />

      <QueryList
        columns={COLUMNS}
        rows={ROWS}
        searchPlaceholder="搜尋房號、媽媽姓名或監視器編號"
        onRowClick={(r) => setEditing(r)}
      />

      <Modal
        open={!!editing}
        title={editing ? `編輯綁定 — ${editing.room} 房` : ""}
        onClose={() => setEditing(null)}
        wide
      >
        {editing && (
          <div className="space-y-4 text-sm">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="房號" value={editing.room} />
              <Field label="媽媽姓名" value={editing.motherName} />
              <Field label="寶寶" value={editing.babyName} />
              <Field label="媽媽手機" value={editing.mamaPhone} />
            </div>

            <div>
              <p className="mb-1.5 text-xs font-medium text-stone-500">綁定監視器</p>
              <div className="space-y-2">
                {editing.camIds.map((id) => {
                  const cam = CAMERA_BY_ID[id];
                  return (
                    <div
                      key={id}
                      className="flex items-center justify-between rounded-lg border border-stone-200 px-3 py-2"
                    >
                      <div>
                        <span className="font-mono text-sm text-stone-700">{cam?.code}</span>
                        <span className="ml-2 text-xs text-stone-400">
                          {cam?.codec} · {cam?.resolution} · {cam?.addr}
                        </span>
                      </div>
                      <button type="button" disabled={!canBabycamSection(data, "02")}
                        onClick={() => { try { const baby = data.bindings.find((binding) => binding.id === editing.id)?.babies.find((item) => item.cameraId === id); if (!baby) throw new Error("找不到目前指派。"); babycamActions.unassign(editing.id, baby.babyId); setEditing(null); setMessage("已解除指派，照護紀錄保留，原識別標籤失效。"); } catch (error) { setMessage(error instanceof Error ? error.message : "解除失敗。"); } }}
                        className="rounded-md border border-stone-200 px-2 py-1 text-xs text-stone-500 hover:bg-stone-50"
                      >
                        解除綁定
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-lg bg-stone-50 p-3 text-xs leading-relaxed text-stone-500">
              同一監視器不可由不同寶寶共用；解除後保留照護紀錄。退房結束觀看授權，換房則重發連結，避免舊房連結繼續使用。
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setEditing(null)}
                className="rounded-lg border border-stone-200 px-4 py-2 text-sm text-stone-600 hover:bg-stone-50"
              >
                取消
              </button>
              <Link
                href={`/babycam/workspace/?binding=${encodeURIComponent(editing.id)}&section=assign`}
                className="rounded-lg bg-gradient-to-r from-brand-500 to-brand-400 px-4 py-2 text-sm font-semibold text-white"
              >
                管理本案指派
              </Link>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="mb-1 text-xs font-medium text-stone-500">{label}</p>
      <div className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-700">
        {value}
      </div>
    </div>
  );
}
