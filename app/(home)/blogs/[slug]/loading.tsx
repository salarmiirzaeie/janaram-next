// app/(home)/blogs/[id]/loading.tsx
"use client";

import { useEffect } from "react";

export default function LoadingBlog() {
  useEffect(() => {
    window.scrollTo(0, 0); // Force scroll to top
  }, []);

  return (
    <div className="max-w-6xl min-h-screen mx-auto py-16 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Title skeleton */}
      <div className="h-10 w-1/2 bg-gray-300 rounded animate-pulse mx-auto"></div>

      {/* Image + description skeleton */}
      <div className="flex flex-col lg:flex-row lg:space-x-6 items-center">
        {/* Image skeleton */}
        <div className="w-full lg:w-1/2 h-64 bg-gray-300 rounded-2xl animate-pulse mb-4 lg:mb-0" />

        {/* Description skeleton */}
        <div className="w-full lg:w-1/2 space-y-2">
          <div className="h-6 bg-gray-300 rounded animate-pulse w-full"></div>
          <div className="h-6 bg-gray-300 rounded animate-pulse w-5/6"></div>
          <div className="h-6 bg-gray-300 rounded animate-pulse w-4/6"></div>
        </div>
      </div>

      {/* Date skeleton */}
      <div className="h-4 bg-gray-300 rounded w-1/4 animate-pulse"></div>

      {/* Content skeleton */}
      <div className="space-y-4 mt-6">
        {Array.from({ length: 8 }).map((_, idx) => (
          <div key={idx} className="h-4 bg-gray-300 rounded w-full animate-pulse"></div>
        ))}
      </div>
    </div>
  );
}
