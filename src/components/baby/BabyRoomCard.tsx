import Badge from "@/components/ui/Badge";
import { BABY_STATUS_COLOR, type BabyRoom } from "@/lib/mock/babyRoom";
import { BABY_QUICK_KEYS } from "@/lib/babyQuickKeys";

export default function BabyRoomCard({
  room,
  onKeyClick,
}: {
  room: BabyRoom;
  onKeyClick: (roomNo: string, keyKey: string) => void;
}) {
  return (
    <div className={`rounded-lg border-2 p-3 ${BABY_STATUS_COLOR[room.status]}`}>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-base font-bold">{room.room}</span>
        <div className="flex gap-1">
          {room.gender && (
            <Badge color={room.gender === "男" ? "blue" : "rose"}>{room.gender}寶寶</Badge>
          )}
          <Badge color="purple">{room.status}</Badge>
        </div>
      </div>
      <div className="mb-2 text-sm">
        <div className="font-medium">{room.babyName}</div>
        <div className="text-xs text-slate-500">
          病歷號 {room.chartNo}｜出生 {room.birthDate}｜{room.weight}
        </div>
        <div className="mt-1 text-xs text-slate-500">
          視訊狀態：
          {room.videoState === "正常視訊" ? (
            <span className="text-emerald-600">{room.videoState}</span>
          ) : (
            <span className="text-rose-500">{room.videoState}（隱私保護佔位畫面）</span>
          )}
        </div>
      </div>
      <div className="flex flex-wrap gap-1">
        {BABY_QUICK_KEYS.map((k) => (
          <button
            key={k.key}
            onClick={() => onKeyClick(room.room, k.key)}
            className={
              "rounded px-2 py-1 text-xs " +
              (k.core
                ? "bg-sky-500 text-white hover:bg-sky-600"
                : "bg-slate-100 text-slate-500 hover:bg-slate-200")
            }
          >
            {k.label}
          </button>
        ))}
      </div>
    </div>
  );
}
