import type { NextConfig } from "next";
import { BASE_PATH } from "./src/lib/basePath";

// 部署到 GitHub Pages 時（.github/workflows/deploy-gh-pages.yml）會設定
// DEPLOY_TARGET=gh-pages，因為 GitHub Pages 網址是 /santino/ 子路徑
// （對應 GitHub repo mosful/santino）；本機開發／IIS／Beta 皆架在網站
// 根目錄，不設此環境變數即可維持路徑為空字串。BASE_PATH定義見 src/lib/basePath.ts，
// 與 layout.tsx 內嵌的登入導頁script共用同一份常數，避免兩處各自寫死。
const nextConfig: NextConfig = {
  output: "export",
  basePath: BASE_PATH,
  assetPrefix: BASE_PATH,
  trailingSlash: true,
};

export default nextConfig;
