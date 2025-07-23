import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/layout/Header";

import localFont from "next/font/local";
import Footer from "@/components/layout/Footer";

const iranSans = localFont({
  src: [
    {
      path: "../public/fonts/IranianSans.ttf",
      weight: "400",
      style: "normal",
    },
  ],
  variable: "--font-iransans",
});

export const metadata: Metadata = {
  title: "جانارام | اپلیکیشن مدیتیشن و آرامش ذهن",
  description:
    "اپلیکیشن مدیتیشن جانارام برای کاهش استرس، افزایش تمرکز، خواب آرام‌تر و آرامش ذهنی طراحی شده است. همین حالا دانلود کنید و آرامش را تجربه کنید.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${iranSans.variable}  antialiased`}>
        <Header />

        {children}
        <Footer />
      </body>
    </html>
  );
}
