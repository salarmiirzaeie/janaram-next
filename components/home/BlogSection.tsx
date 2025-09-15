// app/components/BlogSection.tsx
import Link from "next/link";
import BlogCardHome from "./BlogCardHome";
import clientPromise from "@/lib/mongodb";

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

// ✅ Server-side fetch directly from MongoDB
async function getBlogs(): Promise<Blog[]> {
  try {
    const client = await clientPromise;
    const db = client.db("janaram-db");
    const blogs = await db.collection("blogs").find({}).sort({ createdAt: -1 }).limit(3).toArray();

    return blogs.map((b) => ({
      _id: b._id.toString(),
      title: b.title,
      content: b.content,
      authorId: b.authorId?.toString() || "",
      imageUrl: b.imageUrl || "/hero-bg.webp",
      createdAt: b.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: b.updatedAt?.toISOString() || new Date().toISOString(),
      slug: b.slug,
    }));
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
                post_name={post.slug}
                key={post._id}
                imageSrc={post.imageUrl}
                title={post.title}
                summary={post.content.slice(0, 250)}
                author="Unknown Author"
                date={post.createdAt.split("T")[0]}
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
