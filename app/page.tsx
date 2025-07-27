import About from "@/components/home/About";
import BlogSection from "@/components/home/BlogSection";
import DownloadSection from "@/components/home/DownloadSection";
import FAQSection from "@/components/home/Faq";
import Hero from "@/components/home/Hero";
import React from "react";
import QuoteForm from "@/components/home/QuoteForm";
import CustomerReviewsSection from "@/components/home/Reviews";

const page = () => {
  return (
    <div className="bg-white">
      <Hero />

      <About />
      <DownloadSection />
      {/* <BlogSection /> */}
      <CustomerReviewsSection />
      <FAQSection />
      <QuoteForm />
    </div>
  );
};

export default page;
