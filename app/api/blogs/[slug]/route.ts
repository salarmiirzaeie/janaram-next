// app/api/blogs/[slug]/route.ts
import clientPromise from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const { slug } = params;

  if (!slug) {
    console.error("Missing slug");
    return NextResponse.json({ success: false, message: "Missing slug" }, { status: 400 });
  }

  try {
    const client = await clientPromise;
    const db = client.db("janaram-db");
    const collection = db.collection("blogs");

    // جستجو بر اساس slug
    const blog = await collection.findOne({ slug });
    if (!blog) {
      console.error("Blog not found for slug:", slug);
      return NextResponse.json({ success: false, message: "Blog not found" }, { status: 404 });
    }

    return NextResponse.json(
      {
        success: true,
        blog: {
          _id: blog._id.toString(),
          slug: blog.slug,
          title: blog.title,
          description: blog.description,
          content: blog.content,
          authorId: blog.authorId?.toString(),
          imageUrl: blog.imageUrl,
          createdAt: blog.createdAt?.toISOString(),
          updatedAt: blog.updatedAt?.toISOString(),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching blog:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
