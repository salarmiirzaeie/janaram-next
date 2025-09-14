// app/components/BlogSection.tsx
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
}

// ✅ Server-side fetch (last 3 blogs)
async function getBlogs(): Promise<Blog[]> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/blogs?sort=createdAt&limit=3`, {
      cache: "no-store", // SSR always fresh
    });

    if (!res.ok) return [];
    const data = await res.json();
    return data.blogs || [];
  } catch (error) {
    console.error("Error fetching blogs:", error);
    return [];
  }
}

export default async function BlogSection() {
  const blogs = await getBlogs();

  return (
    <div className="border-b border-gray-200">
      <div className="max-w-6xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <h2 className="text-xl font-bold text-blue-500 text-center mb-8">وبلاگ</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {blogs.length === 0 ? (
            <p className="text-center text-gray-500">هیچ مقاله‌ای موجود نیست.</p>
          ) : (
            blogs.map((post) => (
              <BlogCardHome
                post_name={post._id}
                key={post._id}
                imageSrc={post.imageUrl || "/hero-bg.webp"}
                title={post.title}
                summary={post.content.slice(0, 250)}
                author="Unknown Author"
                date={new Date(post.createdAt).toISOString().split("T")[0]}
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
}
