// app/(home)/blogs/[id]/loading.tsx
"use client";

import { useEffect } from "react";

export default function LoadingBlog() {
  useEffect(() => {
    window.scrollTo(0, 0); // reset scroll
  }, []);
  return (
    <div className="max-w-6xl min-h-screen mt-28 mx-auto py-16 px-4 sm:px-6 lg:px-8">
      <h2 className="text-2xl font-bold text-blue-500 text-center mb-8 animate-pulse bg-gray-300 h-8 w-1/4 mx-auto rounded"></h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, idx) => (
          <div key={idx} className="bg-gray-300 rounded-lg h-72 animate-pulse"></div>
        ))}
      </div>
    </div>
  );
}
