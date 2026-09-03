import { ClipboardList } from "lucide-react";
import Badge from "@/components/ui/Badge";
import { STATUS_COLOR, type MamaRoom } from "@/lib/mock/mamaRoom";

export default function MamaRoomCard({
  room,
  onOpen,
}: {
  room: MamaRoom;
  onOpen: (roomNo: string) => void;
}) {
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

          <button
            onClick={() => onOpen(room.room)}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-rose-500 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-rose-600 active:bg-rose-700"
          >
            <ClipboardList className="h-3.5 w-3.5" />
            照護作業
          </button>
        </>
      )}
    </div>
  );
}
