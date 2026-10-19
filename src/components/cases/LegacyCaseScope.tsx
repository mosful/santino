"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { useDomainStore } from "@/lib/demo/domainStore";
import type { CaseRecord } from "@/lib/domain/types";

/** 舊合約頁籤保留版面，透過同一案件識別碼讀寫，避免再建立第二份 mock。 */
export default function LegacyCaseScope({ children, filter = "all" }: { children: (record: CaseRecord) => ReactNode; filter?: "all" | "draft" | "signed" }) {
  const params = useSearchParams(); const { data } = useDomainStore(); const [id, setId] = useState("");
  const records = data.cases.filter((record) => filter === "draft" ? !record.closed && !record.signed : filter === "signed" ? record.signed : true);
  const record = records.find((item) => item.id === (id || params.get("case"))) ?? records[0];
  return <div className="space-y-4"><div className="flex flex-wrap items-center gap-3 text-xs"><label>共用案件<select aria-label="套用案件" className="ml-2 rounded border border-stone-200 px-2 py-1.5" value={record?.id ?? ""} onChange={(event) => setId(event.target.value)}>{records.map((item) => <option key={item.id} value={item.id}>{item.contractNo || "未下訂"}｜{item.name}｜{item.room || "未入住"}</option>)}</select></label><Link className="text-rose-500 underline" href={record ? `/cases/detail/?id=${encodeURIComponent(record.id)}` : "/cases/"}>開啟完整案件流程</Link></div>{record ? children(record) : <p className="text-sm text-stone-500">尚無符合案件，請先從案件流程建立預約。</p>}</div>;
}
