import About from "@/components/home/About";
import BlogSection from "@/components/home/BlogSection";
import DownloadSection from "@/components/home/DownloadSection";
import FAQSection from "@/components/home/Faq";
import Hero from "@/components/home/Hero";
import Image from "next/image";
import React from "react";

const page = () => {
  return (
    <div className="bg-white">
      <Hero />

      <About />
      <DownloadSection />
      <BlogSection />
      <FAQSection />
    </div>
  );
};

export default page;
