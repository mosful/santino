"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Baby } from "lucide-react";
import Button from "@/components/ui/Button";
import { caseBalance, caseNextAction } from "@/lib/domain/rules";
import { CASE_STAGES } from "@/lib/domain/types";
import Modal from "@/components/ui/Modal";
import { useDomainStore } from "@/lib/demo/domainStore";
import CollapsibleSection from "@/components/ui/CollapsibleSection";
import { roomActions, ROOM_SERVICE_STATUSES, roomCardStatus, type RoomCardStatus } from "@/lib/domain/roomStatus";
import type { RoomServiceStatus } from "@/lib/domain/types";
import { useCurrentRole } from "@/lib/roleStore";
import styles from "./RoomStatusOverview.module.css";

const LEGEND: { status: RoomCardStatus; label: string }[] = [
  { status: "入住", label: "入住" },
  { status: "親子同室", label: "親子同室" },
  { status: "打掃中", label: "打掃中" },
  { status: "報修中", label: "報修中" },
  { status: "托嬰", label: "托嬰" },
  { status: "空房", label: "空房" },
];

const NURSING_ROLES = ["衛教師 琳雅", "護理師 陳護理師"];

/**
 * 首頁房況總覽（v24 規格 §3）。
 * 取代原本獨立的「4. 房況與排房」模組：今日數字＋圖例＋依樓層分組的縮小房卡＋托嬰區。
 * 點擊行為依角色不同——櫃台進該房案件流程，護理角色進護理表單，
 * 空房／打掃／報修則開「更新房況」選單。
 */
