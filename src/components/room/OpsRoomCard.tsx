import Badge from "@/components/ui/Badge";
import { type OpsRoom } from "@/lib/mock/opsRoom";
import { OPS_QUICK_KEYS } from "@/lib/opsQuickKeys";

export default function OpsRoomCard({
  room,
  onKeyClick,
}: {
  room: OpsRoom;
  onKeyClick: (roomNo: string, keyKey: string) => void;
}) {
  return (
    <div
      className={`rounded-xl border p-3.5 shadow-sm transition-shadow hover:shadow-md sm:p-4 ${
        room.vacant ? "border-stone-200 bg-white" : "border-teal-300 bg-teal-50"
      }`}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="text-lg font-bold">{room.room}</span>
        <Badge color={room.vacant ? "slate" : "green"}>{room.roomType}</Badge>
      </div>
      {room.vacant ? (
        <div className="py-4 text-center text-xs text-stone-400">目前空房</div>
      ) : (
        <>
          <div className="mb-3 grid grid-cols-2 gap-x-2 gap-y-1 text-xs text-stone-600">
            <span>孕媽：{room.motherName}</span>
            <span>房歷號：{room.chartNo}</span>
            <span>住宿天數：{room.stayDay}天</span>
            <span>房費：${room.fee?.toLocaleString()}/日</span>
            <span>應收：${room.received?.toLocaleString()}</span>
            <span>預收：${room.prepaid?.toLocaleString()}</span>
            <span className="col-span-2">送餐需求：{room.mealNote}</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {OPS_QUICK_KEYS.map((k) => (
              <button
                key={k.key}
                onClick={() => onKeyClick(room.room, k.key)}
                className="rounded-full bg-teal-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-teal-700 active:bg-teal-800"
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
