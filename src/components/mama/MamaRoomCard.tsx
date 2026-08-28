import Badge from "@/components/ui/Badge";
import { STATUS_COLOR, type MamaRoom } from "@/lib/mock/mamaRoom";
import { MAMA_QUICK_KEYS } from "@/lib/mamaQuickKeys";

export default function MamaRoomCard({
  room,
  onKeyClick,
}: {
  room: MamaRoom;
  onKeyClick: (roomNo: string, keyKey: string) => void;
}) {
  const empty = room.status === "空房" || room.status === "打掃" || room.status === "報修";

  return (
    <div className={`rounded-lg border p-3 ${STATUS_COLOR[room.status]}`}>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-base font-bold">{room.room}</span>
        <Badge
          color={
            room.status === "入住"
              ? "green"
              : room.status === "親子同室"
              ? "rose"
              : room.status === "打掃"
              ? "amber"
              : room.status === "報修"
              ? "blue"
              : "slate"
          }
        >
          {room.status}
        </Badge>
      </div>

      {empty ? (
        <div className="py-4 text-center text-xs text-slate-400">
          {room.status === "空房" ? "目前空房" : `狀態：${room.status}`}
        </div>
      ) : (
        <>
          <div className="mb-2 text-sm">
            <div className="font-medium">
              {room.motherName}
              {room.risk && (
                <span className="ml-1 rounded bg-rose-100 px-1.5 text-xs text-rose-600">
                  {room.risk}
                </span>
              )}
            </div>
            <div className="text-xs text-slate-500">
              病歷號 {room.chartNo}｜{room.stayRange}（第{room.stayDay}天）｜寶寶 {room.babyCount}
            </div>
            {room.alert && (
              <div className="mt-1 text-xs font-medium text-rose-600">⚠ {room.alert}</div>
            )}
          </div>

          <div className="flex flex-wrap gap-1">
            {MAMA_QUICK_KEYS.map((k) => (
              <button
                key={k.key}
                onClick={() => onKeyClick(room.room, k.key)}
                className={
                  "rounded px-2 py-1 text-xs " +
                  (k.core
                    ? "bg-rose-500 text-white hover:bg-rose-600"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200")
                }
              >
                {k.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
