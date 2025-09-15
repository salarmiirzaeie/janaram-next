// app/blogs/page.tsx
import Link from "next/link";
import { BASE_URL_IMAGES } from "@/lib/constants";
import { formatDate } from "@/lib/time";
import type { Metadata } from "next";

interface Blog {
  _id: string;
  slug: string; // ✅ اضافه شد
  title: string;
  content: string;
  authorId: string;
  imageUrl: string;
  createdAt: string;
  updatedAt: string;
  description: string;
}

// ✅ Server-side fetch
async function getBlogs(): Promise<Blog[]> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/blogs`, {
      cache: "no-store", // SSR همیشه تازه
    });

    if (!res.ok) return [];
    const data = await res.json();
    return data.blogs || [];
  } catch (err) {
    console.error("Error fetching blogs:", err);
    return [];
  }
}

// ✅ SEO metadata
export const metadata: Metadata = {
  title: "وبلاگ | جانارام",
  description: "آخرین مقالات و اخبار جانارام را در وبلاگ مطالعه کنید.",
};

export default async function BlogPage() {
  const blogs = await getBlogs();

  return (
    <div className="max-w-6xl min-h-screen mt-28 mx-auto py-16 px-4 sm:px-6 lg:px-8">
      <h2 className="text-2xl font-bold text-blue-500 text-center mb-8">وبلاگ</h2>

      {blogs.length === 0 ? (
        <p className="text-center text-gray-500">هیچ مقاله‌ای موجود نیست.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {blogs.map((blog) => (
            <div
              key={blog._id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              <img
                src={blog.imageUrl ? BASE_URL_IMAGES + blog.imageUrl : "/hero-bg.webp"}
                alt={blog.title}
                className="w-full h-48 object-cover"
              />
              <div className="p-4">
                <Link href={`/blogs/${blog.slug}`}>
                  <h2 className="text-xl text-right font-bold mb-2 hover:text-primary">{blog.title}</h2>
                </Link>

                <div className="flex flex-row items-end justify-end text-sm mb-4 text-gray-500">
                  <p className="text-right">نوشته شده بوسیله جانارام</p>
                  <span className="mx-2">|</span>
                  <span>{formatDate(blog.createdAt)}</span>
                </div>

                <Link href={`/blogs/${blog.slug}`}>
                  <p className="text-primary hover:text-primary text-left text-sm mt-4 sm:text-base font-semibold">
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
}
