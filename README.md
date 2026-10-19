# Santino 靜態院務整合原型

Next.js 靜態輸出，整合案件、媽媽／寶寶照護與 BabyCam 展示功能。案件、視訊與照護紀錄保存在同來源瀏覽器；照片保存在本機 IndexedDB。只使用匿名展示資料，不包含攝影機、資料庫、繼電器或郵件服務。

## 本機操作

在 `web/` 執行：

```powershell
npm ci
npm run dev
```

可操作入口：

- `/cases/`：七階段案件、合約、入住、變更、結算及托嬰。
- `/cases/calendar/`：十類待辦、角色預設及處理紀錄。
- `/mama/`、`/baby/`：完整頁面照護表單與工作分頁。
- `/babycam/workspace/`：指派、交付、標籤、掃碼、時段、背景、維運、燈號及報表。
- `/babycam/`、`/contract/` 等舊入口保留版面，讀取相同業務資料。

## 建置及純靜態預覽

```powershell
npm run build
npm run preview
```

預覽預設使用 `localhost:4310`，以 Ctrl+C 結束；可用 `SANTINO_PREVIEW_PORT` 指定其他埠號。`npm start` 也只提供 `out/` 檔案，不啟動 Next.js 伺服器或任何業務 API。不可直接以 `file://` 開啟 HTML。

建置包含 Windows 的靜態 segment 檔名整理，補上 Next.js 瀏覽器預載所需檔名，產物不需網址改寫。`out/static-site.json` 記錄根路徑／子路徑，預覽工具會自動讀取。

子路徑建置只改變本機產物，不會部署：

```powershell
$env:DEPLOY_TARGET = "gh-pages"
npm run build
Remove-Item Env:DEPLOY_TARGET
npm run preview
```

此時網址為 `http://localhost:4310/santino/`。回到根路徑請在未設定 `DEPLOY_TARGET` 時重新建置。

## 驗證

本輪驗證環境為 Node.js 24.19.0。Playwright 已納入 Santino 開發相依，無須 BabyCam 專案或其服務。

```powershell
npm run lint
npm test
npm run build
npx playwright install chromium  # 首次環境尚未有 Chromium 時執行
npm run test:e2e
```

`test:e2e` 會啟動僅提供靜態檔案的本機暫時主機，連續執行 8 組瀏覽器情境，結束後關閉主機。結果與截圖存於 `test-results/`，不納入 Git。

驗收已建置的 `/santino/` 產物：

```powershell
$env:SANTINO_STATIC_BASE_PATH = "/santino"
npm run test:e2e
Remove-Item Env:SANTINO_STATIC_BASE_PATH
```

可用 `SANTINO_STATIC_OUT` 指定另一份靜態產物、`SANTINO_QA_OUTPUT` 指定結果目錄；除錯時可用 `SANTINO_E2E_SCENARIOS` 指定逗號分隔的情境名稱。

## 展示限制

- 角色與帳號是本機展示，不能視為正式身分驗證或權限隔離。
- 展示時鐘供業務情境使用；影像、離車偵測、燈號與繼電器均為模擬。
- 跨分頁可同步；不同裝置不會共享本機資料。觀看人數的跨裝置情境由控制台模擬。
- 簽名、照片、列印與 Excel 可在瀏覽器操作；正式電子合約、Email、設備及實體標籤機另需驗收。
- 管理員可於完整視訊工作區還原案件、照護、視訊及照片；既有片語與評估題目設定保留。
- 安裝時稽核顯示既有相依套件 9 項弱點（8 high、1 critical）；本次未強制升降版，正式使用前另行維護相依版本。
