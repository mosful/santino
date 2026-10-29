import QRCode from "qrcode";
import { BASE_PATH } from "@/lib/basePath";

/*
  櫃檯交付的「家屬通知單」列印。

  格式與內容對齊 BabyCam 的重發完成視窗（`BindingTable.tsx` 的 `.reissue-modal`
  ＋ `globals.css` 的 `@media print`）：抬頭、一行提醒、登入資料方框、兩張並排的
  QRCode。兩點差異是本專案自己的：加了觀看期間（BabyCam 的授權沒有期間概念）
  與院所抬頭、簽收欄（櫃檯是當面交付，紙本要留簽收）。

  ⚠️ 用 iframe 隔離列印，不走全站 `@media print`：本系統有模組側欄、頁首列與可收合
  區塊，要靠 CSS 一層層 `display:none` 才印得乾淨，每加一個版面元素就得回來補一條。
  BabyCam 的熱感標籤（`wristband-print.ts`）也是用同一招，理由相同。

  ⚠️ 不印觀看網址。網址裡的 `ticket` 本身就是憑證，而且是 UUID——印在紙上既不可能
  手打，又多一份外流風險。BabyCam 的列印樣式同樣把連結 `display:none` 掉。
*/

export type FamilyNoticeData = {
  room: string;
  motherName: string;
  phone: string;
  passcode: string;
  validFrom: string;
  validTo: string;
  /**
   * 觀看頁的站內路徑（含 ticket），會補上網域再轉成 QRCode。
   * 院內那張自 2026-10-29 起依客戶要求不交付，`internalHref` 留成選填——
   * 給了就多印一張卡，不給就只印親友那張。
   */
  internalHref?: string;
  familyHref: string;
};

const NOTES = [
  "請以上方登入帳號與密碼登入，掃描 QRCode 即可觀看。",
  "密碼請交由指定家屬保管，不要公開或轉傳。",
  "重新產生 QRCode 後，舊的 QRCode 與密碼會立即失效。",
  "若寶寶不在專屬位置上，應是在媽媽房內，或正由護理人員護理中。",
];

function escapeHtml(value: string): string {
  return value.replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[char]!);
}

