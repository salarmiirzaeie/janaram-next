import React from "react";
import Link from "next/link";
import BlogCardHome from "./BlogCardHome";
const BlogSection = () => {
  const data = [
    {
      ID: 1,
      post_name: "1",
      post_title: "Blog Post 1",
      post_content: "This is the content of Blog Post 1.",
      author: "John Doe",
      post_date: "2023-06-01",
      image: "/hero-bg.webp",
    },
    {
      ID: 2,
      post_name: "2",
      post_title: "Blog Post 2",
      post_content: "This is the content of Blog Post 2.",
      author: "Jane Doe",
      post_date: "2023-06-02",
      image: "/hero-bg.webp",
    },
    {
      ID: 3,
      post_name: "3",
      post_title: "Blog Post 3",
      post_content: "This is the content of Blog Post 3.",
      author: "John Doe",
      post_date: "2023-06-03",
      image: "/hero-bg.webp",
    },
  ];
  return (
    <div className="border-b border-gray-200">
      <div className="  max-w-6xl mx-auto py-16 px-4 sm:px-6  lg:px-8">
        <h2 className="text-xl font-bold text-blue-500  bg-clip-text   leading-9 text-center mb-8">وبلاگ </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {data.map((post) => (
            <BlogCardHome
              post_name={post.post_name}
              key={post.ID}
              imageSrc={post.image} // Replace with optimized image URL
              title={post.post_title}
              summary={post.post_content.slice(0, 250)}
              author={post.author}
              date={post.post_date}
            />
          ))}
        </div>
        <div className="text-center ">
          <Link href="/blog">
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
