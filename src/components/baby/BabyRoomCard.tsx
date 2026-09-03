import { ClipboardList } from "lucide-react";
import Badge from "@/components/ui/Badge";
import { BABY_STATUS_COLOR, type BabyRoom, type BabyStatus } from "@/lib/mock/babyRoom";

const STATUS_BADGE_COLOR: Record<BabyStatus, "blue" | "amber" | "purple" | "green" | "slate"> = {
  入住: "blue",
  隔離: "amber",
  親子同室: "purple",
  視訊: "green",
  空房: "slate",
};

export default function BabyRoomCard({
  room,
  onOpen,
}: {
  room: BabyRoom;
  onOpen: (roomNo: string) => void;
}) {
  const empty = room.status === "空房";
  return (
    <div className={`rounded-xl border-2 p-3.5 shadow-sm transition-shadow hover:shadow-md sm:p-4 ${BABY_STATUS_COLOR[room.status]}`}>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-lg font-bold">{room.room}</span>
        <div className="flex gap-1">
          {room.gender && (
            <Badge color={room.gender === "男" ? "blue" : "rose"}>{room.gender}寶寶</Badge>
          )}
          <Badge color={STATUS_BADGE_COLOR[room.status]}>{room.status}</Badge>
        </div>
      </div>

      {empty ? (
        <div className="py-4 text-center text-xs text-stone-400">目前空房</div>
      ) : (
        <>
          <div className="mb-2 text-sm">
            <div className="font-medium">{room.babyName}</div>
            <div className="text-xs text-stone-500">
              病歷號 {room.chartNo}｜出生 {room.birthDate}｜{room.weight}
            </div>
            <div className="mt-1 text-xs text-stone-500">
              視訊狀態：
              {room.videoState === "正常視訊" ? (
                <span className="text-emerald-600">{room.videoState}</span>
              ) : (
                <span className="text-rose-500">{room.videoState}（隱私保護佔位畫面）</span>
              )}
            </div>
          </div>
          <button
            onClick={() => onOpen(room.room)}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-sky-500 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-sky-600 active:bg-sky-700"
          >
            <ClipboardList className="h-3.5 w-3.5" />
            照護作業
          </button>
        </>
      )}
    </div>
  );
}
