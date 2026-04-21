// src/components/layout/FixedDownloadBar.tsx
"use client";
import Link from "next/link";
import { event } from "@/lib/gtag";
import { Link as LinkScroll } from "react-scroll";
import { usePathname } from "next/navigation";

const FixedDownloadBar: React.FC = () => {
  const pathname = usePathname();
  if (pathname !== "/psychologist") {
    return (
      <div className="fixed bottom-0 left-0 right-0 lg:hidden p-3 bg-white border-t border-gray-200 shadow-2xl z-50">
        <LinkScroll
          offset={80}
          to="downloadSection"
          spy={true}
          smooth={true}
          duration={500}
          className="block" // برای اینکه لینک کل عرض نوار را بگیرد
        >
          <button className="w-full bg-sky-600 text-white font-bold py-3 rounded-xl shadow-lg hover:bg-sky-900 transition-all duration-300 transform hover:scale-[1.01]">
            {/* متن ترغیب کننده برای افزایش CTR */}
            دانلود رایگان جانارام و آغاز آرامش
          </button>
        </LinkScroll>
      </div>
    );
  } else {
    return null;
  }
};

export default FixedDownloadBar;
