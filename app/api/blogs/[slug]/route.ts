import clientPromise from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";

interface Context {
  params: {
    slug: string;
  };
}

export async function GET(req: NextRequest, { params }: Context) {
  try {
    const { slug } = params;

    if (!slug) {
      console.error("Missing slug");
      return NextResponse.json({ success: false, message: "Missing slug" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("janaram-db");
    const collection = db.collection("blogs");

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
          title: blog.title,
          slug: blog.slug,
          content: blog.content,
          authorId: blog.authorId.toString(),
          imageUrl: blog.imageUrl,
          createdAt: blog.createdAt.toISOString(),
          updatedAt: blog.updatedAt.toISOString(),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching blog:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
