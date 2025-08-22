import { withAdminAuth } from "@/lib/middleware/withAdmin";
import clientPromise from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { ObjectId } from "mongodb";
import { generateUniqueSlug } from "@/lib/slugify";

// Define directory for image storage
const imagesDir = path.join(process.cwd(), "public", "images");

export const GET = withAdminAuth(async function (req: NextRequest) {
  try {
    const id = req.nextUrl.pathname.split("/").pop(); // Extract ID from URL

    if (!id || !ObjectId.isValid(id)) {
      console.error("Invalid blog ID:", id);
      return NextResponse.json({ success: false, message: "Invalid blog ID" }, { status: 400 });
    }

    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db("janaram-db");
    const collection = db.collection("blogs");

    // Fetch single blog
    const blog = await collection.findOne({ _id: new ObjectId(id) });
    if (!blog) {
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
});

export const PUT = withAdminAuth(async function (req: NextRequest) {
  try {
    const id = req.nextUrl.pathname.split("/").pop(); // Extract ID from URL

    const formData = await req.formData();
    const title = formData.get("title")?.toString();
    const content = formData.get("content")?.toString();
    const image = formData.get("image") as File;

    // Log FormData for debugging
    console.log("PUT FormData entries:");
    for (const pair of formData.entries()) {
      console.log(`${pair[0]}: ${pair[1]}`);
    }

    if (!id || !ObjectId.isValid(id)) {
      console.error("Invalid blog ID:", id);
      return NextResponse.json({ success: false, message: "Invalid blog ID" }, { status: 400 });
    }
    if (!title && !content && !image) {
      console.error("No fields provided for update");
      return NextResponse.json(
        { success: false, message: "At least one field (title, content, or image) is required" },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db("janaram-db");
    const collection = db.collection("blogs");

    // Prepare update fields
    const updateFields: { title?: string; slug?: string; content?: string; imageUrl?: string; updatedAt: Date } = {
      updatedAt: new Date(),
    };
    if (title) {
      updateFields.title = title;
      updateFields.slug = await generateUniqueSlug(title);
    }
    if (content) updateFields.content = content;

    // Handle image update if provided
    if (image) {
      await fs.mkdir(imagesDir, { recursive: true });
      const imageExtension = path.extname(image.name) || ".jpg";
      const uniqueImageName = `${randomUUID()}${imageExtension}`;
      const imagePath = path.join(imagesDir, uniqueImageName);
      const imageBuffer = Buffer.from(await image.arrayBuffer());
      await fs.writeFile(imagePath, imageBuffer);
      updateFields.imageUrl = `/images/${uniqueImageName}`;
    }

    // Update blog
    const result = await collection.updateOne({ _id: new ObjectId(id) }, { $set: updateFields });

    if (result.matchedCount === 0) {
      console.error("Blog not found for ID:", id);
      return NextResponse.json({ success: false, message: "Blog not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Blog updated successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error updating blog:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
});

export const DELETE = withAdminAuth(async function (req: NextRequest) {
  try {
    const id = req.nextUrl.pathname.split("/").pop(); // Extract ID from URL

    if (!id || !ObjectId.isValid(id)) {
      console.error("Invalid blog ID:", id);
      return NextResponse.json({ success: false, message: "Invalid blog ID" }, { status: 400 });
    }

    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db("janaram-db");
    const collection = db.collection("blogs");

    // Delete blog
    const result = await collection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      console.error("Blog not found for ID:", id);
      return NextResponse.json({ success: false, message: "Blog not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Blog deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting blog:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
});
