// src/components/layout/FixedDownloadBar.tsx
"use client";
import Link from "next/link";
import { event } from "@/lib/gtag";

const FixedDownloadBar: React.FC = () => {
  return (
    // این دیو (div) با `fixed bottom-0` در پایین صفحه ثابت می ماند
    // `lg:hidden` باعث می شود در صفحه دسکتاپ (عرض بزرگتر) ناپدید شود و فقط در موبایل بماند.
    <div className="fixed bottom-0 left-0 right-0 lg:hidden p-3 bg-white border-t border-gray-200 shadow-2xl z-50">
      <Link
        // لینک به بخش دانلود در صفحه اصلی سایت شما (همان #downloadSection)
        href="/#downloadSection"
        // اطمینان از ردیابی ایونت برای آنالیز دقیق
        onClick={() =>
          event({
            action: "download_click",
            category: "engagement",
            label: "fixed_bottom_bar", // لیبل جدید و منحصر به فرد
          })
        }
        className="block" // برای اینکه لینک کل عرض نوار را بگیرد
      >
        <button className="w-full bg-[#AB47BC] text-white font-bold py-3 rounded-xl shadow-lg hover:bg-[#AB47BC] transition-all duration-300 transform hover:scale-[1.01]">
          {/* متن ترغیب کننده برای افزایش CTR */}
          شروع دوره رایگان مدیتیشن (کلیک کنید)
        </button>
      </Link>
    </div>
  );
};

export default FixedDownloadBar;
