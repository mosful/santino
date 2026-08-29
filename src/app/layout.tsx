import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AppShell from "@/components/layout/AppShell";
import Footer from "@/components/layout/Footer";
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
  title: "聖帝諾產後護理之家 院務管理系統",
  description: "靜態畫面稿（無真實後端邏輯，僅供畫面與流程確認）",
};

const authGuardScript = `try{
  var loggedIn = localStorage.getItem('santino_auth_v1') === '1';
  var base = ${JSON.stringify(BASE_PATH)};
  var p = location.pathname;
  var isAuthRoute = p.indexOf('/login') !== -1 || p.indexOf('/forgot-password') !== -1;
  if (!loggedIn && !isAuthRoute) { location.replace(base + '/login/'); }
  else if (loggedIn && isAuthRoute) { location.replace(base + '/'); }
}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="zh-Hant"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-stone-50 text-stone-900">
        <script
          // 在hydrate前先套用已儲存的主題，避免畫面先閃預設暖色再跳成使用者選的主題
          dangerouslySetInnerHTML={{
            __html:
              "try{var t=localStorage.getItem('santino_theme_v1');if(t==='warm'||t==='green'||t==='blue'){document.documentElement.setAttribute('data-theme',t);}}catch(e){}",
          }}
        />
        <script
          // 靜態畫面稿的登入導頁：未登入且非登入/忘記密碼頁時導向/login，
          // 已登入卻停在/login或/forgot-password時導回首頁。純client端模擬，無真實驗證。
          dangerouslySetInnerHTML={{ __html: authGuardScript }}
        />
        <AppShell>{children}</AppShell>
        <Footer />
      </body>
    </html>
  );
}
