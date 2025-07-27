"use client";
import React from "react";
import Link from "next/link";
import Image from "next/image";
import TestimonialCard from "./ReviewCard";
import { Element } from "react-scroll";

export default function CustomerReviewsSection() {
  const data = [
    {
      name: "سعید",
      review:
        "درود سپاس فروان بر قلبهای عشق و نور بر شما ممنون بابت این برنامه خوبتان اومیدوارم هروز پیشرفت کنید 🙏🌠❤🌹🌱",
      imageSrc: "Ali",
      imageAlt: "Ali",
      rating: "5",
    },
    {
      name: "Mehdi",
      review: "جان آرام یه اپلیکیشنی که همراهم شده و خیلی باهاش ارتباط گرفتم، عالیه سپاس از زحماتتون",
      imageSrc: "Mehdi",
      imageAlt: "Mehdi",
      rating: "5",
    },
    {
      name: "سهیل",
      review: "با سلام من برنامه رو نصب کردم واقعا عالیه 5 ستاره خیلی کمه براش ",
      imageSrc: "Ehsan",
      imageAlt: "Ehsan",
      rating: "5",
    },
  ];
  return (
    <Element name="reviewSection">
      <div className="w-full  max-w-6xl mx-auto px-4 py-8 md:py-12">
        <div className="flex  items-center gap-2 justify-center mb-6">
          <h2 className="text-xl font-bold text-blue-500  bg-clip-text   leading-9 text-center mb-8">نظرات کاربران!</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {data.map((testimonial, index) => (
            <TestimonialCard
              key={index}
              name={testimonial.name}
              review={testimonial.review}
              imageSrc={testimonial.imageSrc}
              imageAlt={testimonial.imageAlt}
              rating={testimonial.rating}
            />
          ))}
        </div>
        <div className="text-center mt-22">
          <Link href={"https://cafebazaar.ir/app/com.salarmiirzapour.Janaram"}>
            <button className="bg-black text-white px-4 mt-16 py-2 rounded-2xl hover:bg-white hover:text-black">
              مشاهده همه نظرات{" "}
            </button>
          </Link>
        </div>
      </div>
    </Element>
  );
}
