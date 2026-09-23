"use client";

import { useState } from "react";
import { Baby, ShieldCheck } from "lucide-react";
import type { DemoAccount } from "@/lib/mock/babycam";

/**
 * 媽媽端／親友端共用的登入卡。
 * 靜態畫面稿用假驗證（比對 mock 資料），登入狀態只存在 component state，
 * 不寫入 localStorage，重新整理即回到未登入。
 */
export default function ViewLoginCard({
  title,
  subtitle,
  demoHint,
  accounts = [],
  onSubmit,
}: {
  title: string;
  subtitle: string;
  /** 畫面上直接提示可用的示範帳密，方便客戶自己試 */
  demoHint: string;
  /** 一鍵帶入的示範帳號，每組對應一種要展示的情境 */
  accounts?: DemoAccount[];
  onSubmit: (phone: string, code: string) => string | null;
}) {
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handle(e: React.FormEvent) {
    e.preventDefault();
    setError(onSubmit(phone.trim(), code.trim()));
  }

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex flex-col items-center gap-2 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-accent-400 text-white shadow-sm">
          <Baby className="h-6 w-6" />
        </span>
        <h1 className="text-base font-bold text-stone-800">{title}</h1>
        <p className="text-xs text-stone-400">{subtitle}</p>
      </div>

      <form onSubmit={handle} className="space-y-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-stone-500" htmlFor="bc-phone">
            手機號碼
          </label>
          <input
            id="bc-phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            inputMode="tel"
            placeholder="09xx-xxx-xxx"
            className="w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm focus:border-brand-400 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-stone-500" htmlFor="bc-code">
            密碼
          </label>
          <input
            id="bc-code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            inputMode="numeric"
            placeholder="請輸入 8 碼密碼"
            className="w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm focus:border-brand-400 focus:outline-none"
          />
        </div>

        {error && (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</p>
        )}

        <button
          type="submit"
          className="w-full rounded-lg bg-gradient-to-r from-brand-500 to-brand-400 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
        >
          進入觀看
        </button>
      </form>

      {accounts.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-[11px] font-medium text-stone-500">
            示範情境（點一下自動帶入帳密）
          </p>
          <div className="flex flex-wrap gap-1.5">
            {accounts.map((a) => (
              <button
                key={`${a.room}-${a.label}`}
                type="button"
                onClick={() => {
                  setPhone(a.phone);
                  setCode(a.code);
                  setError(null);
                }}
                className="rounded-full border border-stone-200 px-2.5 py-1 text-[11px] text-stone-600 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-600"
              >
                {a.label}
                <span className="ml-1 text-stone-400">{a.room}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 flex items-start gap-2 rounded-lg bg-stone-50 p-3 text-[11px] leading-relaxed text-stone-500">
        <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-stone-400" />
        <span>{demoHint}</span>
      </div>
    </div>
  );
}
