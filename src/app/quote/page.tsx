"use client";

import { useRouter } from "next/navigation";
import PageHeader from "@/components/ui/PageHeader";
import RequireAccess from "@/components/ui/RequireAccess";
import PricingCalculator from "@/components/cases/PricingCalculator";

/** 套餐速算（櫃台服務的第一個子項，客戶 2026-10-22 指定位置與名稱）。 */
export default function QuotePage() {
  const router = useRouter();
  return (
    <div className="page-frame">
      <RequireAccess moduleNo="1">
        <PageHeader title="套餐速算" />
        <PricingCalculator
          onUse={(name, phone, preset) => {
            const query = new URLSearchParams({
              new: "1",
              name,
              phone,
              roomType: preset.roomType,
              days: String(preset.days),
              hospital: preset.hospital,
              priceClass: preset.priceClass,
              corporateCompany: preset.corporateCompany,
            });
            router.push(`/cases/?${query.toString()}`);
          }}
        />
      </RequireAccess>
    </div>
  );
}
