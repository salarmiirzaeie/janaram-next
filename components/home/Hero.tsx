"use client";
import Image from "next/image";
import { Link as LinkScroll } from "react-scroll";
import React from "react";
import Users from "./Users";
import { event } from "@/lib/gtag";

const HeroSection: React.FC = () => {
  return (
    <div
      style={{
        backgroundImage: "url('/hero-bg.webp')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
      className="relative overflow-x-hidden pt-24 pb-8 sm:pt-28 lg:pt-36 lg:pb-12"
    >
      <div className="flex flex-col justify-between items-center">
        <div className="relative z-10 flex flex-col space-y-4 flex-1 items-center justify-center text-center px-4 max-w-7xl mx-auto">
          <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight text-gray-900">
            با جانارام آرامشت رو پیدا کن
          </h1>

          <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-700 max-w-2xl md:mb-4">
            جانارام، همراهی هوشمند برای حال خوب تو! با مدیتیشن روزانه و شخصی
            سازی شده با هوش مصنوعی، موسیقی ها و قصه های خواب و چت بات روانشناسی
            هوشمند
          </p>

          <LinkScroll
            offset={80}
            to="downloadSection"
            spy={true}
            smooth={true}
            duration={500}
          >
            <button
              onClick={() =>
                event({
                  action: "download_click",
                  category: "engagement",
                  label: "hero_download_button",
                })
              }
              className="bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3 px-6 sm:px-8 rounded-full shadow-lg transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50 text-sm sm:text-base"
            >
              دانلود رایگان جانارام و آغاز آرامش
            </button>
          </LinkScroll>

          <div className="md:hidden pt-2">
            <Users />
          </div>
        </div>

        <Image
          src="/mobileView.webp"
          alt="نمای اپلیکیشن جانارام"
          width={407}
          height={763}
          priority
          fetchPriority="high"
          className="w-auto h-auto max-w-[min(95vw,320px)] sm:max-w-[min(60vw,407px)] mt-4"
          sizes="(max-width: 640px) 80vw, (max-width: 768px) 60vw, 407px"
        />
      </div>

      <div className="absolute hidden md:block bg-white rounded-2xl shadow-2xl py-2 pl-4 pr-2 bottom-[28%] right-[6%]">
        <Image
          src="/heroChart.webp"
          alt="نمودار پیشرفت"
          width={200}
          height={200}
          priority
        />
      </div>

      <div className="absolute hidden md:block bg-white rounded-2xl shadow-2xl py-2 px-2 bottom-12 left-[12%]">
        <Image
          src="/heroBarChart.webp"
          alt="نمودار مدیتیشن"
          width={200}
          height={200}
          priority
        />
      </div>

      <div className="absolute hidden md:block bg-white rounded-2xl bottom-1/3 left-[6%]">
        <Users />
      </div>

      <div className="absolute hidden md:block text-right border-gray-400 border-r-4 p-4 bottom-[10%] right-[12%]">
        <p className="text-sm">مدیتیشن هوشمند</p>
        <p className="text-sm">مخصوص حال روحی تو</p>
      </div>
    </div>
  );
};

export default HeroSection;
