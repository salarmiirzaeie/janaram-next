"use client";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import { Element } from "react-scroll";

const DownloadSection = () => {
  return (
    <Element name="downloadSection">
      <div className="bg-gray-100">
        <div className="w-full max-w-6xl  mx-auto flex flex-col-reverse md:flex-row border-b justify-between border-b-gray-200 items-center px-4 py-8 md:py-12">
          <div className="h-64 w-64">
            <Image src="/qrcode.png" alt="Hero Chart  " className="w-full h-full" width={100} height={100} />
          </div>
          <div>
            <h2 className="text-center mb-4 font-bold text-blue-500 text-xl  md:text-2xl lg:text-3xl">
              {"Android اپلیکیشن"}
            </h2>
            <p className="text-center"> اپلیکیشن اندروید جانارام را می‌توانید از مسیر‌های‌ زیر دریافت نمایید</p>
            <div className="flex flex-col md:flex-row mx-auto mb-8 items-center justify-center gap-2 mt-8">
              <Link href={"https://cafebazaar.ir/app/com.salarmiirzapour.Janaram"} className="">
                <Image src="/bazarDownload.png" alt="Bazar Download" width={200} height={100} />
              </Link>
              <a href="/apk/1.0.8.apk" download>
                <div className="">
                  <Image src="/directInstall.png" alt="Direct Install" width={200} height={100} />
                </div>
              </a>
            </div>
          </div>
        </div>
      </div>
    </Element>
  );
};

export default DownloadSection;
