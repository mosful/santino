import Badge from "@/components/ui/Badge";
import { STATUS_COLOR, type MamaRoom } from "@/lib/mock/mamaRoom";
import { MAMA_QUICK_KEYS } from "@/lib/mamaQuickKeys";

export default function MamaRoomCard({
  room,
  onKeyClick,
  showSecondary = false,
}: {
  room: MamaRoom;
  onKeyClick: (roomNo: string, keyKey: string) => void;
  showSecondary?: boolean;
}) {
  const keys = showSecondary ? MAMA_QUICK_KEYS : MAMA_QUICK_KEYS.filter((k) => k.core);
  const empty = room.status === "空房" || room.status === "打掃" || room.status === "報修";

  return (
    <div className={`rounded-xl border p-3.5 shadow-sm transition-shadow hover:shadow-md sm:p-4 ${STATUS_COLOR[room.status]}`}>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-lg font-bold">{room.room}</span>
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
        <div className="py-4 text-center text-xs text-stone-400">
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
            <div className="text-xs text-stone-500">
              病歷號 {room.chartNo}｜{room.stayRange}（第{room.stayDay}天）｜寶寶 {room.babyCount}
            </div>
            {room.alert && (
              <div className="mt-1 text-xs font-medium text-rose-600">⚠ {room.alert}</div>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {keys.map((k) => (
              <button
                key={k.key}
                onClick={() => onKeyClick(room.room, k.key)}
                className={
                  "rounded-full px-3 py-1.5 text-xs font-medium transition-colors " +
                  (k.core
                    ? "bg-rose-500 text-white hover:bg-rose-600 active:bg-rose-700"
                    : "bg-stone-100 text-stone-500 hover:bg-stone-200 active:bg-stone-300")
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
