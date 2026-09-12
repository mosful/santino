"use client";

import { useEffect, useState, type ButtonHTMLAttributes } from "react";
import { CheckCircle2 } from "lucide-react";

type DemoActionButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  feedback: string;
  action?: "print";
};

/**
 * 靜態原型共用操作按鈕：讓尚未串接後端的動作仍有明確、可驗收的畫面回饋。
 */
export default function DemoActionButton({
  feedback,
  action,
  children,
  type = "button",
  onClick,
  ...props
}: DemoActionButtonProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!visible) return;
    const timer = window.setTimeout(() => setVisible(false), 2600);
    return () => window.clearTimeout(timer);
  }, [visible]);

  return (
    <>
      <button
        {...props}
        type={type}
        onClick={(event) => {
          onClick?.(event);
          if (action === "print") window.print();
          if (!event.defaultPrevented) setVisible(true);
        }}
      >
        {children}
      </button>
      {visible && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 left-1/2 z-[100] flex max-w-[calc(100vw-2rem)] -translate-x-1/2 items-center gap-2 rounded-xl bg-stone-900 px-4 py-3 text-sm text-white shadow-xl"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
          {feedback}
        </div>
      )}
    </>
  );
}
