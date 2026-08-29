"use client";

import PageHeader from "@/components/ui/PageHeader";
import RequireAccess from "@/components/ui/RequireAccess";
import TabsFromUrl from "@/components/ui/TabsFromUrl";
import EditableList, { type FieldSchema, type Row } from "@/components/ui/EditableList";
import MemberBinding from "./tabs/MemberBinding";
import BroadcastMessage from "./tabs/BroadcastMessage";
import CourseNotify from "./tabs/CourseNotify";
import MessageStats from "./tabs/MessageStats";
import { makeRng, makeUniqueNameGenerator } from "@/lib/mock/genUtil";

const CATEGORIES = ["好友", "好友", "好友", "會員", "會員", "員工", "廠商", "封鎖"];
const rngFriend = makeRng(14001);
const usedLineIds = new Set<number>();
function nextLineId() {
  let n = rngFriend.int(10000, 99999);
  while (usedLineIds.has(n)) n = rngFriend.int(10000, 99999);
  usedLineIds.add(n);
  return n;
}
const nextFriendName = makeUniqueNameGenerator(rngFriend, ["邱o乾"]);
const FRIENDS: Row[] = [
  { id: 1, name: "邱o乾", category: "會員" },
  { id: 2, name: "LINE用戶88231", category: "好友" },
  { id: 3, name: "陳小美（客服）", category: "員工" },
  ...Array.from({ length: 47 }, (_, i) => {
    const category = rngFriend.pick(CATEGORIES);
    return {
      id: i + 4,
      name: category === "好友" ? `LINE用戶${nextLineId()}` : nextFriendName(),
      category,
    };
  }),
];
const friendFields: FieldSchema[] = [
  { key: "name", label: "顯示名稱" },
  { key: "category", label: "分類", type: "select", options: ["好友", "會員", "員工", "廠商", "封鎖"] },
];

function FriendTab() {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2 text-xs">
        <span className="text-stone-400">席位數：3/5（LINE多人客服席位授權，非院內床位）</span>
      </div>
      <EditableList moduleNo="14" fields={friendFields} initialRows={FRIENDS} searchPlaceholder="顯示名稱" />
    </div>
  );
}

export default function LinePage() {
  return (
    <div className="w-full px-4 py-3 sm:px-6 sm:py-4">
      <RequireAccess moduleNo="14">
      <PageHeader title="14. LINE官方帳號管理" moduleNo="14" />
      <p className="mb-3 text-xs text-amber-600">
        ⚠ LINE App串接與推播通知列為第二階段（本次不做，僅保留架構擴充彈性）；
        Webhook對外HTTPS曝露方式需另行規劃（見規格文件7.6節）。以下畫面為全新規劃示意稿，無舊系統截圖可對照。
      </p>
      <TabsFromUrl
        tabs={[
          { key: "friends", label: "好友管理", content: <FriendTab /> },
          { key: "binding", label: "會員LINE綁定管理", content: <MemberBinding /> },
          { key: "broadcast", label: "群發訊息", content: <BroadcastMessage /> },
          { key: "course-notify", label: "課程通知", content: <CourseNotify /> },
          { key: "stats", label: "訊息發送成效統計", content: <MessageStats /> },
        ]}
      />
      </RequireAccess>
    </div>
  );
}
