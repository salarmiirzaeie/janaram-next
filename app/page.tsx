import Hero from "@/components/layout/Hero";
import Image from "next/image";
import React from "react";

const page = () => {
  return (
    <div className="bg-white ">
      <div
        style={{ backgroundImage: "url('/hero-bg.webp')", backgroundSize: "cover", backgroundPosition: "center" }}
        className="h-[100vh] absolute top-0 left-0 w-full z-0"
      >
        <Hero />
        <Image
          src={"/mobileView.webp"}
          alt="hero"
          className="absolute bottom-0 left-1/2 transform -translate-x-1/2 object-cover "
          width={407}
          height={763}
        />
      </div>
      <section className="flex items-center justify-center py-8 md:py-24 px-4 bg-white text-gray-700 font-inter md:mt-[85vh] mt-[90vh]">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xl uppercase tracking-widest text-blue-500 font-semibold mb-4">درباره جانارام</p>
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl  leading-tight text-gray-800 mb-6">
            جانارام اپلیکیشنی برای مدیتیشن، آرامش ذهن و بهبود سلامت روان است. این برنامه با مدیتیشن‌های هدایت‌شده،
            موسیقی آرام‌بخش، تکنیک‌های تنفس، داستان‌های خواب و قابلیت ثبت حالت روحی، به کاهش استرس، افزایش تمرکز و خواب
            بهتر کمک می‌کند. اگر به دنبال آرامش روزانه و انرژی مثبت هستید، جانارام بهترین همراه شماست
          </h2>
        </div>
      </section>
    </div>
  );
};

export default page;
