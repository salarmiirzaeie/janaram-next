import clientPromise from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    if (!id) {
      console.error("Missing id");
      return NextResponse.json({ success: false, message: "Missing id" }, { status: 400 });
    }

    // Validate ObjectId
    if (!ObjectId.isValid(id)) {
      console.error("Invalid ObjectId:", id);
      return NextResponse.json({ success: false, message: "Invalid id format" }, { status: 400 });
    }

    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db("janaram-db");
    const collection = db.collection("blogs");

    // Fetch single blog by _id
    const blog = await collection.findOne({ _id: new ObjectId(id) });
    if (!blog) {
      console.error("Blog not found for id:", id);
      return NextResponse.json({ success: false, message: "Blog not found" }, { status: 404 });
    }

    return NextResponse.json(
      {
        success: true,
        blog: {
          _id: blog._id.toString(),
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
