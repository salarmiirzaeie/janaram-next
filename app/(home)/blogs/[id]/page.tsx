"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import DOMPurify from "dompurify"; // ← import DOMPurify
import { BASE_URL_IMAGES } from "@/lib/constants";
import { formatDate } from "@/lib/time";

interface Blog {
  _id: string;
  title: string;
  content: string;
  authorId: string;
  imageUrl: string;
  createdAt: string;
  updatedAt: string;
  description: string;
}

const BlogDetailPage: React.FC = () => {
  const params = useParams();
  const id = params?.id as string;
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBlog = async () => {
    try {
      const response = await fetch(`/api/blogs/${id}`);
      if (!response.ok) throw new Error("Failed to fetch blog");

      const data = await response.json();
      if (data.success && data.blog) setBlog(data.blog);
      else throw new Error(data.message || "Blog not found");
    } catch (err) {
      console.error(err);
      setError("Failed to load blog");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchBlog();
  }, [id]);

  if (loading)
    return (
      <div className="max-w-3xl mx-auto py-16 px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-2xl font-bold text-blue-500 mb-8">وبلاگ</h2>
        <p className="text-gray-500">Loading...</p>
      </div>
    );

  if (error || !blog)
    return (
      <div className="max-w-3xl mx-auto py-16 px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-2xl font-bold text-blue-500 mb-8">وبلاگ</h2>
        <p className="text-red-500">{error || "Blog not found"}</p>
        <Link href="/blogs" className="text-blue-500 hover:underline mt-4 inline-block">
          Back to Blogs
        </Link>
      </div>
    );

  // Sanitize content before rendering
  const sanitizedContent = DOMPurify.sanitize(blog.content);
  return (
    <div className="max-w-6xl bg-white mt-28 mx-auto py-16 px-4 rounded-2xl sm:px-6 lg:px-8">
      <h1 className="text-3xl text-right font-bold text-gray-800 mb-4">{blog.title}</h1>
      <div className="mb-6">
        <div className="flex flex-col lg:flex-row lg:space-x-6 items-center">
          {/* Image */}
          <img
            src={blog.imageUrl ? BASE_URL_IMAGES + blog.imageUrl : "/hero-bg.webp"}
            alt={blog.title}
            className="w-full lg:w-1/2 h-64 rounded-2xl object-cover mb-4 lg:mb-0"
          />
          {/* Description */}
          <p className="w-full lg:w-1/2 text-right text-xl font-bold text-gray-700">{blog.description}</p>
        </div>
      </div>
      <div className="flex justify-between items-center text-sm text-gray-500 mb-6">
        <span>{formatDate(blog.createdAt)}</span>
      </div>
      <div className="prose prose-lg text-gray-700" dangerouslySetInnerHTML={{ __html: sanitizedContent }} />
    </div>
  );
};

export default BlogDetailPage;
