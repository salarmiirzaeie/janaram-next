"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Link as LinkScroll } from "react-scroll";

const Header: React.FC = () => {
  // State to manage the visibility of the mobile menu
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Function to toggle the mobile menu state
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className="absolute top-0 left-0 w-full">
      <div className="px-4 pt-4 lg:pt-8">
        <header className="relative bg-white w-full max-w-4xl mx-auto   rounded-xl  px-4 py-1 flex items-center justify-between z-50">
          {/* Logo Section */}
          <div className="flex items-center z-10">
            {/* Using an SVG for a simple logo icon */}
            <Image src="/logo.webp" alt="Logo" width={60} height={60} />
            <span className="text-xl font-semibold text-gray-800">جانارام</span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-6  z-10">
            <LinkScroll
              className="text-gray-700 hover:text-blue-600 transition-colors duration-200"
              to="quoteForm"
              offset={-100}
              spy={true}
              smooth={true}
              duration={500}
            >
              <button>تماس با ما</button>
            </LinkScroll>
            <Link className="text-gray-700 hover:text-blue-600 transition-colors duration-200" href="/blogs">
              <button>وبلاگ</button>
            </Link>
            <LinkScroll
              className="text-gray-700 hover:text-blue-600 transition-colors duration-200"
              to="faqSection"
              offset={-100}
              spy={true}
              smooth={true}
              duration={500}
            >
              <button>سوالات متداول</button>
            </LinkScroll>

            <LinkScroll
              className="text-gray-700 hover:text-blue-600 transition-colors duration-200"
              to="reviewSection"
              offset={-100}
              spy={true}
              smooth={true}
              duration={500}
            >
              <button>نظرات</button>
            </LinkScroll>
            {/*           
          <a href="#وبلاگ" className="text-gray-700 hover:text-blue-600 transition-colors duration-200">
            وبلاگ
          </a> */}
            <LinkScroll to="downloadSection" spy={true} smooth={true} offset={-100} duration={500}>
              <button className="bg-black text-white px-6 py-2 rounded-full hover:bg-gray-800 transition-colors duration-200 shadow-lg">
                دانلود
              </button>
            </LinkScroll>
          </nav>

          {/* Mobile Menu Button (Hamburger Icon) */}
          <div className="lg:hidden flex items-center  z-10">
            <button
              onClick={toggleMobileMenu}
              className="p-2 text-gray-700 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md"
              aria-label="Toggle mobile menu"
              aria-expanded={isMobileMenuOpen}
            >
              {/* Hamburger icon using SVG for better control and styling */}
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Conditional rendering for hamburger or close icon */}
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>

          {/* Mobile Navigation Menu (Dropdown/Slide-in) */}
          {/* This menu appears/disappears based on isMobileMenuOpen state */}
          <nav
            className={`lg:hidden absolute top-full left-0  z-10 right-0 bg-white bg-opacity-95 backdrop-blur-md shadow-lg rounded-b-xl mx-4 transition-all duration-300 ease-in-out transform ${
              isMobileMenuOpen ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0 pointer-events-none"
            }`}
            style={{ zIndex: 40 }} // Ensure it's below the header but above other content
          >
            <div className="flex flex-col items-center py-4 space-y-4">
              <LinkScroll
                className="text-gray-700 hover:text-blue-600 transition-colors duration-200 w-full text-center py-2"
                to="quoteForm"
                offset={-100}
                spy={true}
                smooth={true}
                duration={500}
              >
                <button>تماس با ما</button>
              </LinkScroll>
              <LinkScroll
                className="text-gray-700 hover:text-blue-600 transition-colors duration-200 w-full text-center py-2"
                to="faqSection"
                offset={-100}
                spy={true}
                smooth={true}
                duration={500}
              >
                <button>سوالات متداول</button>
              </LinkScroll>

              <LinkScroll
                className="text-gray-700 hover:text-blue-600 transition-colors duration-200 w-full text-center py-2"
                to="reviewSection"
                offset={-100}
                spy={true}
                smooth={true}
                duration={500}
              >
                <button>نظرات</button>
              </LinkScroll>
              {/* <a
              href="#وبلاگ"
              className="text-gray-700 hover:text-blue-600 transition-colors duration-200 w-full text-center py-2"
              onClick={toggleMobileMenu}
            >
              وبلاگ
            </a> */}
              <LinkScroll to="downloadSection" offset={-100} spy={true} smooth={true} duration={500}>
                <button className="bg-black text-white px-6 py-2 rounded-full hover:bg-gray-800 transition-colors duration-200 shadow-lg w-fit">
                  دانلود
                </button>
              </LinkScroll>
            </div>
          </nav>
        </header>
      </div>
    </div>
  );
};

export default Header;
