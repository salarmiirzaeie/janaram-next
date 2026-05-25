import About from "@/components/home/About";
import DownloadSection from "@/components/home/DownloadSection";
import FAQSection from "@/components/home/Faq";
import Hero from "@/components/home/Hero";
import QuoteForm from "@/components/home/QuoteForm";
import CustomerReviewsSection from "@/components/home/Reviews";
import ScrollToHash from "@/components/home/ScrollToHash";
import PsychologistInvite from "@/components/home/PsychologistInvite";

const Page = () => {
  return (
    <div className="bg-white pb-24 lg:pb-0">
      <ScrollToHash />

      <Hero />
      <About />
      <PsychologistInvite />
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
