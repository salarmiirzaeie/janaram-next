"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Link as LinkScroll } from "react-scroll";
import { usePathname } from "next/navigation";
import { event } from "@/lib/gtag"; // 👈 اضافه شد

type NavItem = {
  type: string;
  to?: string;
  href?: string;
  label: string;
  button?: boolean;
};

type NavItems = {
  [key: string]: NavItem[];
};

const Header: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const navItems: NavItems = {
    "/": [
      { type: "scroll", to: "quoteForm", label: "تماس با ما" },
      { type: "link", href: "/blogs", label: "وبلاگ" },
      { type: "scroll", to: "faqSection", label: "سوالات متداول" },
      { type: "scroll", to: "reviewSection", label: "نظرات" },
      { type: "scroll", to: "downloadSection", label: "دانلود رایگان", button: true },
    ],
    "/blogs": [
      { type: "link", href: "/", label: "خانه" },
      { type: "link", href: "/#downloadSection", label: "دانلود رایگان", button: true },
    ],
  };

  const currentNavs = pathname === "/" ? navItems["/"] : pathname.startsWith("/blogs") ? navItems["/blogs"] : [];
  const downloadButtonClasses =
    "bg-[#AB47BC] text-white px-6 py-2 rounded-full hover:bg-[#AB47BC] transition-all duration-300 shadow-xl transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-[#AB47BC]";

  const normalButtonClasses = "text-gray-700 hover:text-[#AB47BC]";
  return (
    <div className="absolute top-0 left-0 w-full">
      <div className="px-4 pt-4 lg:pt-8">
        <header className="relative bg-white w-full max-w-4xl mx-auto rounded-xl px-4 py-1 flex items-center justify-between z-50">
          {/* Logo */}
          <div className="flex items-center z-10">
            <Image src="/logo.webp" alt="Logo" width={60} height={60} />
            <span className="text-xl font-semibold text-gray-800">جانارام</span>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center space-x-6 z-10">
            {currentNavs.map((item, idx) =>
              item.type === "scroll" ? (
                <LinkScroll
                  key={idx}
                  to={item.to!}
                  offset={-100}
                  spy={true}
                  smooth={true}
                  duration={500}
                  className="transition-colors duration-200"
                >
                  <button
                    onClick={() =>
                      item.button &&
                      event({
                        action: "download_click",
                        category: "engagement",
                        label: "header_download_button",
                      })
                    }
                    className={
                      item.button
                        ? downloadButtonClasses // 👈 استفاده از کلاس‌های جدید
                        : normalButtonClasses
                    }
                  >
                    {item.label}
                  </button>
                </LinkScroll>
              ) : (
                <Link key={idx} href={item.href!} className="transition-colors duration-200">
                  <button
                    onClick={() =>
                      item.button &&
                      event({
                        action: "download_click",
                        category: "engagement",
                        label: "header_download_button",
                      })
                    }
                    className={
                      item.button
                        ? downloadButtonClasses // 👈 استفاده از کلاس‌های جدید
                        : normalButtonClasses
                    }
                  >
                    {item.label}
                  </button>
                </Link>
              )
            )}
          </nav>

          {/* Mobile Hamburger */}
          <div className="lg:hidden flex items-center z-10">
            <button
              onClick={toggleMobileMenu}
              className="p-2 text-gray-700 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>

          {/* Mobile Nav */}
          <nav
            className={`lg:hidden absolute top-full left-0 z-10 right-0 bg-white bg-opacity-95 backdrop-blur-md shadow-lg rounded-b-xl mx-4 transition-all duration-300 ease-in-out transform ${
              isMobileMenuOpen ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0 pointer-events-none"
            }`}
            style={{ zIndex: 40 }}
          >
            <div className="flex flex-col items-center py-4 space-y-4">
              {currentNavs.map((item, idx) =>
                item.type === "scroll" ? (
                  <LinkScroll
                    key={idx}
                    to={item.to!}
                    offset={-100}
                    spy={true}
                    smooth={true}
                    duration={500}
                    className="transition-colors duration-200"
                  >
                    <button
                      onClick={() =>
                        item.button &&
                        event({
                          action: "download_click",
                          category: "engagement",
                          label: "header_download_button_mobile",
                        })
                      }
                      className={
                        item.button
                          ? downloadButtonClasses // 👈 استفاده از کلاس‌های جدید
                          : normalButtonClasses
                      }
                    >
                      {item.label}
                    </button>
                  </LinkScroll>
                ) : (
                  <Link key={idx} href={item.href!} className="transition-colors duration-200">
                    <button
                      onClick={() =>
                        item.button &&
                        event({
                          action: "download_click",
                          category: "engagement",
                          label: "header_download_button_mobile",
                        })
                      }
                      className={
                        item.button
                          ? downloadButtonClasses // 👈 استفاده از کلاس‌های جدید
                          : normalButtonClasses
                      }
                    >
                      {item.label}
                    </button>
                  </Link>
                )
              )}
            </div>
          </nav>
        </header>
      </div>
    </div>
  );
};

export default Header;
