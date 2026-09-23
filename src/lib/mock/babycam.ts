/**
 * 寶寶視訊 WebCam 模組假資料。
 *
 * 本模組不屬於 Phase 1／Phase 2，是客戶指定優先開發的獨立範圍。
 * 所有資料皆為示意用途：姓名去識別化、監視器位址一律遮蔽，
 * 不含任何真實 IP、攝影機帳密或真實影像。
 */
import { makeRng, makeUniqueNameGenerator, pad2 } from "./genUtil";
import { MAMA_ROOMS } from "./mamaRoom";

/** 顯示狀態：沿用舊系統 9 種，另加「正常顯示」為預設值。非正常顯示一律遮蔽畫面。 */
export type CamStatus = {
  key: string;
  label: string;
  masked: boolean;
};

export const CAM_STATUSES: CamStatus[] = [
  { key: "normal", label: "正常顯示", masked: false },
  { key: "rooming-in", label: "親子同室", masked: true },
  { key: "nursing", label: "護理", masked: true },
  { key: "disinfect", label: "消毒", masked: true },
  { key: "isolation", label: "隔離", masked: true },
  { key: "feeding", label: "餵奶", masked: true },
  { key: "swimming", label: "游泳", masked: true },
  { key: "uv", label: "環境紫消", masked: true },
  { key: "touch", label: "撫觸", masked: true },
  { key: "no-visit", label: "非探視", masked: true },
];

export const STATUS_BY_KEY: Record<string, CamStatus> = Object.fromEntries(
  CAM_STATUSES.map((s) => [s.key, s])
);

export type Camera = {
  id: string;
  /** 監視器編號（對應舊系統 cctv_list 的編號慣例） */
  code: string;
  codec: "HEVC" | "H.264";
  /** 位址一律遮蔽，DEMO 不顯示真實內網 IP */
  addr: string;
  resolution: string;
  enabled: boolean;
  /** 最後成功截圖時間 HH:mm:ss */
  lastShotAt: string;
  /** 最後同步到 DMZ 的時間 HH:mm:ss */
  lastSyncAt: string;
  /** true＝逾時未更新，監控面板標紅字 */
  abnormal: boolean;
};

/** 舊系統實測 33 支：HEVC 21 支、H.264 12 支，全數 1080p */
const CODEC_PATTERN: ("HEVC" | "H.264")[] = [
  "H.264", "H.264", "H.264", "HEVC", "H.264", "HEVC", "HEVC", "HEVC", "HEVC", "HEVC",
  "HEVC", "HEVC", "HEVC", "HEVC", "HEVC", "HEVC", "HEVC", "HEVC", "HEVC", "H.264",
  "H.264", "H.264", "H.264", "H.264", "HEVC", "HEVC", "HEVC", "H.264", "H.264", "H.264",
  "HEVC", "HEVC", "HEVC",
];

/** 刻意做成異常的兩支，用於監控面板紅字與親友端降級顯示示範 */
const ABNORMAL_INDEX = new Set([12, 27]);

const camRng = makeRng(8258);

export const CAMERAS: Camera[] = CODEC_PATTERN.map((codec, i) => {
  const n = i + 1;
  const abnormal = ABNORMAL_INDEX.has(i);
  const shotMin = camRng.int(10, 58);
  return {
    id: `cam-${pad2(n)}`,
    code: `CAM-${pad2(n)}`,
    codec,
    addr: `192.168.xxx.${pad2(camRng.int(11, 52))}`,
    resolution: "1920×1080",
    enabled: true,
    lastShotAt: abnormal ? `09:${pad2(shotMin)}:0${camRng.int(1, 9)}` : `14:32:${pad2(camRng.int(10, 59))}`,
    lastSyncAt: abnormal ? `09:${pad2(shotMin)}:12` : `14:32:${pad2(camRng.int(10, 59))}`,
    abnormal,
  };
});

export const CAMERA_BY_ID: Record<string, Camera> = Object.fromEntries(
  CAMERAS.map((c) => [c.id, c])
);

export type Binding = {
  id: string;
  room: string;
  motherName: string;
  babyName: string;
  /** 一房可綁多支（雙胞胎） */
  camIds: string[];
  statusKey: string;
  /** 開放時段，openTo 小於 openFrom 代表跨夜 */
  openFrom: string;
  openTo: string;
  validFrom: string;
  validTo: string;
  /** 媽媽端帳號 */
  mamaPhone: string;
  mamaCode: string;
  /** 親友端共用密碼＋手機白名單 */
  familyCode: string;
  familyWhitelist: string[];
};

const bindRng = makeRng(3311);
const nextName = makeUniqueNameGenerator(bindRng, ["邱o乾", "林o臻", "張o雅"]);

function phone(rng: ReturnType<typeof makeRng>) {
  return `09${rng.int(10, 99)}-${rng.int(100, 999)}-${rng.int(100, 999)}`;
}

function code8(rng: ReturnType<typeof makeRng>) {
  return String(rng.int(10000000, 99999999));
}

/** 只取有入住的房間來綁定監視器，房號與媽媽照護／寶寶照護一致 */
const OCCUPIED_ROOMS = MAMA_ROOMS.filter(
  (r) => r.status === "入住" || r.status === "親子同室"
).slice(0, 28);

/** 刻意做成雙胞胎（一房兩支）的房號 */
const TWIN_ROOMS = new Set(["305", "402"]);

