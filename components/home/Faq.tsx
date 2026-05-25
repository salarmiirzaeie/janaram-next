"use client";
import { ChevronDown } from "lucide-react";
import React, { useState } from "react";
import { Element } from "react-scroll";

const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      question: "برنامه جانارام چیست و چه امکاناتی دارد؟",
      answer:
        "جانارام یک برنامه مدیتیشن و روان‌شناسی است که به شما کمک می‌کند آرامش ذهن و تعادل را تجربه کنید. این برنامه شامل مدیتیشن‌های متنوع برای کاهش استرس و افزایش تمرکز، موسیقی و قصه‌های مخصوص خواب، قابلیت ثبت حال روحی (مود ترکینگ)، و چت‌بات روان‌شناسی مبتنی بر هوش مصنوعی است",
    },
    {
      question: "چگونه جانارام به بهبود خواب کمک می‌کند؟",
      answer:
        "جانارام موسیقی‌ها و قصه‌های مخصوص خواب ارائه می‌دهد که با طراحی علمی، ذهن شما را آرام کرده و به خواب راحت‌تر کمک می‌کند. کافی است هر شب چند دقیقه به این محتواها گوش دهید تا کیفیت خواب‌تان بهبود یابد",
    },
    {
      question: "چت‌بات روان‌شناسی جانارام چگونه کار می‌کند؟",
      answer:
        "چت‌بات جانارام با استفاده از هوش مصنوعی به شما امکان می‌دهد درباره احساسات و چالش‌های روزانه‌تان صحبت کنید. این ابزار به‌صورت محرمانه و ۲۴ ساعته در دسترس است و راهنمایی‌های ساده و کاربردی ارائه می‌دهد",
    },
  ];

  const handleToggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <Element name="faqSection">
      <div className="border-t border-gray-200">
        <div className="max-w-6xl  mx-auto py-8 md:py-12 px-4">
          <h2 className="text-xl font-bold text-blue-500  bg-clip-text   leading-9 text-center mb-8">
            سوالات متداول
          </h2>
          {faqs.map((faq, index) => (
            <div key={index} className="mb-4">
              <button
                onClick={() => handleToggle(index)}
                className={`w-full text-right p-4 ${
                  openIndex === index ? "bg-blue-100" : "bg-blue-50"
                } ${
                  openIndex === index ? "rounded-t-2xl" : "rounded-2xl"
                }  focus:outline-none flex flex-row-reverse justify-between  items-center`}
              >
                <ChevronDown
                  className={`transition-transform ${
                    openIndex === index ? "text-blue-800" : "text-neutral-900"
                  } duration-300 ${openIndex === index ? "rotate-180" : ""}`}
                />
                <span
                  className={`text-lg ${
                    openIndex === index ? "text-blue-800" : "text-neutral-900"
                  } text-right  font-medium`}
                >
                  {faq.question}
                </span>
              </button>
              <div
                className={`overflow-hidden -mt-1 rounded-b-2xl  transition-all duration-300 ${
                  openIndex === index ? "max-h-96" : "max-h-0"
                }`}
              >
                <p
                  className={`px-4 text-right pb-4 bg-blue-100 ${
                    openIndex === index ? "text-blue-800" : "text-neutral-900"
                  }`}
                >
                  {faq.answer}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Element>
  );
};

export default FAQSection;
