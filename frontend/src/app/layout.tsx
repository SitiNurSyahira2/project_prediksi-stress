import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "RelaxaID - Sistem Prediksi Stres Digital",
  description: "Platform cerdas untuk memprediksi dan mengelola tingkat stres berdasarkan aktivitas digital",
  keywords: ["stress prediction", "digital wellness", "mental health", "relaxation"],
  authors: [{ name: "RelaxaID Team" }],
  viewport: "width=device-width, initial-scale=1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="scroll-smooth">
      <head>
        <meta name="theme-color" content="#3b82f6" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className={`${inter.className} antialiased bg-slate-50 text-slate-900 min-h-screen`}>
        <div className="min-h-screen flex flex-col">
          <main className="flex-1 page-transition">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
