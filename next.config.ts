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
};

export default nextConfig;
