/**
 * 靜態匯出時的網站根路徑。GitHub Pages部署（DEPLOY_TARGET=gh-pages）時為
 * /santino 子路徑，本機/IIS/Beta維持根目錄空字串。
 * 純常數檔（無React/瀏覽器依賴），可同時被 next.config.ts（build時）與
 * 一般程式碼（含layout.tsx內嵌script字串）引用，避免兩處各自寫一次而後續改名時漏改。
 */
export const BASE_PATH = process.env.DEPLOY_TARGET === "gh-pages" ? "/santino" : "";
