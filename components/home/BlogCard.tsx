"use client";
import { formatDate } from "@/lib/time";
import Image from "next/image";
import Link from "next/link";
import React from "react";
interface BlogCardProps {
  imageSrc: string;
  title: string;
  summary: string;
  author: string;
  date: string;
  post_name: string;
  index?: number;
  home?: boolean;
}
export default function BlogCard({ imageSrc, title, summary, home, date, post_name, index }: BlogCardProps) {
  return (
    <div>
      <div className={`mx-auto bg-white overflow-hidden ${home ? "border" : "border-b"}  border-gray-200 `}>
        <div className="p-4 flex flex-col ">
          <Link href={`/blog/${post_name}`}>
            <h2 className="text-xl font-bold mb-2 hover:text-primary">{title}</h2>
          </Link>
          <div className="flex items-center text-sm mb-4 text-gray-500">
            <p>By </p>

            <Link href={"/"} className="hover:underline ml-1 text-primary">
              Auto Glass Solutions
            </Link>

            <span className="mx-2">|</span>
            <span>{formatDate(date)}</span>
          </div>
          <Image
            width={500}
            height={300}
            src={imageSrc} // Replace with optimized image URL
            alt={title}
            loading={index === 0 ? "eager" : "lazy"}
            fetchPriority={index === 0 ? "high" : "low"}
            priority={index === 0}
          />

          <Link href={`/blog/${post_name}`}>
            <p className="text-primary text-left text-sm mt-4 sm:text-base font-semibold">Read More</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
