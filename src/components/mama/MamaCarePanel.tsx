"use client";

import CareTabs, { type CareTabItem } from "@/components/ui/CareTabs";
import PlaceholderNotice from "@/components/ui/PlaceholderNotice";
import AdmissionAssessment from "@/components/mama/forms/AdmissionAssessment";
import OngoingCare from "@/components/mama/forms/OngoingCare";
import PaperScoreForm from "@/components/mama/forms/PaperScoreForm";
import NursingGuidance from "@/components/mama/forms/NursingGuidance";
import { MAMA_QUICK_KEYS } from "@/lib/mamaQuickKeys";
import { orderedTabs, type QuickKey } from "@/lib/quickKeys";

function renderForm(room: string, key: string) {
  switch (key) {
    case "admission":
      return <AdmissionAssessment room={room} />;
    case "ongoing":
    case "record":
      return <OngoingCare room={room} />;
    case "social":
      return <PaperScoreForm room={room} title="社會支持" />;
    case "mood":
      return <PaperScoreForm room={room} title="心情量表" />;
    case "guidance":
      return <NursingGuidance room={room} />;
    case "health-edu-eval":
      return (
        <PlaceholderNotice text="衛教認知評估單：衛教師新增項目，實際欄位內容尚未與客戶確認，先保留版位，待補充後再設計表單（見規格文件8.2節待確認事項）。" />
      );
    default:
      return (
        <PlaceholderNotice text="次要功能（非媽媽照護6大核心），畫面待後續批次補齊，目前僅保留頁籤版位。" />
      );
  }
}

/** 媽媽照護作業面板：一間房一個視窗，內含各項護理紀錄頁籤 */
export default function MamaCarePanel({
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
  const keys = orderedTabs(MAMA_QUICK_KEYS, showSecondary);
  const tabs: CareTabItem[] = keys.map((k) => ({ ...k, content: renderForm(room, k.key) }));

  return <CareTabs tabs={tabs} activeKey={activeKey} onTabSelect={onTabSelect} accent="rose" />;
}
