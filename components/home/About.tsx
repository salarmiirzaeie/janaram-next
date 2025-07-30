import React from "react";

const About = () => {
  return (
    <section className="flex items-center justify-center border-b border-gray-200 py-8 md:pb-16 md:pt-28 px-4 bg-white text-gray-700 font-inter md:mt-[50vh] mt-[60vh]">
      <div className="max-w-4xl mx-auto text-center">
        <p className="text-xl uppercase tracking-widest text-blue-500 font-semibold mb-4">درباره جانارام</p>
        <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl  leading-tight text-gray-800 mb-6">
          جانارام اپلیکیشنی برای مدیتیشن، آرامش ذهن و بهبود سلامت روان است. این برنامه با مدیتیشن‌های هدایت‌شده، موسیقی
          آرام‌بخش، تکنیک‌های تنفس، داستان‌های خواب و قابلیت ثبت حالت روحی، به کاهش استرس، افزایش تمرکز و خواب بهتر کمک
          می‌کند. اگر به دنبال آرامش روزانه و انرژی مثبت هستید، جانارام بهترین همراه شماست
        </h2>
      </div>
    </section>
  );
};

export default About;
