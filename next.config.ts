import type { NextConfig } from "next";
import { BASE_PATH } from "./src/lib/basePath";

// 線上正式站為自訂網域 https://santino.mzoo.cc/ （web/public/CNAME），架在網站根目錄，
// 故部署workflow（.github/workflows/deploy-gh-pages.yml）設 NEXT_PUBLIC_BASE_PATH=""。
// 若未來拿掉自訂網域、退回 https://mosful.github.io/santino/ 子路徑，
// 刪掉workflow那一行即可，屆時由 DEPLOY_TARGET=gh-pages 回到 /santino。
// 本機開發／IIS／Beta 兩個環境變數皆不設，維持路徑為空字串。
// BASE_PATH定義見 src/lib/basePath.ts，與 layout.tsx 內嵌的登入導頁script
// 共用同一份常數，避免兩處各自寫死。
const nextConfig: NextConfig = {
  output: "export",
  basePath: BASE_PATH,
  assetPrefix: BASE_PATH,
  trailingSlash: true,
  // 僅公開網站根路徑，讓 QR 與標籤網址也使用相同的建置值。
  env: { NEXT_PUBLIC_BASE_PATH: BASE_PATH },
  /*
    開發伺服器允許的額外來源（`next dev` 專用，不影響 `next build` 的靜態輸出）。

    Next.js 16 預設只接受啟動時的主機名稱（localhost）；用其他寫法連進來時，
    頁面 HTML 仍會回 200，但 `/_next/static/chunks/*.js` 會被擋成 403——
    畫面看起來正常卻完全不能點，而且瀏覽器主控台只有一行 403，很難聯想到是來源檢查。

    - 127.0.0.1：與 localhost 視為不同來源，手動輸入 IP 時會中招。
    - 10.6.1.15：本機 LAN 位址，供 iPad／手機等其他裝置連進來看 DEMO（雙平台驗收需要）。
      換網段時這裡要跟著改，或改用 192.168.*.* 之類的萬用字元。
  */
  allowedDevOrigins: ["127.0.0.1", "10.6.1.15"],
};

export default nextConfig;
