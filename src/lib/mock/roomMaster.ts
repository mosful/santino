/**
 * 房號主檔 —— 全院唯一來源。
 *
 * 內容複製自 BabyCam 專案的 `src/lib/room-master-v6.ts`（2026-10-07 現場快照），
 * 是目前唯一有憑據的房號清單：共 27 間，2／3／5／6 樓，**各樓層跳過 04**，
 * VIP 8 間、精緻房 18 間、VILLA 1 間。
 *
 * ⚠️ 這份取代了原本 301–711 共 51 間的虛構房號。改房號請同時確認：
 * `mamaRoom.ts`（房卡與住客）、`opsRoom.ts`（房務與計費）、
 * `demo/domainSeed.ts` 的 `rooms`，以及首頁房況總覽的樓層分組。
 * 兩套系統的房號必須一致，否則寶寶視訊綁定的房號會對不上院務系統的房號。
 */
export type RoomTypeName = "精緻房" | "VIP房" | "VILLA";

export const ROOM_MASTER: { room: string; roomType: RoomTypeName }[] = [
  { room: "201", roomType: "VIP房" },
  { room: "202", roomType: "精緻房" },
  { room: "203", roomType: "精緻房" },
  { room: "205", roomType: "精緻房" },
  { room: "206", roomType: "精緻房" },
  { room: "207", roomType: "精緻房" },
  { room: "208", roomType: "VIP房" },
  { room: "301", roomType: "VIP房" },
  { room: "302", roomType: "精緻房" },
  { room: "303", roomType: "精緻房" },
  { room: "305", roomType: "精緻房" },
  { room: "306", roomType: "精緻房" },
  { room: "307", roomType: "精緻房" },
  { room: "308", roomType: "VIP房" },
  { room: "501", roomType: "VIP房" },
  { room: "502", roomType: "精緻房" },
  { room: "503", roomType: "精緻房" },
  { room: "505", roomType: "精緻房" },
  { room: "506", roomType: "精緻房" },
  { room: "507", roomType: "精緻房" },
  { room: "508", roomType: "VIP房" },
  { room: "601", roomType: "VIP房" },
  { room: "602", roomType: "精緻房" },
  { room: "603", roomType: "VILLA" },
  { room: "605", roomType: "精緻房" },
  { room: "606", roomType: "精緻房" },
  { room: "607", roomType: "VIP房" },
];

export const ROOM_NOS: string[] = ROOM_MASTER.map((item) => item.room);

const BY_ROOM = new Map(ROOM_MASTER.map((item) => [item.room, item.roomType]));

/** 查房型；房號不在主檔時回精緻房（示範資料用，正式版應視為資料錯誤）。 */
export function roomTypeOf(room: string): RoomTypeName {
  return BY_ROOM.get(room) ?? "精緻房";
}
