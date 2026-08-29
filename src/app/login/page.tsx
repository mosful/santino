"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { login } from "@/lib/authStore";

export default function LoginPage() {
  const router = useRouter();
  const [empNo, setEmpNo] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!empNo.trim() || !password.trim()) {
      setError("請輸入工號與密碼");
      return;
    }
    setError("");
    login();
    router.push("/");
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
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

        <h1 className="mb-4 text-center text-lg font-bold text-stone-800">登入</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs text-stone-500">工號</label>
            <input
              value={empNo}
              onChange={(e) => setEmpNo(e.target.value)}
              placeholder="例如 SYS001"
              className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
              autoFocus
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-stone-500">密碼</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="請輸入密碼"
              className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
            />
          </div>
          {error && <p className="text-xs text-rose-500">{error}</p>}
          <button
            type="submit"
            className="w-full rounded-lg bg-gradient-to-r from-brand-500 to-brand-400 px-4 py-2.5 text-sm font-medium text-white shadow-sm shadow-brand-200 transition-all hover:shadow-md active:scale-95"
          >
            登入
          </button>
        </form>

        <div className="mt-4 text-center text-xs">
          <Link href="/forgot-password" className="text-brand-500 underline">
            忘記密碼？
          </Link>
        </div>

        <p className="mt-6 rounded-lg bg-stone-50 p-3 text-center text-[11px] leading-relaxed text-stone-400">
          ⚠ 靜態畫面稿：輸入任意工號與密碼即可登入，尚無真實帳號驗證機制。
        </p>
      </div>
    </div>
  );
}
