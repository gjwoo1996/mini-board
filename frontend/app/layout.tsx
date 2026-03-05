import type { Metadata } from "next";

export const dynamic = 'force-dynamic';
import { Noto_Sans_KR } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import { Header } from "@/components/Header";
import { RealTimeKeywords } from "@/components/RealTimeKeywords";

const notoSansKR = Noto_Sans_KR({
  variable: "--font-noto-sans-kr",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Mini-Board",
  description: "게시판 서비스",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${notoSansKR.variable} font-sans min-h-screen antialiased bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100`}
      >
        <AuthProvider>
          <Header />
          <main className="mx-auto flex max-w-6xl gap-8 px-4 py-8 sm:px-6">
            <div className="min-w-0 flex-1">{children}</div>
            <RealTimeKeywords />
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
