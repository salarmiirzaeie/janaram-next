// components/HeroSection.tsx
"use client";
import Image from "next/image";
import { Link as LinkScroll } from "react-scroll";
import React from "react";
import Users from "./Users";

const HeroSection: React.FC = () => {
  return (
    <div
      style={{ backgroundImage: "url('/hero-bg.webp')", backgroundSize: "cover", backgroundPosition: "center" }}
      className="h-[100vh] absolute top-0 left-0 w-full z-0"
    >
      <section className="relative flex  pt-18  md:pt-24  text-gray-900  font-inter">
        {/* Background overlay for subtle cloud effect (can be replaced with actual image) */}

        <div className="relative z-10 flex flex-col items-center justify-center text-center px-4 pt-16  max-w-7xl mx-auto">
          {/* Main Heading */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl mb-4 font-extrabold leading-tight  text-gray-900">
            آرامش و تمرکز را با جانارام تجربه کنید
          </h1>

          {/* Sub-text */}
          <p className="text-base sm:text-md md:text-lg lg:text-xl text-gray-700 max-w-2xl mb-6 md:mb-8">
            {
              "اپلیکیشن جانارام با مدیتیشن‌های هدایت‌شده، موسیقی آرام‌بخش و تکنیک‌های تنفس، به شما کمک می‌کند استرس را کاهش  دهید و ذهنی آرام داشته باشید "
            }
          </p>

          {/* Call to Action Button */}
          <LinkScroll offset={-100} to="downloadSection" spy={true} smooth={true} duration={500}>
            <button className="bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3 px-8 rounded-full shadow-lg transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50">
              دانلود
            </button>
          </LinkScroll>
        </div>
      </section>
      <Image
        src={"/mobileView.webp"}
        alt="hero"
        className="absolute bottom-0 left-1/2 transform -translate-x-1/2 object-cover "
        width={407}
        height={763}
      />
      <div className="absolute hidden md:block bg-white rounded-2xl shadow-2xl py-2 pl-4 pr-2  bottom-1/4 right-1/6  ">
        <Image src="/heroChart.webp" alt="Hero Chart" width={200} height={200} />
      </div>
      <div className="absolute hidden md:block bg-white rounded-2xl shadow-2xl py-2 px-2  bottom-12 left-1/5  ">
        <Image src="/heroBarChart.webp" alt="Hero Chart" width={200} height={200} />
      </div>
      <div className="absolute hidden md:block bg-white rounded-2xl   bottom-1/3 left-1/6  ">
        <Users />
      </div>
      <div className="absolute hidden md:block text-right w-[300px]  border-gray-400 border-r-4 p-4  bottom-1/9 right-1/5  ">
        <p className="text-sm">راهی آسان برای مراقبت از خود. مراقبه‌های کوتاه برای هر لحظه از روز</p>
      </div>
    </div>
  );
};

export default HeroSection;
