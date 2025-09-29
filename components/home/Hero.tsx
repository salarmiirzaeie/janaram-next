// components/HeroSection.tsx
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
      className="min-h-screen"
    >
      <div className="absolute top-0 flex flex-col justify-between left-0 w-full h-full">
        <section className="flex flex-1 md:pt-12 text-gray-900 font-inter">
          <div className="relative z-10 flex flex-col space-y-4 items-center justify-center text-center px-4 max-w-7xl mx-auto">
            {/* Main Heading */}
            <h1 className="text-xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight text-gray-900">
              با جانارام آرامشت رو پیدا کن
            </h1>

            {/* Sub-text */}
            <p className="text-sm sm:text-md md:text-lg lg:text-xl text-gray-700 max-w-2xl md:mb-8">
              جانارام، همراهی هوشمند برای حال خوب تو! با مدیتیشن روزانه و شخصی سازی شده با هوش مصنوعی، موسیقی ها و قصه
              های خواب و چت بات روانشناسی هوشمند
            </p>

            {/* Call to Action Button */}
            <LinkScroll offset={-100} to="downloadSection" spy={true} smooth={true} duration={500}>
              <button
                onClick={() =>
                  event({
                    action: "download_click",
                    category: "engagement",
                    label: "hero_download_button",
                  })
                }
                className="bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3 px-8 rounded-full shadow-lg transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
              >
                دانلود رایگان جانارام و آغاز آرامش
              </button>
            </LinkScroll>
          </div>
        </section>

        <div className="flex-1">
          {/* Hero LCP Image */}
          <Image
            src="/mobileView.webp"
            alt="hero"
            width={407}
            height={763}
            priority
            fetchPriority="high"
            className="absolute bottom-0 left-1/2 transform -translate-x-1/2 object-contain max-w-[95vw] sm:max-w-[60vw] md:max-w-[407px]"
            sizes="(max-width: 640px) 80vw, (max-width: 768px) 60vw, 407px"
          />

          {/* Additional Hero Decorations */}
          <div className="absolute hidden md:block bg-white rounded-2xl shadow-2xl py-2 pl-4 pr-2 bottom-1/4 right-1/6">
            <Image src="/heroChart.webp" alt="Hero Chart" width={200} height={200} priority />
          </div>

          <div className="absolute hidden md:block bg-white rounded-2xl shadow-2xl py-2 px-2 bottom-12 left-1/5">
            <Image src="/heroBarChart.webp" alt="Hero Chart" width={200} height={200} priority />
          </div>

          <div className="absolute hidden md:block bg-white rounded-2xl bottom-1/3 left-1/6">
            <Users />
          </div>

          <div className="absolute hidden md:block text-right w-[300px] border-gray-400 border-r-4 p-4 bottom-1/9 right-1/5">
            <p className="text-sm">مدیتیشن هوشمند</p>
            <p className="text-sm">مخصوص حال روحی تو</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
