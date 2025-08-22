"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { BASE_URL_IMAGES } from "@/lib/constants";

interface Blog {
  _id: string;
  title: string;
  slug: string;
  content: string;
  authorId: string;
  imageUrl: string;
  createdAt: string;
  updatedAt: string;
}

const BlogDetailPage: React.FC = () => {
  const params = useParams();
  const slug = params?.slug as string; // Get the blog slug from the URL
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBlog = async (blogSlug: string) => {
    try {
      const response = await fetch(`/api/blogs/${blogSlug}`, {
        headers: {
          // Uncomment if authentication is required
          // Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch blog");
      }
      const data = await response.json();
      if (data.success && data.blog) {
        setBlog(data.blog);
      } else {
        throw new Error(data.message || "Blog not found");
      }
    } catch (err) {
      console.error("Error fetching blog:", err);
      setError("Failed to load blog");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (slug) {
      fetchBlog(slug);
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-blue-500 text-center mb-8">وبلاگ</h2>
        <p className="text-center text-gray-500">Loading...</p>
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="max-w-3xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-blue-500 text-center mb-8">وبلاگ</h2>
        <p className="text-center text-red-500">{error || "Blog not found"}</p>
        <div className="text-center mt-4">
          <Link href="/blog" className="text-blue-500 hover:underline">
            Back to Blogs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mt-28 mx-auto py-16 px-4 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-4">{blog.title}</h1>
      <img
        src={BASE_URL_IMAGES + blog.imageUrl || "/hero-bg.webp"}
        alt={blog.title}
        className="w-full h-64 object-cover rounded-lg mb-6"
      />
      <div className="flex justify-between items-center text-sm text-gray-500 mb-6">
        <span>Unknown Author</span>
        <span>
          {new Date(blog.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
        </span>
      </div>
      <div className="prose prose-lg text-gray-700">
        <p>{blog.content}</p>
      </div>
    </div>
  );
};

export default BlogDetailPage;
