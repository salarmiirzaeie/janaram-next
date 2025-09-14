// app/(home)/blogs/[id]/page.tsx
import DOMPurify from "isomorphic-dompurify";
import { BASE_URL_IMAGES } from "@/lib/constants";
import { formatDate } from "@/lib/time";
import Link from "next/link";
import type { Metadata } from "next";

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

// ✅ Fetch blog from API (server-side)
// ✅ Use the correct base URL for server fetch
async function getBlog(id: string): Promise<Blog | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"; // adjust for prod
    const res = await fetch(`${baseUrl}/api/blogs/${id}`, {
      cache: "no-store", // SSR always fresh
    });

    if (!res.ok) return null;

    const data = await res.json();
    return data.success && data.blog ? data.blog : null;
  } catch (error) {
    console.error("Error fetching blog:", error);
    return null;
  }
}

// ✅ SEO metadata
export async function generateMetadata(props: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await props.params;
  const blog = await getBlog(id);

  if (!blog) {
    return { title: "Blog Not Found" };
  }

  return {
    title: blog.title,
    description: blog.description,
    openGraph: {
      title: blog.title,
      description: blog.description,
      images: blog.imageUrl ? BASE_URL_IMAGES + blog.imageUrl : "/hero-bg.webp",
    },
  };
}

// ✅ Blog detail page (server component)
export default async function BlogDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const blog = await getBlog(id);

  if (!blog) {
    return (
      <div className="max-w-3xl mx-auto py-16 px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-2xl font-bold text-blue-500 mb-8">وبلاگ</h2>
        <p className="text-red-500">Blog not found</p>
        <Link href="/blogs" className="text-blue-500 hover:underline mt-4 inline-block">
          Back to Blogs
        </Link>
      </div>
    );
  }

  // Sanitize HTML content
  const sanitizedContent = DOMPurify.sanitize(blog.content);

  return (
    <div className="max-w-6xl bg-white mt-28 mx-auto py-16 px-4 rounded-2xl sm:px-6 lg:px-8">
      <h1 className="text-3xl text-right font-bold text-gray-800 mb-4">{blog.title}</h1>

      <div className="mb-6">
        <div className="flex flex-col lg:flex-row lg:space-x-6 items-center">
          <img
            src={blog.imageUrl ? BASE_URL_IMAGES + blog.imageUrl : "/hero-bg.webp"}
            alt={blog.title}
            className="w-full lg:w-1/2 h-64 rounded-2xl object-cover mb-4 lg:mb-0"
          />
          <p className="w-full lg:w-1/2 text-right text-xl font-bold text-gray-700">{blog.description}</p>
        </div>
      </div>

      <div className="flex justify-between items-center text-sm text-gray-500 mb-6">
        <span>{formatDate(blog.createdAt)}</span>
      </div>

      <div className="prose prose-lg text-gray-700" dangerouslySetInnerHTML={{ __html: sanitizedContent }} />
    </div>
  );
}
