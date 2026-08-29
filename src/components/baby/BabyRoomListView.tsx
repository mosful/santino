import Badge from "@/components/ui/Badge";
import { type BabyRoom, type BabyStatus } from "@/lib/mock/babyRoom";
import { BABY_QUICK_KEYS } from "@/lib/babyQuickKeys";

const STATUS_BADGE_COLOR: Record<BabyStatus, "blue" | "amber" | "purple" | "green" | "slate"> = {
  入住: "blue",
  隔離: "amber",
  親子同室: "purple",
  視訊: "green",
  空房: "slate",
};

export default function BabyRoomListView({
  rooms,
  onKeyClick,
  showSecondary = false,
}: {
  rooms: BabyRoom[];
  onKeyClick: (roomNo: string, keyKey: string) => void;
  showSecondary?: boolean;
}) {
  const keys = showSecondary ? BABY_QUICK_KEYS : BABY_QUICK_KEYS.filter((k) => k.core);

  return (
    <div className="scroll-fade overflow-x-auto rounded-xl border border-stone-200 bg-white">
      <table className="w-full min-w-max text-left text-sm">
        <thead className="bg-stone-50 text-xs text-stone-500">
          <tr>
            <th className="whitespace-nowrap px-3 py-2.5 font-medium">房號</th>
            <th className="whitespace-nowrap px-3 py-2.5 font-medium">性別</th>
            <th className="whitespace-nowrap px-3 py-2.5 font-medium">狀態</th>
            <th className="whitespace-nowrap px-3 py-2.5 font-medium">寶寶姓名</th>
            <th className="whitespace-nowrap px-3 py-2.5 font-medium">病歷號</th>
            <th className="whitespace-nowrap px-3 py-2.5 font-medium">出生日期</th>
            <th className="whitespace-nowrap px-3 py-2.5 font-medium">體重</th>
            <th className="whitespace-nowrap px-3 py-2.5 font-medium">視訊狀態</th>
            <th className="px-3 py-2.5 font-medium">房卡快捷鍵</th>
          </tr>
        </thead>
        <tbody>
          {rooms.map((r) => {
            const empty = r.status === "空房";
            return (
              <tr key={r.room} className="border-t border-stone-100 transition-colors hover:bg-stone-50">
                <td className="whitespace-nowrap px-3 py-2.5 font-bold">{r.room}</td>
                <td className="whitespace-nowrap px-3 py-2.5">{r.gender ?? "－"}</td>
                <td className="whitespace-nowrap px-3 py-2.5">
                  <Badge color={STATUS_BADGE_COLOR[r.status]}>{r.status}</Badge>
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 font-medium">{empty ? "－" : r.babyName}</td>
                <td className="whitespace-nowrap px-3 py-2.5 text-stone-500">{empty ? "－" : r.chartNo}</td>
                <td className="whitespace-nowrap px-3 py-2.5 text-stone-500">{empty ? "－" : r.birthDate}</td>
                <td className="whitespace-nowrap px-3 py-2.5 text-stone-500">{empty ? "－" : r.weight}</td>
                <td className="whitespace-nowrap px-3 py-2.5">
                  {empty ? (
                    "－"
                  ) : r.videoState === "正常視訊" ? (
                    <span className="text-emerald-600">{r.videoState}</span>
                  ) : (
                    <span className="text-rose-500">{r.videoState}（隱私保護佔位畫面）</span>
                  )}
                </td>
                <td className="px-3 py-2.5">
                  {empty ? (
                    <span className="rounded-lg border border-stone-200 px-2 py-1 text-xs text-stone-400">目前空房</span>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {keys.map((k) => (
                        <button
                          key={k.key}
                          onClick={() => onKeyClick(r.room, k.key)}
                          className={
                            "rounded-full px-3 py-1.5 text-xs font-medium transition-colors " +
                            (k.core
                              ? "bg-sky-500 text-white hover:bg-sky-600 active:bg-sky-700"
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
              <td colSpan={9} className="px-3 py-10 text-center text-stone-400">
                查無資料
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
