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
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
    });
  };

  return (
    <Element name="downloadSection">
      {/* Android Section */}
      <div className="bg-gray-100 border-b">
        <div className="w-full max-w-6xl mx-auto flex flex-col-reverse md:flex-row border-b justify-between border-b-gray-200 items-center px-4 py-8 md:py-12">
          <div className="h-64 w-64">
            <Image src="/qrcode.png" alt="Hero Chart" className="w-full h-full" width={100} height={100} />
          </div>
          <div>
            <h2 className="text-center mb-4 font-bold text-blue-500 text-xl md:text-2xl lg:text-3xl">IOS اپلیکیشن</h2>
            <p className="text-center">اپلیکیشن آیفون جانارام را می‌توانید از مسیر‌های‌ زیر دریافت نمایید</p>
            <div className="flex flex-col md:flex-row mx-auto mb-8 items-center justify-center gap-2 mt-8">
              <a onClick={handleIosClick} className="cursor-pointer">
                <Image src="/SibAppDownload.png" className=" ml-48" alt="SibApp Download" width={300} height={140} />
              </a>
              <a onClick={handleIosClick} className="cursor-pointer">
                <Image src="/anardoni-badge-black-persian.png" alt="Anardoni Download" width={200} height={100} />
              </a>
              <a href="https://iapps.ir/app/جانارام-مدیتیشن-و-روانشناس-AI/845783883" className="cursor-pointer">
                <Image src="/Iapps-Badge-Black-.png" alt="Iapps Download" width={240} height={240} />
              </a>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-gray-100">
        <div className="w-full max-w-6xl mx-auto flex flex-col-reverse md:flex-row border-b justify-between border-b-gray-200 items-center px-4 py-8 md:py-12">
          <div className="h-64 w-64">
            <Image src="/qrcode.png" alt="Hero Chart" className="w-full h-full" width={100} height={100} />
          </div>
          <div>
            <h2 className="text-center mb-4 font-bold text-blue-500 text-xl md:text-2xl lg:text-3xl">
              Android اپلیکیشن
            </h2>
            <p className="text-center">اپلیکیشن اندروید جانارام را می‌توانید از مسیر‌های‌ زیر دریافت نمایید</p>
            <div className="flex flex-col md:flex-row mx-auto mb-8 items-center justify-center gap-2 mt-8">
              <Link href="https://cafebazaar.ir/app/com.salarmiirzapour.Janaram">
                <Image src="/bazarDownload.png" alt="Bazar Download" width={200} height={100} />
              </Link>
              <a href="https://janaram.storage.c2.liara.space/apk/1.0.9.apk" download>
                <Image src="/myketDownload.png" alt="Direct Install" width={200} height={100} />
              </a>
              <a href="https://janaram.storage.c2.liara.space/apk/1.0.9.apk" download>
                <Image src="/directInstall.png" alt="Direct Install" width={200} height={100} />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* iOS Section */}

      <ToastContainer />
    </Element>
  );
};

export default DownloadSection;