let camCursor = 0;
export const BINDINGS: Binding[] = OCCUPIED_ROOMS.map((r, i) => {
  const twin = TWIN_ROOMS.has(r.room);
  const camIds = [CAMERAS[camCursor % CAMERAS.length].id];
  camCursor++;
  if (twin) {
    camIds.push(CAMERAS[camCursor % CAMERAS.length].id);
    camCursor++;
  }

  const overnight = i % 9 === 4;
  const statusKey =
    r.status === "親子同室"
      ? "rooming-in"
      : i % 7 === 3
        ? "nursing"
        : i % 11 === 5
          ? "feeding"
          : "normal";

  const whitelistCount = bindRng.int(2, 4);
  return {
    id: `bind-${r.room}`,
    room: r.room,
    motherName: r.motherName ?? nextName(),
    babyName: twin ? "雙胞胎（兩位）" : `${(r.motherName ?? "陳o如")[0]}小弟／小妹`,
    camIds,
    statusKey,
    openFrom: overnight ? "20:00" : "09:00",
    openTo: overnight ? "02:00" : "21:00",
    validFrom: r.stayRange?.split("~")[0] ?? "08/20",
    validTo: r.stayRange?.split("~")[1] ?? "09/17",
    mamaPhone: phone(bindRng),
    mamaCode: code8(bindRng),
    familyCode: code8(bindRng),
    familyWhitelist: Array.from({ length: whitelistCount }, () => phone(bindRng)),
  };
});

export const BINDING_BY_ROOM: Record<string, Binding> = Object.fromEntries(
  BINDINGS.map((b) => [b.room, b])
);

/** 監控面板統計 */
export const CAM_SUMMARY = {
  total: CAMERAS.length,
  bound: BINDINGS.reduce((n, b) => n + b.camIds.length, 0),
  abnormal: CAMERAS.filter((c) => c.abnormal).length,
  twins: BINDINGS.filter((b) => b.camIds.length > 1).length,
};

/** DEMO 情境設定：讓客戶在畫面上實際看到各種邊界狀況 */
export const DEMO_LOGIN = {
  /** 示範降級顯示（最新截圖取不到，改顯示最後一張可用截圖）的房間 */
  degradedRoom: BINDINGS.find((b) => b.camIds.some((id) => CAMERA_BY_ID[id]?.abnormal))?.room,
  /** 示範「有效期限已過」的房間 */
  expiredRoom: BINDINGS[BINDINGS.length - 1]?.room,
};

export type DemoAccount = {
  label: string;
  room: string;
  phone: string;
  code: string;
};

/**
 * 登入頁一鍵帶入的示範情境。
 *
 * allDay=true 的情境會把該房改為全日開放，否則深夜展示 DEMO 時會被「非開放時段」
 * 蓋掉它原本要示範的東西（例如雙胞胎分頁、狀態遮蔽）。
 * 「限時段」與「跨夜時段」兩組刻意保留原時段，就是要示範時段限制本身。
 */
type Scenario = {
  label: string;
  pick: (b: Binding) => boolean;
  /** 改為全日開放，避免深夜展示時被「非開放時段」蓋掉要示範的內容 */
  allDay: boolean;
  /** 狀態固定為「正常顯示」，避免遮蔽畫面蓋掉要示範的內容 */
  normalStatus: boolean;
};

const SCENARIOS: Scenario[] = [
  { label: "正常顯示", pick: (b) => b.room === BINDINGS[0]?.room, allDay: true, normalStatus: true },
  { label: "雙胞胎（兩支）", pick: (b) => b.camIds.length > 1, allDay: true, normalStatus: true },
  { label: "狀態遮蔽", pick: (b) => STATUS_BY_KEY[b.statusKey]?.masked === true, allDay: true, normalStatus: false },
  { label: "限時段 09:00–21:00", pick: (b) => b.openFrom === "09:00", allDay: false, normalStatus: true },
  { label: "跨夜時段", pick: (b) => b.openTo < b.openFrom, allDay: false, normalStatus: true },
  { label: "截圖逾時（降級顯示）", pick: (b) => b.room === DEMO_LOGIN.degradedRoom, allDay: true, normalStatus: true },
  { label: "效期已過", pick: (b) => b.room === DEMO_LOGIN.expiredRoom, allDay: true, normalStatus: true },
];

/** 親友端才需要示範的情境（媽媽端不受效期限制，也看不到截圖降級） */
const FAMILY_ONLY = new Set(["截圖逾時（降級顯示）", "效期已過"]);

const chosen: { label: string; binding: Binding }[] = [];
const takenRooms = new Set<string>();
for (const s of SCENARIOS) {
  const hit = BINDINGS.find((b) => !takenRooms.has(b.room) && s.pick(b));
  if (!hit) continue;
  takenRooms.add(hit.room);
  if (s.allDay) {
    hit.openFrom = "00:00";
    hit.openTo = "23:59";
  }
  if (s.normalStatus) hit.statusKey = "normal";
  chosen.push({ label: s.label, binding: hit });
}

function toAccounts(kind: "mama" | "family"): DemoAccount[] {
  return chosen
    .filter((c) => kind === "family" || !FAMILY_ONLY.has(c.label))
    .map(({ label, binding: b }) => ({
      label,
      room: b.room,
      phone: kind === "mama" ? b.mamaPhone : b.familyWhitelist[0],
      code: kind === "mama" ? b.mamaCode : b.familyCode,
    }));
}

export const DEMO_ACCOUNTS = {
  mama: toAccounts("mama"),
  family: toAccounts("family"),
};

/** 對外觀看網址（示意，與舊系統寶寶視訊單版面一致） */
export const VIEW_URL = {
  mama: "https://santino.example.com.tw/view/mama",
  family: "https://santino.example.com.tw/view/family",
};
