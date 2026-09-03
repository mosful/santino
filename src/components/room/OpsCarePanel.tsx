"use client";

import CareTabs, { type CareTabItem } from "@/components/ui/CareTabs";
import PlaceholderNotice from "@/components/ui/PlaceholderNotice";
import {
  Prep,
  ExtendChangeRoom,
  MotherOuting,
  Complaint,
  VisitorInfo,
  CompanionInfo,
  BabyVideoForm,
  IdPhoto,
} from "@/components/room/forms/OpsForms";
import { OPS_QUICK_KEYS } from "@/lib/opsQuickKeys";
import type { QuickKey } from "@/lib/quickKeys";

function renderForm(room: string, key: string) {
  switch (key) {
    case "prep":
      return <Prep room={room} />;
    case "extend":
      return <ExtendChangeRoom room={room} />;
    case "outing":
      return <MotherOuting room={room} />;
    case "complaint":
      return <Complaint room={room} />;
    case "visitor":
      return <VisitorInfo room={room} />;
    case "companion":
      return <CompanionInfo room={room} />;
    case "baby-video":
      return <BabyVideoForm room={room} />;
    case "id-photo":
      return <IdPhoto room={room} />;
    default:
      return <PlaceholderNotice text="房務版房卡功能，畫面待後續批次補齊。" />;
  }
}

/** 房務版房卡作業面板：一間房一個視窗，8 項房務作業皆為頁籤（無核心／次要之分） */
export default function OpsCarePanel({
  room,
  activeKey,
  onTabSelect,
}: {
  room: string;
  activeKey: string;
  onTabSelect: (tab: QuickKey) => boolean;
}) {
  const tabs: CareTabItem[] = OPS_QUICK_KEYS.map((k) => ({ ...k, content: renderForm(room, k.key) }));

  return <CareTabs tabs={tabs} activeKey={activeKey} onTabSelect={onTabSelect} accent="teal" />;
}
