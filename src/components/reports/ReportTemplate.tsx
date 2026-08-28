export default function ReportTemplate({
  title,
  columns,
  sampleRows,
}: {
  title: string;
  columns: string[];
  sampleRows?: string[][];
}) {
  return (
    <div className="space-y-3 text-sm">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <input placeholder="查詢日期起" className="rounded-lg border border-slate-200 px-2.5 py-2" />
        <span className="text-slate-400">～</span>
        <input placeholder="查詢日期迄" className="rounded-lg border border-slate-200 px-2.5 py-2" />
        <button className="rounded-lg bg-slate-700 px-3.5 py-2 text-white hover:bg-slate-800">送出查詢</button>
        <button className="ml-auto rounded-lg bg-slate-100 px-3.5 py-2 hover:bg-slate-200">匯出</button>
        <button className="rounded-lg bg-slate-100 px-3.5 py-2 hover:bg-slate-200">列印</button>
      </div>
      <div className="scroll-fade overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full min-w-max text-left text-xs">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              {columns.map((c) => (
                <th key={c} className="whitespace-nowrap px-3 py-2 font-medium">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(sampleRows ?? []).map((row, i) => (
              <tr key={i} className="border-t border-slate-100">
                {row.map((cell, j) => (
                  <td key={j} className="whitespace-nowrap px-3 py-2">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
            {(!sampleRows || sampleRows.length === 0) && (
              <tr>
                <td colSpan={columns.length} className="px-3 py-6 text-center text-slate-400">
                  查無資料（19個報表共用同一套查詢/匯出/列印元件框架）
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate-400">報表：{title}</p>
    </div>
  );
}
