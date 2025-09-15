"use client";
import React from "react";

const About = () => {
  return (
    <section className="flex  items-center justify-center border-b border-gray-200 py-8 md:pb-16 md:pt-12 px-4 bg-white text-gray-700 font-inter">
      <div className="max-w-4xl mx-auto text-center">
        <p className="text-xl uppercase tracking-widest text-blue-500 font-semibold mb-4">درباره جانارام</p>
        <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl  leading-tight text-gray-800 mb-6">
          جانارام اپلیکیشنی برای مدیتیشن و آرامش ذهن است که با استفاده از هوش مصنوعی، تمرین‌ها را بر اساس اهداف و حال
          روزانه شما شخصی‌سازی می‌کند. از مدیتیشن تنفسی و شکرگزاری تا تمرین‌های مخصوص خواب بهتر، همه چیز در جانارام
          طراحی شده تا مسیر آرامش و سلامت روان را ساده‌تر و هوشمندتر تجربه کنید.
        </h2>
      </div>
    </section>
  );
};

export default About;
