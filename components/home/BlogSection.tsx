"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import BlogCardHome from "./BlogCardHome";

interface Blog {
  _id: string;
  title: string;
  content: string;
  authorId: string;
  imageUrl: string;
  createdAt: string;
  updatedAt: string;
  slug: string;
}

const BlogSection: React.FC = () => {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBlogs = async () => {
    try {
      const response = await fetch("/api/blogs?sort=createdAt&limit=3", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
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
      <div className="border-b border-gray-200">
        <div className="max-w-6xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-bold text-blue-500 bg-clip-text leading-9 text-center mb-8">وبلاگ</h2>
          <p className="text-center text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border-b border-gray-200">
        <div className="max-w-6xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-bold text-blue-500 bg-clip-text leading-9 text-center mb-8">وبلاگ</h2>
          <p className="text-center text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="border-b border-gray-200">
      <div className="max-w-6xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <h2 className="text-xl font-bold text-blue-500 bg-clip-text leading-9 text-center mb-8">وبلاگ</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {blogs.length === 0 ? (
            <p className="text-center text-gray-500">No blogs available.</p>
          ) : (
            blogs.map((post) => (
              <BlogCardHome
                post_name={post.slug} // Map _id to post_name
                key={post._id}
                imageSrc={post.imageUrl || "/hero-bg.webp"} // Fallback to default image
                title={post.title}
                summary={post.content.slice(0, 250)} // Truncate content to 250 characters
                author="Unknown Author" // Placeholder; replace with actual author name if available
                date={new Date(post.createdAt).toISOString().split("T")[0]} // Format date as YYYY-MM-DD
              />
            ))
          )}
        </div>
        <div className="text-center">
          <Link href="/blogs">
            <button className="bg-black text-white px-4 mt-16 py-2 rounded-2xl hover:bg-white hover:text-black">
              مشاهده همه بلاگ ها
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BlogSection;
