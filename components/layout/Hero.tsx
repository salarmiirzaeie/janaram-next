// components/HeroSection.tsx
import React from "react";

const HeroSection: React.FC = () => {
  return (
    <section className="relative flex  pt-18  text-gray-900  font-inter">
      {/* Background overlay for subtle cloud effect (can be replaced with actual image) */}

      <div className="relative z-10 flex flex-col items-center justify-center text-center px-4 pt-16  max-w-7xl mx-auto">
        {/* Main Heading */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl mb-4 font-extrabold leading-tight  text-gray-900">
          آرامش و تمرکز را با جانارام تجربه کنید
        </h1>

        {/* Sub-text */}
        <p className="text-base sm:text-md md:text-lg lg:text-xl text-gray-700 max-w-2xl mb-6 md:mb-8">
          اپلیکیشن جانارام با مدیتیشن‌های هدایت‌شده، موسیقی آرام‌بخش و تکنیک‌های تنفس، به شما کمک می‌کند استرس را کاهش
          دهید و ذهنی آرام داشته باشید.
        </p>

        {/* Call to Action Button */}
        <button className="bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3 px-8 rounded-full shadow-lg transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50">
          دانلود
        </button>
      </div>
    </section>
  );
};

export default HeroSection;
