"use client";

import CareTabs, { type CareTabItem } from "@/components/ui/CareTabs";
import PlaceholderNotice from "@/components/ui/PlaceholderNotice";
import {
  BabyAdmission,
  BabyRecord,
  BabyDaily,
  FeedingAssessment,
  GrowthDiary,
  BabyPhoto,
  BabyIO,
  BabyGuidance,
} from "@/components/baby/forms/BabyForms";
import { BABY_QUICK_KEYS } from "@/lib/babyQuickKeys";
import { orderedTabs, type QuickKey } from "@/lib/quickKeys";

function renderForm(room: string, key: string) {
  switch (key) {
    case "admission":
      return <BabyAdmission room={room} />;
    case "record":
      return <BabyRecord room={room} />;
    case "daily":
      return <BabyDaily room={room} />;
    case "feeding":
      return <FeedingAssessment room={room} />;
    case "growth":
      return <GrowthDiary room={room} />;
    case "photo":
      return <BabyPhoto room={room} />;
    case "io":
      return <BabyIO room={room} />;
    case "guidance":
      return <BabyGuidance room={room} />;
    default:
      return <PlaceholderNotice text="次要功能（非寶寶照護8大核心），畫面待後續批次補齊。" />;
  }
}

/** 寶寶照護作業面板：一間房一個視窗，內含各項嬰兒室紀錄頁籤 */
export default function BabyCarePanel({
  room,
  showSecondary,
  activeKey,
  onTabSelect,
}: {
  room: string;
  showSecondary: boolean;
  activeKey: string;
  onTabSelect: (tab: QuickKey) => boolean;
}) {
  const keys = orderedTabs(BABY_QUICK_KEYS, showSecondary);
  const tabs: CareTabItem[] = keys.map((k) => ({ ...k, content: renderForm(room, k.key) }));

  return <CareTabs tabs={tabs} activeKey={activeKey} onTabSelect={onTabSelect} accent="sky" />;
}
