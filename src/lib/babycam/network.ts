/**
 * 監視器與繼電器板的網路位址。
 *
 * 末碼與編碼格式**複製自 BabyCam 的 `src/lib/seed.ts` 的 `cameraSeeds`**，
 * 繼電器板末碼與連接埠取自 BabyCam 的 `.env.example`（A＝5、B＝6、port 8234）。
 *
 * ⚠️ 網段前綴為院內 IPCam 專網的實際值 `192.168.202`，**經使用者 2026-10-20 明確指示
 * 直接顯示完整位址**（BabyCam 自己是放在不進版控的 `.env.local`，repo 內寫 `192.168.xxx`）。
 * 本專案的 DEMO 會部署到公開的 GitHub Pages（santino.mzoo.cc），這組位址因此是公開的。
 * 若日後要收回，改這裡的 DEFAULT_NETWORK_PREFIX 即可——顯示端一律讀
 * `DemoDomain.networkPrefix`，沒有第二處寫死。
 */

/** 監視器編號 → 位址末碼與編碼格式（與 BabyCam 的 cameraSeeds 同一份）。 */
const CAMERA_SEEDS: [code: string, hostSuffix: number, codec: string][] = [
  ["A01", 20, "H.264"], ["A02", 21, "H.264"], ["A03", 22, "H.264"],
  ["A05", 23, "HEVC"], ["A06", 24, "H.264"], ["A07", 11, "HEVC"],
  ["A08", 12, "HEVC"], ["A09", 13, "HEVC"], ["A10", 14, "HEVC"],
  ["A11", 15, "HEVC"], ["A12", 16, "HEVC"], ["A13", 17, "HEVC"],
  ["A15", 19, "HEVC"], ["A16", 28, "HEVC"], ["A17", 27, "HEVC"],
  ["A18", 26, "HEVC"], ["A19", 25, "HEVC"], ["A20", 31, "HEVC"],
  ["A21", 30, "HEVC"], ["A22", 29, "H.264"], ["A23", 18, "H.264"],
  ["B01", 47, "H.264"], ["B02", 44, "H.264"], ["B03", 41, "H.264"],
  ["B05", 49, "HEVC"], ["B06", 46, "HEVC"], ["B07", 43, "HEVC"],
  ["B08", 42, "H.264"], ["B09", 45, "H.264"], ["B10", 48, "H.264"],
  ["B11", 52, "HEVC"], ["B12", 51, "HEVC"], ["B13", 50, "HEVC"],
];

const BY_CODE = new Map(CAMERA_SEEDS.map(([code, hostSuffix, codec]) => [code, { hostSuffix, codec }]));

/** 院內 IPCam 專網的網段前綴（見檔頭說明）。 */
export const DEFAULT_NETWORK_PREFIX = "192.168.202";

/** 繼電器板：末碼與連接埠取自 BabyCam 的 .env.example。 */
export const RELAY_ENDPOINTS: Record<"A" | "B", { suffix: number; port: number; unitId: number }> = {
  A: { suffix: 5, port: 8234, unitId: 1 },
  B: { suffix: 6, port: 8234, unitId: 1 },
};

export function cameraHostSuffix(code: string): number | undefined {
  return BY_CODE.get(code.toUpperCase())?.hostSuffix;
}

export function cameraCodec(code: string): string | undefined {
  return BY_CODE.get(code.toUpperCase())?.codec;
}

/** 監視器位址；查無末碼（例如後來手動新增的鏡頭）回 null，由呼叫端顯示「未設定」。 */
export function cameraHost(prefix: string, code: string): string | null {
  const suffix = cameraHostSuffix(code);
  return suffix === undefined ? null : `${prefix}.${suffix}`;
}

/** 繼電器板位址（含連接埠）。 */
export function relayHost(prefix: string, zone: "A" | "B"): string {
  const endpoint = RELAY_ENDPOINTS[zone];
  return `${prefix}.${endpoint.suffix}:${endpoint.port}`;
}
