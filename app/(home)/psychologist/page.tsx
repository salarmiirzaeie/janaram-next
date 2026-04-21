"use client";
import Image from "next/image";
import React from "react";

const page = () => {
  return (
    <div className="max-w-6xl min-h-screen items-center  mt-28 mx-auto py-4 px-4 sm:px-6 lg:px-8">
      <h2 className="text-2xl font-bold text-blue-500 text-center mb-8">
        به زودی
      </h2>
      <h3 className="text-xl font-bold text-blue-800 text-center mb-8">
        بخش روانشناسی برخط به زودی تکمیل خواهد شد. از صبر و شکیبایی شما
        سپاسگزاریم
      </h3>
      <Image
        alt="Psychologist"
        height={200}
        priority
        fetchPriority="high"
        className="   max-w-[95vw] sm:max-w-[60vw] "
        sizes="(max-width: 640px) 80vw, (max-width: 768px) 60vw, 407px"
        width={350}
        src={require("@/public/images/psycho.png")}
      />
    </div>
  );
};

export default page;