export default function RoomStatusOverview() {
  const { data } = useDomainStore();
  const role = useCurrentRole();
  const router = useRouter();
  const [statusRoom, setStatusRoom] = useState<string | null>(null);
  // 卡片／清單：卡片適合一眼掃狀態，清單適合逐欄比對住房天數與應收。
  const [view, setView] = useState<"卡片" | "清單">("卡片");
  const [message, setMessage] = useState("");

  const today = data.demoAt.slice(0, 10);
  const rooms = data.rooms.filter((room) => room.enabled);
  const mothers = data.subjects.filter((subject) => subject.kind === "mama" && !subject.historical);
  const babies = data.subjects.filter((subject) => subject.kind === "baby" && !subject.historical);
  const childcare = data.cases.filter((record) => record.childcare && !record.childcareEnded);
  const admissionsToday = data.cases.filter((record) => record.actualAdmission?.slice(0, 10) === today).length;
  const dischargesToday = data.cases.filter((record) => record.dischargedAt?.slice(0, 10) === today).length;
  const floors = [...new Set(rooms.map((room) => room.room.slice(0, 1)))].sort();
  const isNursing = NURSING_ROLES.includes(role);

  /**
   * 房號 → 案件流程資訊。
   *
   * v24 §3 只要求「縮小房卡」，但那讓房況總覽右半整片空白；補上案件流程既有的
   * 住房天數、寶寶數、目前階段與下一步，讓櫃台不必點進案件就看得到進度。
   * ⚠️ 全部取自 data.cases，沒有另一份來源；階段名稱走 CASE_STAGES（全站唯一那組）。
   */
  function roomInfo(room: string) {
    const mother = mothers.find((subject) => subject.room === room);
    const record = mother && data.cases.find((item) => item.id === mother.caseId);
    if (!mother || !record) return null;
    const started = record.actualAdmission ? Date.parse(`${record.actualAdmission}T00:00:00+08:00`) : null;
    const dayNo = started ? Math.floor((Date.parse(data.demoAt) - started) / 86_400_000) + 1 : null;
    return {
      mother,
      record,
      babyCount: data.subjects.filter((item) => item.kind === "baby" && item.caseId === record.id && !item.historical).length,
      stay: dayNo ? `第 ${Math.min(dayNo, record.days)}／${record.days} 天` : `預計 ${record.days} 天`,
      stage: record.closed ? "已結案" : CASE_STAGES[record.stage],
      next: caseNextAction(record),
      balance: caseBalance(record),
    };
  }

  function openRoom(room: string, status: RoomCardStatus) {
    setMessage("");
    if (status === "空房" || status === "打掃中" || status === "報修中") {
      setStatusRoom(room);
      return;
    }
    const mother = mothers.find((subject) => subject.room === room);
    if (isNursing) {
      if (mother) router.push(`/mama/?subject=${encodeURIComponent(mother.id)}`);
      return;
    }
    const record = mother && data.cases.find((item) => item.id === mother.caseId);
    if (record) router.push(`/cases/detail/?id=${encodeURIComponent(record.id)}`);
    else setMessage(`房 ${room} 目前找不到對應案件，請至案件流程確認。`);
  }

  function updateStatus(status: RoomServiceStatus) {
    if (!statusRoom) return;
    try {
      roomActions.serviceStatus(statusRoom, status);
      setMessage(`房 ${statusRoom} 已更新為${status}。`);
      setStatusRoom(null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "更新房況失敗。");
    }
  }

  return (
    <CollapsibleSection
      id="room-status"
      title={<span id="room-status-title">房況總覽</span>}
      summary={`館內 ${mothers.length} 位　寶寶 ${babies.length} 位　今日入住 ${admissionsToday}　今日退房 ${dischargesToday}`}
      className="scroll-mt-20"
      bodyClassName="space-y-3"
      action={
        <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1.5">
          <ul className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-stone-600">
            {LEGEND.map((item) => (
              <li key={item.status} className="flex items-center gap-1.5">
                <span data-status={item.status} className={`${styles.legendSwatch} h-3 w-3 shrink-0 rounded-sm`} aria-hidden="true" />
                {item.label}
              </li>
            ))}
          </ul>
          <div role="group" aria-label="房況顯示方式" className="flex gap-1.5">
            {(["卡片", "清單"] as const).map((item) => (
              <Button key={item} size="sm" selected={view === item} onClick={() => setView(item)}>
                {item}
              </Button>
            ))}
          </div>
        </div>
      }
    >

      {message && <p role="status" className="rounded-xl border border-border-subtle bg-stone-50 p-3 text-sm text-stone-600">{message}</p>}

      <div className="space-y-3">
        {floors.map((floor) => {
          const floorRooms = rooms.filter((room) => room.room.startsWith(floor));
          const used = floorRooms.filter((room) => mothers.some((subject) => subject.room === room.room)).length;
          return (
            <div key={floor} className="rounded-2xl border border-border-subtle bg-surface-raised p-3 shadow-xs">
              <div className="mb-2 flex items-baseline gap-2 text-xs font-semibold text-stone-500">
                {floor}F
                <span className="font-normal tabular-nums text-stone-400">{used}／{floorRooms.length} 間使用中</span>
              </div>
              {view === "卡片" ? (
                // auto-fill 讓房卡撐滿整列；原本是固定 5.5rem 的小卡，右半整片空白。
                <div className="grid grid-cols-[repeat(auto-fill,minmax(216px,1fr))] gap-2">
                  {floorRooms.map((room) => {
                    const status = roomCardStatus(data, room.room);
                    const info = roomInfo(room.room);
                    return (
                      <button
                        key={room.room}
                        type="button"
                        data-status={status}
                        onClick={() => openRoom(room.room, status)}
                        title={`房 ${room.room}｜${status}${info ? `｜${info.mother.name}` : ""}`}
                        className={`${styles.roomCard} relative flex min-h-[5.25rem] flex-col items-stretch justify-start gap-1 overflow-hidden rounded-xl border py-2 pl-3.5 pr-2.5 text-left transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-sm`}
                      >
                        <span data-status={status} className={`${styles.statusBar} absolute inset-y-0 left-0 w-1.5`} aria-hidden="true" />
                        <span className="flex items-baseline gap-2">
                          <strong className="text-base font-bold tabular-nums text-stone-800">{room.room}</strong>
                          <span className="ml-auto text-[11px] font-semibold text-stone-500">{status}</span>
                        </span>
                        {info ? (
                          <>
                            <span className="truncate text-sm font-medium text-stone-700">
                              {info.mother.name}
                              <span className="ml-1.5 text-[11px] font-normal text-stone-500">寶寶 {info.babyCount}</span>
                            </span>
                            <span className="flex flex-wrap items-baseline gap-x-2 text-[11px] text-stone-500">
                              <span className="tabular-nums">{info.stay}</span>
                              <span>{info.stage}</span>
                              {info.balance > 0 && <span className="text-rose-600">待收 {info.balance.toLocaleString("zh-TW")}</span>}
                            </span>
                            <span className="truncate text-[11px] text-stone-500">下一步：{info.next}</span>
                          </>
                        ) : (
                          <span className="text-[11px] text-stone-500">{status === "空房" ? "可排房；點此更新房況" : "點此更新房況"}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px] text-left text-sm">
                    <thead className="text-xs text-stone-500">
                      <tr>
                        {["房號", "狀態", "媽媽／寶寶", "住房天數", "階段", "下一步", "應收"].map((label) => (
                          <th key={label} scope="col" className="px-2 py-1.5 font-medium">{label}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {floorRooms.map((room) => {
                        const status = roomCardStatus(data, room.room);
                        const info = roomInfo(room.room);
                        return (
                          <tr key={room.room} className="border-t border-border-subtle">
                            <th scope="row" className="px-2 py-2 text-left">
                              <button
                                type="button"
                                onClick={() => openRoom(room.room, status)}
                                className="font-bold tabular-nums text-brand-700 underline-offset-4 hover:underline"
                              >
                                {room.room}
                              </button>
                            </th>
                            <td className="px-2 py-2">
                              <span className="inline-flex items-center gap-1.5 text-xs text-stone-600">
                                <span data-status={status} className={`${styles.legendSwatch} h-2.5 w-2.5 shrink-0 rounded-sm`} aria-hidden="true" />
                                {status}
                              </span>
                            </td>
                            <td className="px-2 py-2">{info ? `${info.mother.name}／寶寶 ${info.babyCount}` : "—"}</td>
                            <td className="px-2 py-2 tabular-nums text-stone-600">{info?.stay ?? "—"}</td>
                            <td className="px-2 py-2 text-stone-600">{info?.stage ?? "—"}</td>
                            <td className="px-2 py-2 text-stone-600">{info?.next ?? "—"}</td>
                            <td className="px-2 py-2 tabular-nums">
                              {info && info.balance > 0 ? <span className="text-rose-600">{info.balance.toLocaleString("zh-TW")}</span> : "—"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}

        {childcare.length > 0 && (
          <div className="rounded-2xl border border-border-subtle bg-surface-raised p-3 shadow-xs">
            <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-stone-500">
              <Baby className="h-3.5 w-3.5" aria-hidden="true" />
              托嬰（無房號，以車號識別）
            </div>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(216px,1fr))] gap-2">
              {childcare.map((record) => (
                <button
                  key={record.id}
                  type="button"
                  data-status="托嬰"
                  onClick={() => router.push(`/cases/detail/?id=${encodeURIComponent(record.id)}`)}
                  title={`${record.name}｜車號 ${record.childcareCar || "待指派"}`}
                  className={`${styles.roomCard} relative flex min-h-[5.25rem] flex-col items-stretch justify-start gap-1 overflow-hidden rounded-xl border py-2 pl-3.5 pr-2.5 text-left transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-sm`}
                >
                  <span data-status="托嬰" className={`${styles.statusBar} absolute inset-y-0 left-0 w-1.5`} aria-hidden="true" />
                  <span className="flex items-baseline gap-2">
                    <strong className="text-base font-bold text-stone-800">車 {record.childcareCar || "—"}</strong>
                    <span className="ml-auto text-[11px] font-semibold text-stone-500">托嬰</span>
                  </span>
                  <span className="truncate text-sm font-medium text-stone-700">{record.name}</span>
                  <span className="text-[11px] text-stone-500">
                    續留 {record.childcareDays} 天・{record.dischargedAt ? `${record.dischargedAt.slice(0, 10)} 退房` : "尚未退房"}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <Modal open={Boolean(statusRoom)} title={`更新房況｜房 ${statusRoom ?? ""}`} onClose={() => setStatusRoom(null)}>
        <div className="space-y-3">
          <p className="text-sm text-stone-600">
            空房房卡可切換房況；正式版建議限清潔人員、櫃台與護理長操作（v24 待確認事項第 1 項）。
          </p>
          <div className="flex flex-wrap gap-2">
            {ROOM_SERVICE_STATUSES.map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => updateStatus(status)}
                className="min-h-11 rounded-xl border border-border-subtle px-4 text-sm font-medium text-stone-600 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-600"
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </Modal>
    </CollapsibleSection>
  );
}