/** A4 單張版面；尺寸用 mm，螢幕預覽與實際列印才會一致。 */
function sheetHtml(data: FamilyNoticeData, qr: { internal: string | null; family: string }, printedAt: string): string {
  const card = (tag: string, title: string, hint: string, src: string, accent: string) => `
    <article class="qr">
      <span class="tag" style="background:${accent}">${escapeHtml(tag)}</span>
      <h3>${escapeHtml(title)}</h3>
      <img src="${src}" alt="${escapeHtml(title)} QRCode">
      <small>${escapeHtml(hint)}</small>
    </article>`;

  return `<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8"><title>家屬通知單</title><style>
    @page { size:A4; margin:16mm 18mm; }
    * { box-sizing:border-box; }
    body { margin:0; color:#1c1917;
      font:12pt/1.7 "Noto Sans TC","Microsoft JhengHei","PingFang TC",system-ui,sans-serif;
      -webkit-print-color-adjust:exact; print-color-adjust:exact; }
    header { padding-bottom:6mm; border-bottom:1.5pt solid #1c1917; text-align:center; }
    header .house { font-size:11pt; letter-spacing:.32em; color:#57534e; }
    header h1 { margin:2mm 0 0; font-size:19pt; letter-spacing:.08em; }
    .who { display:flex; align-items:baseline; justify-content:space-between; gap:6mm; margin:6mm 0 4mm; }
    .who strong { font-size:15pt; }
    .who small { color:#78716c; font-size:9.5pt; }
    .creds { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:4mm;
      padding:5mm 6mm; border:1pt dashed #a8a29e; border-radius:3mm; background:#fafaf9; }
    .creds dt { margin:0 0 1.5mm; color:#78716c; font-size:9.5pt; }
    .creds dd { margin:0; font-size:14pt; font-weight:700; }
    .creds dd.code { letter-spacing:.2em; font-variant-numeric:tabular-nums; }
    .creds dd.span { font-size:11pt; font-weight:600; }
    .grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:6mm; margin:6mm 0; }
    /* 只交付親友那一張時置中並放大，整張 A4 才不會右半邊空著、家屬也好掃。 */
    .grid.solo { grid-template-columns:minmax(0,78mm); justify-content:center; }
    .grid.solo .qr img { width:60mm; height:60mm; }
    .qr { padding:5mm 4mm; border:1pt solid #d6d3d1; border-radius:3mm; text-align:center; break-inside:avoid; }
    .qr .tag { display:inline-block; padding:.6mm 3mm; border-radius:99px; color:#fff; font-size:9pt; font-weight:700; }
    .qr h3 { margin:2.5mm 0 3.5mm; font-size:13pt; }
    .qr img { display:block; width:46mm; height:46mm; margin:0 auto; }
    .qr small { display:block; margin-top:3mm; color:#78716c; font-size:9pt; }
    .notes { margin:0; padding:0 0 0 5mm; font-size:10.5pt; line-height:2; }
    .sign { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:10mm; margin-top:10mm; font-size:10.5pt; }
    .sign span { display:block; padding-top:9mm; border-bottom:.8pt solid #78716c; }
    footer { margin-top:6mm; color:#a8a29e; font-size:8.5pt; text-align:right; }
  </style></head><body>
    <header>
      <div class="house">聖帝諾產後護理之家</div>
      <h1>寶寶視訊 觀看通知單</h1>
    </header>
    <div class="who">
      <strong>${escapeHtml(data.room)} 房 · ${escapeHtml(data.motherName)} 媽咪</strong>
      <small>列印時間 ${escapeHtml(printedAt)}</small>
    </div>
    <dl class="creds">
      <div><dt>登入帳號</dt><dd>${escapeHtml(data.phone)}</dd></div>
      <div><dt>登入密碼</dt><dd class="code">${escapeHtml(data.passcode)}</dd></div>
      <div><dt>觀看期間</dt><dd class="span">${escapeHtml(data.validFrom)} 至 ${escapeHtml(data.validTo)}</dd></div>
    </dl>
    <div class="grid${qr.internal ? "" : " solo"}">
      ${qr.internal ? card("院內", "媽媽即時畫面", "限院內網路，約 1 秒更新", qr.internal, "#236276") : ""}
      ${card("親友", "親友觀看畫面", "限開放時段與有效期限內", qr.family, "#7e4fa8")}
    </div>
    <ul class="notes">${NOTES.map((note) => `<li>${escapeHtml(note)}</li>`).join("")}</ul>
    <div class="sign"><div>櫃檯交付<span></span></div><div>家屬簽收<span></span></div></div>
    <footer>本單由聖帝諾院務系統產生</footer>
  </body></html>`;
}

/** 開啟列印對話框；QRCode 與版面都在隔離的 iframe 內，不影響目前畫面。 */
export async function printFamilyNotice(data: FamilyNoticeData): Promise<void> {
  const toQr = (href: string) =>
    QRCode.toDataURL(`${window.location.origin}${BASE_PATH}${href}`, { width: 480, margin: 1 });
  const [internal, family] = await Promise.all([data.internalHref ? toQr(data.internalHref) : Promise.resolve(null), toQr(data.familyHref)]);
  const printedAt = new Date().toLocaleString("zh-TW", { timeZone: "Asia/Taipei", hour12: false });

  const frame = document.createElement("iframe");
  frame.title = "家屬通知單列印";
  frame.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0";
  document.body.appendChild(frame);
  try {
    await new Promise<void>((resolve) => {
      frame.onload = () => resolve();
      frame.srcdoc = sheetHtml(data, { internal, family }, printedAt);
    });
    const doc = frame.contentDocument!;
    await Promise.all([...doc.images].map((image) => image.decode().catch(() => undefined)));
    await doc.fonts.ready;
    frame.contentWindow!.focus();
    frame.contentWindow!.print();
    // 列印對話框是非同步的，太早移除 iframe 會印出空白頁。
    window.setTimeout(() => frame.remove(), 60_000);
  } catch (reason) {
    frame.remove();
    throw reason;
  }
}
