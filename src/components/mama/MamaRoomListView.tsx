import Badge from "@/components/ui/Badge";
import { STATUS_COLOR, type MamaRoom } from "@/lib/mock/mamaRoom";
import { MAMA_QUICK_KEYS } from "@/lib/mamaQuickKeys";

const STATUS_BADGE_COLOR: Record<MamaRoom["status"], "green" | "rose" | "amber" | "blue" | "slate"> = {
  入住: "green",
  親子同室: "rose",
  打掃: "amber",
  報修: "blue",
  空房: "slate",
};

export default function MamaRoomListView({
  rooms,
  onKeyClick,
  showSecondary = false,
}: {
  rooms: MamaRoom[];
  onKeyClick: (roomNo: string, keyKey: string) => void;
  showSecondary?: boolean;
}) {
  const keys = showSecondary ? MAMA_QUICK_KEYS : MAMA_QUICK_KEYS.filter((k) => k.core);

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
            <th className="px-3 py-2.5 font-medium">房卡快捷鍵</th>
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
                    <div className="flex flex-wrap gap-1.5">
                      {keys.map((k) => (
                        <button
                          key={k.key}
                          onClick={() => onKeyClick(r.room, k.key)}
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
