import { ClipboardCheck } from "lucide-react";
import Badge from "@/components/ui/Badge";
import { type OpsRoom } from "@/lib/mock/opsRoom";

export default function OpsRoomListView({
  rooms,
  onOpen,
}: {
  rooms: OpsRoom[];
  onOpen: (roomNo: string) => void;
}) {
  return (
    <div className="scroll-fade overflow-x-auto rounded-xl border border-stone-200 bg-white">
      <table className="w-full min-w-max text-left text-sm">
        <thead className="bg-stone-50 text-xs text-stone-500">
          <tr>
            <th className="whitespace-nowrap px-3 py-2.5 font-medium">房號</th>
            <th className="whitespace-nowrap px-3 py-2.5 font-medium">房型</th>
            <th className="whitespace-nowrap px-3 py-2.5 font-medium">孕媽</th>
            <th className="whitespace-nowrap px-3 py-2.5 font-medium">病歷號</th>
            <th className="whitespace-nowrap px-3 py-2.5 font-medium">住宿天數</th>
            <th className="whitespace-nowrap px-3 py-2.5 font-medium">房費</th>
            <th className="whitespace-nowrap px-3 py-2.5 font-medium">應收</th>
            <th className="whitespace-nowrap px-3 py-2.5 font-medium">預收</th>
            <th className="whitespace-nowrap px-3 py-2.5 font-medium">送餐需求</th>
            <th className="px-3 py-2.5 font-medium">操作</th>
          </tr>
        </thead>
        <tbody>
          {rooms.map((r) => (
            <tr key={r.room} className="border-t border-stone-100 transition-colors hover:bg-stone-50">
              <td className="whitespace-nowrap px-3 py-2.5 font-bold">{r.room}</td>
              <td className="whitespace-nowrap px-3 py-2.5">
                <Badge color={r.vacant ? "slate" : "green"}>{r.roomType}</Badge>
              </td>
              <td className="whitespace-nowrap px-3 py-2.5 font-medium">{r.vacant ? "－" : r.motherName}</td>
              <td className="whitespace-nowrap px-3 py-2.5 text-stone-500">{r.vacant ? "－" : r.chartNo}</td>
              <td className="whitespace-nowrap px-3 py-2.5 text-stone-500">
                {r.vacant ? "－" : `${r.stayDay}天`}
              </td>
              <td className="whitespace-nowrap px-3 py-2.5 text-stone-500">
                {r.vacant ? "－" : `$${r.fee?.toLocaleString()}/日`}
              </td>
              <td className="whitespace-nowrap px-3 py-2.5 text-stone-500">
                {r.vacant ? "－" : `$${r.received?.toLocaleString()}`}
              </td>
              <td className="whitespace-nowrap px-3 py-2.5 text-stone-500">
                {r.vacant ? "－" : `$${r.prepaid?.toLocaleString()}`}
              </td>
              <td className="whitespace-nowrap px-3 py-2.5 text-stone-500">{r.vacant ? "－" : r.mealNote}</td>
              <td className="px-3 py-2.5">
                {r.vacant ? (
                  <span className="rounded-lg border border-stone-200 px-2 py-1 text-xs text-stone-400">目前空房</span>
                ) : (
                  <button
                    onClick={() => onOpen(r.room)}
                    className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-teal-600 px-4 py-1.5 text-xs font-medium text-white transition-colors hover:bg-teal-700 active:bg-teal-800"
                  >
                    <ClipboardCheck className="h-3.5 w-3.5" />
                    房務作業
                  </button>
                )}
              </td>
            </tr>
          ))}
          {rooms.length === 0 && (
            <tr>
              <td colSpan={10} className="px-3 py-10 text-center text-stone-400">
                查無資料
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
