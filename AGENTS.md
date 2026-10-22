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
| `roleStore`／`permissions` | 五角色（櫃台／衛教師/護理師/護理長/管理者）權限；**只有 edit／none 兩階，沒有「唯讀」**——沒權限的功能一律從選單與頁籤拿掉，不是顯示後改唯讀 |
| `authStore` | 登入狀態 |
| `signatureStore` | 簽名一次多處帶入 |
| `windowLockStore`／`useMultiWindowManager` | 多視窗並行＋簽名步驟鎖房防呆 |
| `*QuickKeys`（`mama`／`baby`／`ops`） | 房卡快捷鍵；護理版與房務版是兩套獨立元件，只共用房號 |
| `mock/` | 假資料，一律匿名，禁用真實產婦／寶寶資料 |

## 路由即模組

`src/app/` 下各路由對應各模組：`todo`（待辦，選單第一項）／`quote`（套餐速算，櫃台服務第一個子項）／`mama`／`baby`／`babycam`／`customer`／`doctor`／`care`／`kpi`／`meal`／`hr`／`contract`／`course`／`line`／`admin`／`cases`，另有 `login`／`forgot-password`／`view`。**沒有 `room` 路由**（房況收回首頁總覽）；`/cases/calendar` 僅保留舊連結，實際轉導 `/todo`。

## 按鈕樣式只有一個來源

所有按鈕一律用 `components/ui/Button`（元件 `<Button>`／`<ButtonLink>`，或樣式函式 `buttonStyles()`，後者在 `components/ui/buttonStyles.ts`，**沒有 `"use client"`，Server Component 也能呼叫**）。

- **不要**再寫 `const button = "min-h-12 rounded-lg border ..."` 這類區域複本。曾經有 12 份互不一致的複本，造成實際回報的三個缺陷：高度不一致、hover 後整顆變白看不見、文字沒有垂直置中。
- 「選取中」的分頁／篩選鈕用 `selected` 旗標，**不要**自己疊 `bg-brand-600 text-white`：Tailwind 的 hover 變體排在基礎工具類之後，hover 時底色會被基底的 `hover:bg-stone-100` 蓋掉而文字仍是白的。
- 尺寸只有 `sm`／`md`／`lg` 三階（36／40／48 px，觸控環境由 `globals.css` 的 `.btn-sm/md/lg` 整體上推），不要用 `!min-h-*` 硬調。

## 完成定義

每次變更至少通過：

```powershell
npm run lint      # Next.js ESLint 規則
npm run build     # 型別檢查並靜態輸出至 out/
npm test          # 39 項 node:test 單元測試
npm run test:e2e  # Playwright 走 out/，8 支場景
```

再人工檢查受影響路由、角色權限、**桌面與 iPad／手機版面**（雙平台為開發總則之一）。

`test:e2e` 驗的是 `out/`，所以**改完要先 `npm run build`**，否則跑的是舊版；`SANTINO_E2E_SCENARIOS=<名稱>`（逗號分隔）可只跑其中幾支。這套腳本曾有 5 支長期失效，2026-10-21 全部修好——改 UI 文字或結構時請一併更新，不要讓它再長草。

## 部署

`web/` 另推到獨立公開 repo `mosful/santino`；上層 monorepo 含客戶機密文件，**不可直接 push**。改用 `/sync2github`，背景見 `../Document/Processes/Process_GitHubDeploy_Guide.md`。
