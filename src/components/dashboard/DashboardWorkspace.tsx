"use client";

import JourneyDashboard from "./JourneyDashboard";
import PageHeader from "@/components/ui/PageHeader";
import { useDashboardLayout } from "@/lib/dashboardLayoutStore";

export default function DashboardWorkspace({ classicContent }: { classicContent: React.ReactNode }) {
  const layout = useDashboardLayout();

  return (
    <>
      <PageHeader title="1. 櫃台服務" moduleNo="1" />
      {layout === "journey" ? <JourneyDashboard /> : classicContent}
    </>
  );
}
