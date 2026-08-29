"use client";

import { useSyncExternalStore } from "react";
import { ArrowUp } from "lucide-react";

const THRESHOLD = 400;

function subscribe(listener: () => void) {
  window.addEventListener("scroll", listener, { passive: true });
  return () => window.removeEventListener("scroll", listener);
}
function getSnapshot() {
  return window.scrollY > THRESHOLD;
}
function getServerSnapshot() {
  return false;
}

export default function BackToTop() {
  const visible = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  if (!visible) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="回到頂端"
      title="回到頂端"
      className="animate-fade-in-up fixed bottom-6 right-6 z-40 flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-r from-brand-500 to-brand-400 text-white shadow-lg shadow-brand-200 transition-transform hover:scale-110 active:scale-95"
    >
      <ArrowUp className="h-5 w-5" />
    </button>
  );
}
