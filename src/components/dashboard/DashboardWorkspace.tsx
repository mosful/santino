"use client";

import JourneyDashboard from "./JourneyDashboard";
import PageHeader from "@/components/ui/PageHeader";
import { useDashboardLayout } from "@/lib/dashboardLayoutStore";
import { canUseCaseFlow } from "@/lib/permissions";
import { useCurrentRole } from "@/lib/roleStore";

export default function DashboardWorkspace({ classicContent }: { classicContent: React.ReactNode }) {
  const layout = useDashboardLayout();
  const role = useCurrentRole();

  return (
    <>
      <PageHeader title={canUseCaseFlow(role) ? "1. 櫃台服務" : "首頁・房況"} moduleNo="1" />
      {layout === "journey" ? <JourneyDashboard /> : classicContent}
    </>
  );
}
