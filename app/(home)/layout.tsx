import type { Metadata } from "next";
import "../globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import localFont from "next/font/local";
import Script from "next/script";
import { GA_TRACKING_ID } from "@/lib/gtag";
import GAListener from "../GAListener";
import { Suspense } from "react";

const iranSans = localFont({
  src: [
    {
      path: "../../public/fonts/IranianSans.ttf",
      weight: "400",
      style: "normal",
    },
  ],
  variable: "--font-iransans",
});
const vazir = localFont({
  src: [
    {
      path: "../../public/fonts/vazir-bold.ttf",
      weight: "700",
      style: "bold",
    },
    {
      path: "../../public/fonts/vazir-medium.ttf",
      weight: "400",
      style: "normal",
    },
  ],
  variable: "--font-vazir",
});

export const metadata: Metadata = {
  title: "جانارام | اپلیکیشن مدیتیشن و آرامش ذهن",
  description:
    "اپلیکیشن مدیتیشن جانارام برای کاهش استرس، افزایش تمرکز، خواب آرام‌تر و آرامش ذهنی طراحی شده است. همین حالا دانلود کنید و آرامش را تجربه کنید.",
  openGraph: {
    title: "جانارام | اپلیکیشن مدیتیشن و آرامش ذهن",
    description: "اپلیکیشن مدیتیشن جانارام برای کاهش استرس، افزایش تمرکز، خواب آرام‌تر و آرامش ذهنی طراحی شده است.",
    url: "https://janaram.ir",
    siteName: "جانارام",
    type: "website",
  },
  other: {
    "application/ld+json": JSON.stringify({
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "جانارام",
      url: "https://janaram.ir",
      description: "اپلیکیشن مدیتیشن جانارام برای کاهش استرس، افزایش تمرکز، خواب آرام‌تر و آرامش ذهنی طراحی شده است.",
    }),
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa">
      <body className={`${iranSans.variable} ${vazir.variable} antialiased`}>
        {/* GA script */}
        {GA_TRACKING_ID && (
          <>
            <Script strategy="afterInteractive" src={`https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`} />
            <Script
              id="gtag-init"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${GA_TRACKING_ID}', {
                    page_path: window.location.pathname,
                  });
                `,
              }}
            />
          </>
        )}
        <Header />
        <Suspense fallback={null}>
          <GAListener />
        </Suspense>

        {children}
        <Footer />
      </body>
    </html>
  );
}
