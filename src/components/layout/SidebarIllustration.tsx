/** 側邊欄裝飾插畫：抽象母嬰線條圖，顏色隨主題(brand)自動變化，純CSS/SVG繪製，非外部圖庫素材 */
export default function SidebarIllustration() {
  return (
    <div className="mx-3 mb-3 mt-auto overflow-hidden rounded-2xl bg-brand-50 px-4 pb-0 pt-4">
      <p className="mb-2 text-[11px] leading-relaxed text-brand-600/80">
        用心守護每一位媽媽與寶寶
      </p>
      <svg
        viewBox="0 0 200 110"
        className="h-auto w-full text-brand-300"
        fill="none"
        aria-hidden="true"
      >
        <circle cx="150" cy="90" r="60" fill="currentColor" opacity="0.18" />
        <circle cx="40" cy="30" r="30" fill="currentColor" opacity="0.15" />
        <g stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.9">
          {/* 媽媽 */}
          <circle cx="78" cy="46" r="12" />
          <path d="M58 100c0-18 9-32 20-32s20 14 20 32" />
          {/* 寶寶（懷抱中） */}
          <circle cx="104" cy="66" r="8" />
          <path d="M92 100c0-11 6-20 14-20s13 7 14 18" />
        </g>
      </svg>
    </div>
  );
}
