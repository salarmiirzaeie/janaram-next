import About from "@/components/home/About";
import BlogSection from "@/components/home/BlogSection";
import DownloadSection from "@/components/home/DownloadSection";
import FAQSection from "@/components/home/Faq";
import Hero from "@/components/home/Hero";
import React, { Suspense } from "react";
import QuoteForm from "@/components/home/QuoteForm";
import CustomerReviewsSection from "@/components/home/Reviews";
import ScrollToHash from "@/components/home/ScrollToHash";

const Page = () => {
  return (
    <div className="bg-white">
      {/* runs only on clients */}
      <ScrollToHash />

      <Hero />
      <About />
      <DownloadSection />
      {/* <Suspense fallback={<p>Loading...</p>}>
        <BlogSection />
      </Suspense> */}
      <FAQSection />
      <CustomerReviewsSection />
      <QuoteForm />
    </div>
  );
};

export default Page;
