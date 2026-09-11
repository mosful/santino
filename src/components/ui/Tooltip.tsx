import type { ReactNode } from "react";

export default function Tooltip({ content, children }: { content: string; children: ReactNode }) {
  return (
    <span className="group/tooltip relative inline-flex">
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute right-0 top-full z-[80] mt-2 hidden w-max max-w-64 rounded-lg bg-stone-900 px-2.5 py-1.5 text-left text-xs font-normal leading-relaxed text-white shadow-lg group-hover/tooltip:block group-focus-within/tooltip:block"
      >
        {content}
      </span>
    </span>
  );
}
