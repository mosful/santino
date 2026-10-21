"use client";

import { ArrowUp } from "lucide-react";
import Button from "@/components/ui/Button";
import { scrollToTop, usePageScrollable } from "@/components/ui/BackToTop";

/*
  頁尾。另掛一個「回到頁首」連結：浮動鈕只有捲到一半時才看得到，
  捲到最底下要回頭時，這裡才是現場真的會找的位置。
  頁面短到不需要捲動時整個隱藏，不留一顆按了沒反應的鈕。
*/
export default function Footer() {
  const year = new Date().getFullYear();
  const scrollable = usePageScrollable();

  return (
    <footer className="border-t border-brand-900/10 px-4 py-4 text-center text-xs text-stone-400">
      {scrollable && (
        <Button size="sm" className="mb-3 !rounded-full print:hidden" onClick={scrollToTop}>
          <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
          回到頁首
        </Button>
      )}
      <p className="font-medium tracking-wide text-stone-500">
        AET SustainTek　<span className="tracking-[0.3em]">宇沛永續</span>
      </p>
      <p className="mt-0.5">© {year} 宇沛永續股份有限公司</p>
    </footer>
  );
}
