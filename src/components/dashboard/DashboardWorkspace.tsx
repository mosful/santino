"use client";

import DashboardLayoutSwitch from "./DashboardLayoutSwitch";
import JourneyDashboard from "./JourneyDashboard";
import PageHeader from "@/components/ui/PageHeader";
import { useDashboardLayout } from "@/lib/dashboardLayoutStore";

export default function DashboardWorkspace({ classicContent }: { classicContent: React.ReactNode }) {
  const layout = useDashboardLayout();

  return (
    <>
      <PageHeader
        title={layout === "journey" ? "1. 媽媽流程中控" : "1. 中控中心"}
        moduleNo="1"
        action={<DashboardLayoutSwitch />}
      />
      {layout === "journey" ? <JourneyDashboard /> : classicContent}
    </>
  );
}
