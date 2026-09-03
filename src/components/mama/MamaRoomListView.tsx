import { ClipboardList } from "lucide-react";
import Badge from "@/components/ui/Badge";
import { STATUS_COLOR, type MamaRoom } from "@/lib/mock/mamaRoom";

const STATUS_BADGE_COLOR: Record<MamaRoom["status"], "green" | "rose" | "amber" | "blue" | "slate"> = {
  入住: "green",
  親子同室: "rose",
  打掃: "amber",
  報修: "blue",
  空房: "slate",
};

export default function MamaRoomListView({
  rooms,
  onOpen,
}: {
  rooms: MamaRoom[];
  onOpen: (roomNo: string) => void;
}) {
  return (
    <div className="scroll-fade overflow-x-auto rounded-xl border border-stone-200 bg-white">
      <table className="w-full min-w-max text-left text-sm">
        <thead className="bg-stone-50 text-xs text-stone-500">
          <tr>
            <th className="whitespace-nowrap px-3 py-2.5 font-medium">房號</th>
            <th className="whitespace-nowrap px-3 py-2.5 font-medium">狀態</th>
            <th className="whitespace-nowrap px-3 py-2.5 font-medium">媽媽姓名</th>
            <th className="whitespace-nowrap px-3 py-2.5 font-medium">病歷號</th>
            <th className="whitespace-nowrap px-3 py-2.5 font-medium">入住天數</th>
            <th className="whitespace-nowrap px-3 py-2.5 font-medium">寶寶數</th>
            <th className="whitespace-nowrap px-3 py-2.5 font-medium">警示</th>
            <th className="px-3 py-2.5 font-medium">操作</th>
          </tr>
        </thead>
        <tbody>
          {rooms.map((r) => {
            const empty = r.status === "空房" || r.status === "打掃" || r.status === "報修";
            return (
              <tr key={r.room} className="border-t border-stone-100 transition-colors hover:bg-stone-50">
                <td className="whitespace-nowrap px-3 py-2.5 font-bold">{r.room}</td>
                <td className="whitespace-nowrap px-3 py-2.5">
                  <Badge color={STATUS_BADGE_COLOR[r.status]}>{r.status}</Badge>
                </td>
                <td className="whitespace-nowrap px-3 py-2.5">
                  {empty ? (
                    "－"
                  ) : (
                    <>
                      {r.motherName}
                      {r.risk && (
                        <span className="ml-1 rounded bg-rose-100 px-1.5 text-xs text-rose-600">{r.risk}</span>
                      )}
                    </>
                  )}
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 text-stone-500">{empty ? "－" : r.chartNo}</td>
                <td className="whitespace-nowrap px-3 py-2.5 text-stone-500">
                  {empty ? "－" : `第${r.stayDay}天`}
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 text-stone-500">{empty ? "－" : r.babyCount}</td>
                <td className="whitespace-nowrap px-3 py-2.5">
                  {r.alert ? <span className="text-xs font-medium text-rose-600">⚠ {r.alert}</span> : "－"}
                </td>
                <td className="px-3 py-2.5">
                  {empty ? (
                    <span className={`rounded-lg border px-2 py-1 text-xs text-stone-400 ${STATUS_COLOR[r.status]}`}>
                      {r.status === "空房" ? "目前空房" : `狀態：${r.status}`}
                    </span>
                  ) : (
                    <button
                      onClick={() => onOpen(r.room)}
                      className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-rose-500 px-4 py-1.5 text-xs font-medium text-white transition-colors hover:bg-rose-600 active:bg-rose-700"
                    >
                      <ClipboardList className="h-3.5 w-3.5" />
                      照護作業
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
          {rooms.length === 0 && (
            <tr>
              <td colSpan={8} className="px-3 py-10 text-center text-stone-400">
                查無資料
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
