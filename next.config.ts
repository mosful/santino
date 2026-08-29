import type { NextConfig } from "next";

// 部署到 GitHub Pages 時（.github/workflows/deploy-gh-pages.yml）會設定
// DEPLOY_TARGET=gh-pages，因為 GitHub Pages 網址是 /Santino/ 子路徑；
// 本機開發／IIS／Beta 皆架在網站根目錄，不設此環境變數即可維持路徑為空字串。
const isGhPages = process.env.DEPLOY_TARGET === "gh-pages";

const nextConfig: NextConfig = {
  output: "export",
  basePath: isGhPages ? "/Santino" : "",
  assetPrefix: isGhPages ? "/Santino" : "",
  trailingSlash: true,
};

export default nextConfig;
