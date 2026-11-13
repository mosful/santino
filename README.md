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

> ℹ️ 2026-10-19 起線上正式站改掛自訂網域 **https://santino.mzoo.cc/** （見 `public/CNAME`），
> 架在網站**根目錄**而非 `/santino/` 子路徑，部署 workflow 已設 `NEXT_PUBLIC_BASE_PATH=""`。
> 上面的子路徑建置僅供本機驗證保留；要模擬線上產物請直接 `npm run build`（不設環境變數）。
> 另有凍結站 https://mosful.github.io/santinov1/ （repo `mosful/santinov1`，2026-09-23 快照，不再更新）。

## 驗證

### 紙本表格母版

六種照護表單使用五份空白 PDF 共八頁套版。2026-11-13 使用者授權網站發布後，僅將逐頁確認無填寫姓名、簽名、註記或附件的空白版本放入 `public/care-paper/templates/`。該版本移除文件中繼資料與 JPEG 附加註解，保持原壓縮影像、頁框及版面，八頁渲染與原紙本逐像素一致。原 `Document/`、會議素材及已填紀錄不公開。

母版及預覽已隨純 `web/` 原碼備妥，GitHub CI 不依賴本機 `Document/` 或 Python；建置前自動核對五份檔案、八頁、預覽、頁框與 SHA256，缺件即中止。重新產生時才需在本機使用具備 `pypdf`、`pypdfium2`、`Pillow` 的 Python 執行 `python scripts/prepare-care-paper.py --publish-blank`。來源雜湊不同時禁止自動套用，須重做無個資與版面核對。

`npx tsx scripts/audit-care-paper.ts` 檢查主表欄位對照；`npx tsx scripts/sample-care-paper.ts` 產生匿名樣張。指定 `SANTINO_PAPER_QA` 可將樣張放至專案外的內部驗收目錄；勿提交填寫後 PDF。完成本機母版準備及建置後，將 `SANTINO_E2E_SCENARIOS` 設為 `care_paper`，再執行 `npm run test:e2e`，可檢查 Chromium／WebKit 的 PDF 下載、分頁及各裝置版面。

列印請由「產生填寫紙本 PDF」或「產生空白紙本 PDF」，接著「開啟 PDF 列印」。提供原尺寸及 A4 等比例置中；實體印表機可印區與院方 iPad 仍須現場驗收。

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
