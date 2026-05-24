"use client";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import { Element } from "react-scroll";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const DownloadSection = () => {
  const handleIosClick = () => {
    toast.info("به‌زودی 😎", {
      position: "top-center",
      autoClose: 3000,
    });
  };

  const DownloadCard = ({
    title,
    subtitle,
    qrcode,
    children,
  }: {
    title: string;
    subtitle: string;
    qrcode: string;
    children: React.ReactNode;
  }) => (
    <div className="bg-white rounded-2xl shadow-md border border-gray-200 w-full max-w-6xl mx-auto my-6 overflow-hidden">
      <div className="flex flex-col md:flex-row items-center justify-between p-6 md:p-10 gap-8">
        {/* <div className="flex-shrink-0">
          <Image src={qrcode} alt="QR Code" className="rounded-lg shadow-sm" width={180} height={180} />
        </div> */}
        <div className="flex-1 text-center md:text-right">
          <h2 className="font-bold text-blue-600 text-2xl md:text-3xl mb-3">
            {title}
          </h2>
          <p className="text-gray-600 mb-6">{subtitle}</p>
          <div className="flex flex-wrap justify-center md:justify-start gap-3 sm:gap-4">
            {children}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Element name="downloadSection" className="bg-gray-50 pb-12 px-4">
      {/* Android Section */}
      <DownloadCard
        title="Android اپلیکیشن"
        subtitle="اپلیکیشن اندروید جانارام را می‌توانید از مسیر‌های زیر دریافت نمایید"
        qrcode="/qrcode.png"
      >
        <Link href="https://cafebazaar.ir/app/com.salarmiirzapour.Janaram">
          <Image
            src="/bazarDownload.png"
            alt="Bazar Download"
            width={200}
            height={70}
            className="h-auto w-[min(100%,180px)] sm:w-[200px]"
          />
        </Link>
        <a href="https://myket.ir/app/com.salarmiirzapour.Janaram" download>
          <Image
            src="/myketDownload.png"
            alt="Myket Download"
            width={200}
            height={70}
            className="h-auto w-[min(100%,180px)] sm:w-[200px]"
          />
        </a>
        <a href="https://janaram.storage.c2.liara.space/apk/1.0.9.apk" download>
          <Image
            src="/directInstall.png"
            alt="Direct Install"
            width={200}
            height={70}
            className="h-auto w-[min(100%,180px)] sm:w-[200px]"
          />
        </a>
      </DownloadCard>
      {/* iOS Section */}
      <DownloadCard
        title="IOS اپلیکیشن"
        subtitle="اپلیکیشن آیفون جانارام را می‌توانید از مسیر‌های زیر دریافت نمایید"
        qrcode="/qrcode.png"
      >
        <a
          href="https://sibapp.com/applications/janaram"
          className="cursor-pointer"
        >
          <Image
            src="/SibAppDownload.png"
            alt="SibApp Download"
            width={200}
            height={70}
            className="h-auto w-[min(100%,180px)] sm:w-[200px]"
          />
        </a>
        <a
          href="https://anardoni.com/ios/app/comsalarmiirzapourjanaram"
          className="cursor-pointer"
        >
          <Image
            src="/anardoni-badge-black-persian.png"
            alt="Anardoni Download"
            width={200}
            height={70}
            className="h-auto w-[min(100%,180px)] sm:w-[200px]"
          />
        </a>
        <a
          href="https://iapps.ir/app/جانارام-مدیتیشن-و-روانشناس-AI/845783883"
          className="cursor-pointer"
        >
          <Image
            src="/Iapps-Badge-Black-.png"
            alt="Iapps Download"
            width={220}
            height={70}
            className="h-auto w-[min(100%,180px)] sm:w-[220px]"
          />
        </a>
        <a href="https://sibirani.com/apps/janaram/?utm_source=janaram&utm_medium=badge">
          <Image
            src="https://fs.sibirani.com/badge.svg"
            width={180}
            height={70}
            alt="دانلود برنامه از سیب ایرانی"
            className="h-auto w-[min(100%,160px)] sm:w-[180px]"
          />
        </a>
      </DownloadCard>

      <ToastContainer />
    </Element>
  );
};

export default DownloadSection;
