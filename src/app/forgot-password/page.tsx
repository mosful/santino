"use client";

import { useState } from "react";
import Link from "next/link";
import { MailCheck } from "lucide-react";
import { pageTitle } from "@/lib/usePageTitle";

export default function ForgotPasswordPage() {
  const [account, setAccount] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!account.trim()) {
      setError("請輸入工號或Email");
      return;
    }
    setError("");
    setSent(true);
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <title>{pageTitle("忘記密碼")}</title>
      <div className="animate-fade-in-up w-full max-w-sm rounded-2xl border border-brand-900/10 bg-white p-8 shadow-lg">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-accent-400 text-lg font-bold text-white shadow-sm">
            聖
          </div>
          <div>
            <div className="text-sm font-bold text-stone-800">聖帝諾產後護理之家</div>
            <div className="text-xs text-stone-400">院務管理系統</div>
          </div>
        </div>

        {sent ? (
          <div className="flex flex-col items-center gap-3 text-center">
            <MailCheck className="h-10 w-10 text-brand-400" />
            <p className="text-sm font-medium text-stone-700">重設密碼連結已寄出</p>
            <p className="text-xs text-stone-400">
              若「{account}」為有效帳號，系統已寄送重設密碼連結至對應信箱（模擬畫面，未真實寄送）。
            </p>
            <Link
              href="/login"
              className="mt-2 w-full rounded-lg bg-gradient-to-r from-brand-500 to-brand-400 px-4 py-2.5 text-center text-sm font-medium text-white shadow-sm shadow-brand-200"
            >
              返回登入
            </Link>
          </div>
        ) : (
          <>
            <h1 className="mb-2 text-center text-lg font-bold text-stone-800">忘記密碼</h1>
            <p className="mb-4 text-center text-xs text-stone-400">請輸入您的工號或Email，我們將寄送重設密碼連結給您。</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs text-stone-500">工號 / Email</label>
                <input
                  value={account}
                  onChange={(e) => setAccount(e.target.value)}
                  placeholder="例如 SYS001 或 name@aetgroup.com"
                  className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
                  autoFocus
                />
              </div>
              {error && <p className="text-xs text-rose-500">{error}</p>}
              <button
                type="submit"
                className="w-full rounded-lg bg-gradient-to-r from-brand-500 to-brand-400 px-4 py-2.5 text-sm font-medium text-white shadow-sm shadow-brand-200 transition-all hover:shadow-md active:scale-95"
              >
                寄送重設密碼連結
              </button>
            </form>
            <div className="mt-4 text-center text-xs">
              <Link href="/login" className="text-brand-500 underline">
                返回登入
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
