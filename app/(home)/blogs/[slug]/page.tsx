import DOMPurify from "isomorphic-dompurify";
import { BASE_URL_IMAGES } from "@/lib/constants";
import { formatDate } from "@/lib/time";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";

// Blog interface
interface Blog {
  _id: string;
  slug: string;
  title: string;
  content: string;
  authorId: string;
  imageUrl: string;
  createdAt: string;
  updatedAt: string;
  description: string;
}

// Fetch blog (server-side)
async function getBlog(slug: string): Promise<Blog | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/blogs/${slug}`, { cache: "force-cache" });
    if (!res.ok) return null;
    const data = await res.json();
    return data.success && data.blog ? data.blog : null;
  } catch (err) {
    console.error(err);
    return null;
  }
}

// SEO metadata
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const blog = await getBlog(slug);
  if (!blog) return { title: "Blog Not Found" };

  const url = `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/blogs/${slug}`;

  return {
    title: blog.title,
    description: blog.description,
    openGraph: {
      title: blog.title,
      description: blog.description,
      url,
      type: "article",
      images: blog.imageUrl ? [BASE_URL_IMAGES + blog.imageUrl] : ["/hero-bg.webp"],
    },
    twitter: {
      card: "summary_large_image",
      title: blog.title,
      description: blog.description,
      images: blog.imageUrl ? [BASE_URL_IMAGES + blog.imageUrl] : ["/hero-bg.webp"],
    },
    alternates: {
      canonical: url,
    },
  };
}

// Blog page (SSR)
export default async function BlogDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const blog = await getBlog(slug);

  if (!blog) {
    return (
      <div className="max-w-3xl mx-auto py-16 px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-2xl font-bold text-blue-500 mb-8">وبلاگ</h2>
        <p className="text-red-500">مقاله پیدا نشد</p>
        <Link href="/blogs" className="text-blue-500 hover:underline mt-4 inline-block">
          بازگشت به وبلاگ
        </Link>
      </div>
    );
  }

  const sanitizedContent = DOMPurify.sanitize(blog.content);

  return (
    <article className="max-w-6xl min-h-screen bg-white mt-28 mx-auto py-16 px-4 rounded-2xl sm:px-6 lg:px-8">
      <header>
        <h1 className="text-3xl text-right font-bold text-gray-800 mb-4">{blog.title}</h1>

        <div className="mb-6 flex flex-col lg:flex-row lg:space-x-6 items-center">
          <div className="w-full lg:w-1/2 relative h-64 mb-4 lg:mb-0 rounded-2xl overflow-hidden">
            <img
              src={blog.imageUrl ? BASE_URL_IMAGES + blog.imageUrl : "/hero-bg.webp"}
              alt={blog.title}
              className="object-cover"
            />
          </div>
          <p className="w-full lg:w-1/2 text-right text-xl font-bold text-gray-700">{blog.description}</p>
        </div>

        <div className="flex justify-between items-center text-sm text-gray-500 mb-6">
          <span>تاریخ انتشار: {formatDate(blog.createdAt)}</span>
        </div>
      </header>

      <section className="prose prose-lg text-gray-700" dangerouslySetInnerHTML={{ __html: sanitizedContent }} />

      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            headline: blog.title,
            image: blog.imageUrl ? BASE_URL_IMAGES + blog.imageUrl : "/hero-bg.webp",
            author: { "@type": "Person", name: "جانارام" },
            datePublished: blog.createdAt,
            dateModified: blog.updatedAt,
            description: blog.description,
            mainEntityOfPage: {
              "@type": "WebPage",
              "@id": `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/blogs/${blog.slug}`,
            },
          }),
        }}
      />
    </article>
  );
}
