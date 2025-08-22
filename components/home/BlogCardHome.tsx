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
}
export default function BlogCardHome({ imageSrc, title, summary, date, post_name, index }: BlogCardProps) {
  return (
    <div>
      <div className={`mx-auto bg-white overflow-hidden border   border-gray-200  shadow-xl rounded-2xl`}>
        <div className=" flex flex-col ">
          <Image
            width={500}
            height={300}
            src={imageSrc} // Replace with optimized image URL
            alt={title}
            loading={index === 0 ? "eager" : "lazy"}
            className="w-full h-60 object-cover"
          />
          <div className="p-4">
            <Link href={`/blog/${post_name}`}>
              <h2 className="text-xl font-bold mb-2 hover:text-primary">{title}</h2>
            </Link>
            <div className="flex flex-row items-center text-sm mb-4 text-gray-500">
              <p>By </p>

              <Link href={"/"} className="hover:underline ml-1 text-primary">
                Auto Glass Solutions
              </Link>

              <span className="mx-2">|</span>
              <span>{formatDate(date)}</span>
            </div>

            <Link href={`/blogs/${post_name}`}>
              <p className="text-primary text-left text-sm mt-4 sm:text-base font-semibold">Read More</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
