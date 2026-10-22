import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AppShell from "@/components/layout/AppShell";
import Footer from "@/components/layout/Footer";
import BackToTop from "@/components/ui/BackToTop";
import { BASE_PATH } from "@/lib/basePath";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  // 不在此設定title：改由各頁PageHeader/登入頁以React 19原生<title>渲染，
  // 確保瀏覽器分頁標題會隨頁面切換，而不是全站共用同一顆固定標題。
  description: "靜態畫面稿（無真實後端邏輯，僅供畫面與流程確認）",
};

const authGuardScript = `try{
  // 預設已登入（客戶 2026-10-22）：只有明確登出寫入 '0' 時才導去登入頁。
  var loggedIn = localStorage.getItem('santino_auth_v1') !== '0';
  var base = ${JSON.stringify(BASE_PATH)};
  var p = location.pathname;
  var isAuthRoute = p.indexOf('/login') !== -1 || p.indexOf('/forgot-password') !== -1;
  // 寶寶視訊的對外觀看頁（媽媽端／親友端）是給院外的人開的，不需要院務系統登入，
  // 也不可在院內人員已登入時被導回首頁，因此完全略過本導頁邏輯。
  var isPublicViewRoute = p.indexOf('/view/') !== -1;
  if (!isPublicViewRoute) {
    if (!loggedIn && !isAuthRoute) { location.replace(base + '/login/'); }
    else if (loggedIn && isAuthRoute) { location.replace(base + '/'); }
  }
}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="zh-Hant"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full bg-stone-50 text-stone-900">
        {/*
          ⚠️ 這裡原本有一段「套用已儲存主題」的 script，搭配頁首右上角的三顆配色圓點。
          客戶（老闆）表示「同樣的資料不需要太多種呈現方式」，2026-10-21 移除配色切換，
          全站固定專業藍（globals.css 的預設 :root）。三套配色的 CSS 變數仍保留在
          globals.css，日後要換主色改那裡即可，不要把切換器加回畫面。
        */}
        <script
          // 靜態畫面稿的登入導頁：未登入且非登入/忘記密碼頁時導向/login，
          // 已登入卻停在/login或/forgot-password時導回首頁。純client端模擬，無真實驗證。
          dangerouslySetInnerHTML={{ __html: authGuardScript }}
        />
        <AppShell>{children}</AppShell>
        <Footer />
        <BackToTop />
      </body>
    </html>
  );
}
