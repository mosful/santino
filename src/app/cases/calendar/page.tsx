"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import TodoPage from "@/app/todo/page";

/**
 * 待辦行事曆已移到選單最上層的「待辦事項」（/todo）。
 * 這條舊網址保留給既有連結與書籤：畫面直接渲染同一頁，同時把網址換成新位置。
 */
export default function CalendarPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/todo/");
  }, [router]);
  return <TodoPage />;
}
