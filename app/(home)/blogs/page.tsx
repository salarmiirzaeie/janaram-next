"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { BASE_URL_IMAGES } from "@/lib/constants";
import { formatDate } from "@/lib/time";

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

const BlogPage: React.FC = () => {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBlogs = async () => {
    try {
      const response = await fetch("/api/blogs", {
        headers: {
          // Uncomment if authentication is required
          // Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch blogs");
      }
      const data = await response.json();
      setBlogs(data.blogs || []);
    } catch (err) {
      console.error("Error fetching blogs:", err);
      setError("Failed to load blogs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-blue-500 text-center mb-8">وبلاگ</h2>
        <p className="text-center text-gray-500">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-blue-500 text-center mb-8">وبلاگ</h2>
        <p className="text-center text-red-500">{error}</p>
      </div>
    );
  }
  return (
    <div className="max-w-6xl mt-28 mx-auto py-16 px-4 sm:px-6 lg:px-8">
      <h2 className="text-2xl font-bold text-blue-500 text-center mb-8">وبلاگ</h2>
      {blogs.length === 0 ? (
        <p className="text-center text-gray-500">No blogs available.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {blogs.map((blog) => (
            <div
              key={blog._id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              <img
                src={BASE_URL_IMAGES + blog.imageUrl || "/hero-bg.webp"}
                alt={blog.title}
                className="w-full h-48 object-cover"
              />
              <div className="p-4">
                <Link href={`/blog/${blog.slug}`}>
                  <h2 className="text-xl text-right font-bold mb-2 hover:text-primary">{blog.title}</h2>
                </Link>
                <div className="flex flex-row items-end justify-end text-sm mb-4 text-gray-500">
                  <p className="text-right ">نوشته شده بوسیله جانارام</p>

                  <span className="mx-2">|</span>
                  <span>{formatDate(blog.createdAt)}</span>
                </div>

                <Link href={`/blogs/${blog.slug}`}>
                  <p className="text-primary text-primary hover:text-primary text-left text-sm mt-4 sm:text-base font-semibold">
                    بیشتر
                  </p>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BlogPage;
