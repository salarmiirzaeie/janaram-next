// src/components/blog/BlogCtaBox.tsx
"use client";
import Link from "next/link";
import { event } from "@/lib/gtag";

const BlogCtaBox: React.FC = () => {
  return (
    // کادر با رنگ پس زمینه متمایز و سایه
    <div className="my-10 p-6 bg-pink-50 border-r-4 border-pink-600 rounded-lg shadow-xl text-center">
      {/* عنوان ترغیب کننده */}
      <h3 className="text-xl md:text-2xl font-extrabold text-gray-800 mb-3">
        تمرین کامل <span className="text-pink-600">شخصی‌سازی شده</span> خود را دریافت کنید!
      </h3>

      {/* توضیح ارزش پیشنهادی کلیدی */}
      <p className="text-base text-gray-600 mb-6 max-w-md mx-auto">
        مدیتیشن امروز شما با هوش مصنوعی جانارام بر اساس حال روحی و اهدافتان طراحی می‌شود. برای دسترسی به{" "}
        <span className="font-bold">چت‌بات روانشناس AI</span>، همین حالا دانلود کنید.
      </p>

      {/* دکمه CTA جدید و رنگی */}
      <Link
        href="/#downloadSection" // لینک به بخش دانلود
        onClick={() =>
          event({
            action: "download_click",
            category: "engagement",
            label: "in_article_cta", // لیبل ردیابی جدید
          })
        }
        className="inline-block"
      >
        <button
          // استفاده از کلاس‌های پررنگ و جذاب برند (مطابق با Header)
          className="bg-pink-600 text-white text-lg font-bold px-8 py-3 rounded-full hover:bg-pink-700 transition-all duration-300 shadow-lg transform hover:scale-105"
        >
          دانلود رایگان و شروع آرامش
        </button>
      </Link>

      {/* پیام کوچک درباره مارکت‌ها */}
      <div className="mt-4">
        <p className="text-sm text-gray-500">موجود در کافه بازار، مایکت و نصب مستقیم</p>
      </div>
    </div>
  );
};

export default BlogCtaBox;
