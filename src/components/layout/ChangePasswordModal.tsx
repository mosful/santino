"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import Modal from "@/components/ui/Modal";

export default function ChangePasswordModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  function reset() {
    setCurrent("");
    setNext("");
    setConfirm("");
    setError("");
    setDone(false);
  }

  function handleClose() {
    reset();
    onClose();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!current.trim() || !next.trim() || !confirm.trim()) {
      setError("請完整填寫所有欄位");
      return;
    }
    if (next !== confirm) {
      setError("新密碼與確認新密碼不一致");
      return;
    }
    setError("");
    setDone(true);
  }

  return (
    <Modal open={open} title="修改密碼" onClose={handleClose}>
      {done ? (
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <CheckCircle2 className="h-10 w-10 text-emerald-500" />
          <p className="text-sm font-medium text-stone-700">密碼已更新（模擬畫面，未真實變更帳號密碼）</p>
          <button onClick={handleClose} className="rounded-lg bg-stone-100 px-4 py-2 text-xs">
            關閉
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs text-stone-500">目前密碼</label>
            <input
              type="password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              className="w-full rounded-lg border border-stone-200 px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-stone-500">新密碼</label>
            <input
              type="password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              className="w-full rounded-lg border border-stone-200 px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-stone-500">確認新密碼</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full rounded-lg border border-stone-200 px-2 py-1.5 text-sm"
            />
          </div>
          {error && <p className="text-xs text-rose-500">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={handleClose} className="rounded-lg bg-stone-100 px-4 py-2 text-xs">
              取消
            </button>
            <button type="submit" className="rounded-lg bg-brand-500 px-4 py-2 text-xs text-white">
              確認修改
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
