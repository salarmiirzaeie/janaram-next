"use client";
import { ChevronDown } from "lucide-react";
import React, { useState } from "react";
import { Element } from "react-scroll";

const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      question: "llewllewli ofmwf ?",
      answer:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
    },
    {
      question: "llewllewli ofmwf ?",
      answer:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
    },
    {
      question: "llewllewli ofmwf ?",
      answer:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
    },
  ];

  const handleToggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <Element name="faqSection">
      <div className="max-w-6xl mx-auto py-8 md:py-12 px-4">
        <h2 className="text-xl font-bold text-blue-500  bg-clip-text   leading-9 text-center mb-8">سوالات متداول</h2>
        {faqs.map((faq, index) => (
          <div key={index} className="mb-4">
            <button
              onClick={() => handleToggle(index)}
              className={`w-full text-left p-4 ${openIndex === index ? "bg-blue-100" : "bg-blue-50"} ${
                openIndex === index ? "rounded-t-2xl" : "rounded-2xl"
              }  focus:outline-none flex justify-between items-center`}
            >
              <span className={`text-lg ${openIndex === index ? "text-blue-800" : "text-neutral-900"}   font-medium`}>
                {faq.question}
              </span>
              <ChevronDown
                className={`transition-transform ${
                  openIndex === index ? "text-blue-800" : "text-neutral-900"
                } duration-300 ${openIndex === index ? "rotate-180" : ""}`}
              />
            </button>
            <div
              className={`overflow-hidden -mt-1 rounded-b-2xl  transition-all duration-300 ${
                openIndex === index ? "max-h-96" : "max-h-0"
              }`}
            >
              <p className={`px-4 pb-4 bg-blue-100 ${openIndex === index ? "text-blue-800" : "text-neutral-900"}`}>
                {faq.answer}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Element>
  );
};

export default FAQSection;
