/**
 * 寶寶監視器環狀燈的佈線對照表。
 *
 * 資料來源：2026-10-02 現場兩張手寫佈線表（分別標註 A 區與 B 區繼電器板）
 * ＋ 舊系統 cctv_list 的監視器編號與 IP 交叉比對。
 *
 * 結構：每台監視器佔用 **3 個連續通道**，順序固定為紅 → 綠 → 藍。
 * 顏色順序由佈線表明確標註（「B03 ①紅 ②綠 ③藍」「B08 ④紅 ⑤綠 ⑥藍」）確認。
 *
 * - A 區板：16 台 × 3 ＝ 48 通道，恰好用滿。
 * - B 區板：12 台 × 3 ＝ 36 通道，尚餘 12 通道未使用。
 *
 * ⚠️ A 區另有 A16、A17、A20、A21、A22 五台，兩張佈線表都沒有對應通道
 * （其 IP 散落在 A 區連號之中，屬刻意跳過）。這五台的環狀燈可能接在尚未
 * 發現的第三片板子、或根本沒有安裝，需現場確認。查無佈線時應安靜略過。
 *
 * 🔐 本檔**不得出現完整內網位址**。繼電器板位址一律以「網段前綴（環境變數）
 * ＋ 末碼」組成，與 BabyCam 既有的 CAMERA_HOST_PREFIX 慣例一致。
 */

/** 環狀燈顏色。每台監視器佔 3 個連續通道，依序為紅、綠、藍。 */
export const RING_LIGHT_COLORS = ["red", "green", "blue"] as const;
export type RingLightColor = (typeof RING_LIGHT_COLORS)[number];

/** 繼電器板分區。 */
export type RelayZone = "A" | "B";

export type RingLightChannel = {
  /** Modbus 保持暫存器位址（0 起算）。 */
  register: number;
  /** 中盛測試軟體面板上的 Y 編號（1 起算）；Y{n} = 暫存器 n−1。 */
  yNumber: number;
  color: RingLightColor;
};

export type RingLight = {
  /** 監視器編號，對應 BabyCam cameras.code。 */
  cameraCode: string;
  zone: RelayZone;
  /** 三個顏色通道，依序為紅、綠、藍。 */
  channels: readonly RingLightChannel[];
};

/**
 * 手寫佈線表原文順序：監視器編號 → 起始通道（1 起算）。
 * 刻意保留紙上的順序（非編號排序），方便與現場表格逐行核對。
 */
const LAYOUT: Readonly<Record<RelayZone, ReadonlyArray<readonly [string, number]>>> = {
  A: [
    ["A07", 1], ["A08", 4], ["A09", 7], ["A10", 10],
    ["A11", 13], ["A12", 16], ["A13", 19], ["A23", 22],
    ["A15", 25], ["A01", 28], ["A02", 31], ["A03", 34],
    ["A05", 37], ["A06", 40], ["A19", 43], ["A18", 46],
  ],
  B: [
    ["B03", 1], ["B08", 4], ["B07", 7], ["B02", 10],
    ["B09", 13], ["B06", 16], ["B01", 19], ["B10", 22],
    ["B05", 25], ["B13", 28], ["B12", 31], ["B11", 34],
  ],
};

/**
 * 已知存在於監視器主檔、但兩張佈線表都未標註通道者。
 * 沒有環狀燈可控，排程時應安靜略過。
 */
export const UNMAPPED_CAMERA_CODES: readonly string[] = ["A16", "A17", "A20", "A21", "A22"];

function build(): Map<string, RingLight> {
  const map = new Map<string, RingLight>();
  for (const zone of ["A", "B"] as const) {
    for (const [cameraCode, startChannel] of LAYOUT[zone]) {
      const channels = RING_LIGHT_COLORS.map((color, index) => {
        const yNumber = startChannel + index;
        return { register: yNumber - 1, yNumber, color };
      });
      map.set(cameraCode, { cameraCode, zone, channels });
    }
  }
  return map;
}

const BY_CAMERA = build();

/** 所有已知佈線的環狀燈，依手寫表原始順序排列。 */
export const ALL_RING_LIGHTS: readonly RingLight[] = [...BY_CAMERA.values()];

/** 以監視器編號查詢環狀燈佈線；查無（含未佈線的五台）回傳 undefined。 */
export function ringLightFor(cameraCode: string): RingLight | undefined {
  return BY_CAMERA.get(cameraCode.toUpperCase());
}

/** 取得指定分區上的所有環狀燈。 */
export function ringLightsInZone(zone: RelayZone): RingLight[] {
  return ALL_RING_LIGHTS.filter((light) => light.zone === zone);
}

/** 反查某分區的某個暫存器屬於哪台監視器的哪個顏色。 */
export function ringLightByRegister(
  zone: RelayZone,
  register: number,
): { cameraCode: string; color: RingLightColor } | undefined {
  for (const light of ringLightsInZone(zone)) {
    for (const channel of light.channels) {
      if (channel.register === register) {
        return { cameraCode: light.cameraCode, color: channel.color };
      }
    }
  }
  return undefined;
}
