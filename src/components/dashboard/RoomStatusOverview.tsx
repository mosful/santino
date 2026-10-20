"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Baby } from "lucide-react";
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
    >

      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-stone-500">
        {LEGEND.map((item) => (
          <li key={item.status} className="flex items-center gap-1.5">
            <span data-status={item.status} className={`${styles.swatch} h-3 w-3 shrink-0 rounded border`} aria-hidden="true" />
            {item.label}
          </li>
        ))}
      </ul>

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
              <div className="flex flex-wrap gap-2">
                {floorRooms.map((room) => {
                  const status = roomCardStatus(data, room.room);
                  const mother = mothers.find((subject) => subject.room === room.room);
                  return (
                    <button
                      key={room.room}
                      type="button"
                      data-status={status}
                      onClick={() => openRoom(room.room, status)}
                      title={`房 ${room.room}｜${status}${mother ? `｜${mother.name}` : ""}`}
                      className={`${styles.roomCard} flex min-h-14 w-[5.5rem] flex-col justify-center rounded-xl border px-2 py-1.5 text-left transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-sm`}
                    >
                      <span className="text-sm font-bold tabular-nums">{room.room}</span>
                      <span className="truncate text-[11px] text-stone-500">{mother ? mother.name : status}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

        {childcare.length > 0 && (
          <div className="rounded-2xl border border-border-subtle bg-surface-raised p-3 shadow-xs">
            <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-stone-500">
              <Baby className="h-3.5 w-3.5" aria-hidden="true" />
              托嬰（無房號，以車號識別）
            </div>
            <div className="flex flex-wrap gap-2">
              {childcare.map((record) => (
                <button
                  key={record.id}
                  type="button"
                  data-status="托嬰"
                  onClick={() => router.push(`/cases/detail/?id=${encodeURIComponent(record.id)}`)}
                  title={`${record.name}｜車號 ${record.childcareCar || "待指派"}`}
                  className={`${styles.roomCard} flex min-h-14 w-[5.5rem] flex-col justify-center rounded-xl border px-2 py-1.5 text-left transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-sm`}
                >
                  <span className="text-sm font-bold">車 {record.childcareCar || "—"}</span>
                  <span className="truncate text-[11px] text-stone-500">{record.name}</span>
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
