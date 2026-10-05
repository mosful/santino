<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

> 上方區塊由 `next dev` 自動產生並覆寫，**請勿翻譯或刪除**；以下為本專案自訂規範。

# 前端開發規範（聖帝諾院務系統原型）

Next.js 16.3.3＋React 19.2.8＋TypeScript strict＋Tailwind，**靜態輸出**（`npm run build` → `out/`）。本目錄的規範為前端專屬；專案全局背景見上層 `../CLAUDE.md`，共通規範（命名、commit、安全）見 `../AGENTS.md`。

## 動手前必讀

Next.js 16 與訓練資料中的版本有破壞性差異 —— **寫任何程式前先查 `node_modules/next/dist/docs/` 對應文件**，不要憑印象使用 API。

## 狀態一律集中於 `src/lib/`

改行為前先找到對應 store，**不要在元件內另起狀態**：

| Store | 職責 |
|-------|------|
| `phaseStore` | 功能分期顯示；未開放模組以 `phase` 隱藏選單 |
| `roleStore`／`permissions` | 三大角色（櫃臺／衛教師／阿長＋護理同仁）權限 |
| `authStore` | 登入狀態 |
| `signatureStore` | 簽名一次多處帶入 |
| `windowLockStore`／`useMultiWindowManager` | 多視窗並行＋簽名步驟鎖房防呆 |
| `*QuickKeys`（`mama`／`baby`／`ops`） | 房卡快捷鍵；護理版與房務版是兩套獨立元件，只共用房號 |
| `mock/` | 假資料，一律匿名，禁用真實產婦／寶寶資料 |

## 路由即模組

`src/app/` 下各路由對應 15 大模組：`mama`／`baby`／`babycam`／`room`／`customer`／`doctor`／`care`／`kpi`／`meal`／`hr`／`contract`／`course`／`line`／`admin`，另有 `login`／`view`。

## 完成定義

每次變更至少通過：

```powershell
npm run lint     # Next.js ESLint 規則
npm run build    # 型別檢查並靜態輸出至 out/
```

再人工檢查受影響路由、角色權限、**桌面與 iPad／手機版面**（雙平台為開發總則之一）。本專案無單元測試套件。

## 部署

`web/` 另推到獨立公開 repo `mosful/santino`；上層 monorepo 含客戶機密文件，**不可直接 push**。改用 `/sync2github`，背景見 `../Document/Processes/Process_GitHubDeploy_Guide.md`。
