import clientPromise from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { ObjectId, Sort } from "mongodb";

export const GET = async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const sort = searchParams.get("sort");
    const limit = parseInt(searchParams.get("limit") || "0", 10);

    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db("janaram-db");
    const collection = db.collection("blogs");

    // Build query options
    const queryOptions: { sort?: Sort; limit?: number } = {};
    if (sort === "createdAt") {
      queryOptions.sort = { createdAt: -1 }; // Sort by createdAt descending
    }
    if (limit > 0) {
      queryOptions.limit = limit;
    }

    // Fetch blogs
    const blogs = await collection
      .find({})
      .sort(queryOptions.sort || {})
      .limit(queryOptions.limit || 0)
      .toArray();
    const formattedBlogs = blogs.map((blog) => ({
      _id: blog._id.toString(),
      title: blog.title,
      content: blog.content,
      authorId: blog.authorId.toString(),
      imageUrl: blog.imageUrl,
      createdAt: blog.createdAt.toISOString(),
      updatedAt: blog.updatedAt.toISOString(),
    }));

    return NextResponse.json({ success: true, blogs: formattedBlogs }, { status: 200 });
  } catch (error) {
    console.error("Error fetching blogs:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
};
