/**
 * 靜態匯出時的網站根路徑。優先取 NEXT_PUBLIC_BASE_PATH；未設定時，
 * GitHub Pages部署（DEPLOY_TARGET=gh-pages）為 /santino 子路徑，
 * 本機/IIS/Beta維持根目錄空字串。
 *
 * ⚠️ 2026-10-19 起正式站已改掛自訂網域 https://santino.mzoo.cc/ （public/CNAME），
 * 網站架在根目錄而非 /santino/ 子路徑，因此部署workflow明確設
 * NEXT_PUBLIC_BASE_PATH=""（空字串會被 ?? 採用，不會 fallback），
 * 下方 "/santino" 預設值實際上已不生效，僅保留為移除自訂網域時的退路。
 *
 * 純常數檔（無React/瀏覽器依賴），可同時被 next.config.ts（build時）與
 * 一般程式碼（含layout.tsx內嵌script字串）引用，避免兩處各自寫一次而後續改名時漏改。
 * scripts/fix-static-segments.cjs 另有一份同邏輯的判斷（.cjs無法引用TS常數），改這裡要一起改。
 */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? (process.env.DEPLOY_TARGET === "gh-pages" ? "/santino" : "");
