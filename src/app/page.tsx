import Tabs from "@/components/ui/Tabs";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import {
  ANNOUNCEMENTS,
  MAMA_CALENDAR_SAMPLE,
  COURSES,
} from "@/lib/mock/dashboard";

const CATEGORY_COLOR: Record<string, "rose" | "green" | "blue" | "amber" | "purple" | "slate"> = {
  預約參觀: "blue",
  預約簽約: "green",
  預產期: "rose",
  入出住: "amber",
  館內人數: "purple",
  訪客預約: "slate",
};

function AnnouncementTab() {
  return (
    <div className="space-y-2">
      {ANNOUNCEMENTS.map((a) => (
        <Card key={a.id}>
          <div className="flex items-center justify-between">
            <span className="font-medium">{a.title}</span>
            <span className="text-xs text-slate-400">
              {a.date}｜{a.author}
            </span>
          </div>
        </Card>
      ))}
    </div>
  );
}

function MamaCalendarTab() {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 text-xs text-slate-500">
        {Object.entries(CATEGORY_COLOR).map(([cat, color]) => (
          <Badge key={cat} color={color}>
            {cat}
          </Badge>
        ))}
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {MAMA_CALENDAR_SAMPLE.map((day) => (
          <Card key={day.date} title={day.date}>
            <ul className="space-y-1.5 text-sm">
              {day.items.map((it, i) => (
                <li key={i} className="flex items-center gap-2">
                  <Badge color={CATEGORY_COLOR[it.category]}>{it.category}</Badge>
                  <span className="text-slate-600">{it.text}</span>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
      <p className="text-xs text-slate-400">
        每日格另有「列印」連結可開出當日預約參觀報名資料列印視窗（本稿未實作列印）。
      </p>
    </div>
  );
}

function InternalCalendarTab() {
  return (
    <Card
      title="內部行事曆"
      action={
        <div className="flex gap-2">
          <button className="rounded bg-slate-100 px-3 py-1 text-xs">
            批次新增處理項目
          </button>
          <button className="rounded bg-rose-500 px-3 py-1 text-xs text-white">
            ＋ 新增項目
          </button>
        </div>
      }
    >
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-slate-400">
        {Array.from({ length: 28 }).map((_, i) => (
          <div key={i} className="rounded border border-slate-100 py-3">
            {i + 1}
          </div>
        ))}
      </div>
    </Card>
  );
}

function CourseTab() {
  return (
    <div className="space-y-2">
      {COURSES.map((c) => (
        <Card key={c.id}>
          <div className="flex items-center justify-between text-sm">
            <div>
              <span className="font-medium">{c.name}</span>
              <span className="ml-2 text-slate-400">{c.time}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge color={c.fee ? "amber" : "green"}>
                {c.fee ? "收費" : "免費"}
              </Badge>
              <span className="text-xs text-slate-500">
                已報名 {c.enrolled}/{c.cap}
              </span>
            </div>
          </div>
        </Card>
      ))}
      <p className="text-xs text-slate-400">
        「一週Line報名」統計按鈕角標串接14.LINE官方帳號管理之課程通知已讀/報名回覆資料（本稿未實作）。
      </p>
    </div>
  );
}

function ValueAddedTab() {
  return (
    <Card
      title="加值服務"
      action={
        <select className="rounded border border-slate-200 px-2 py-1 text-xs">
          <option>表類別：全部</option>
        </select>
      }
    >
      <p className="text-sm text-slate-400">當月無資料（依規格文件3.4節，錄影當時亦無資料可顯示）。</p>
    </Card>
  );
}

export default function HomePage() {
  return (
    <div className="mx-auto max-w-5xl p-6">
      <h1 className="mb-4 text-lg font-bold">1. 中控中心</h1>
      <Tabs
        tabs={[
          { key: "board", label: "公佈欄", content: <AnnouncementTab /> },
          { key: "mama-cal", label: "媽媽行事曆", content: <MamaCalendarTab /> },
          { key: "internal-cal", label: "內部行事曆", content: <InternalCalendarTab /> },
          { key: "course", label: "課程管理", content: <CourseTab /> },
          { key: "value-added", label: "加值服務", content: <ValueAddedTab /> },
        ]}
      />
    </div>
  );
}
