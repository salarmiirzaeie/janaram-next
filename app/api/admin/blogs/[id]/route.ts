// app/api/blogs/[slug]/route.ts
import { withAdminAuth } from "@/lib/middleware/withAdmin";
import clientPromise from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { s3 } from "@/lib/s3";
import { createSlug } from "@/lib/createSlug";
import { ObjectId } from "mongodb";

export const GET = withAdminAuth(async function (req: NextRequest) {
  try {
    const id = req.nextUrl.pathname.split("/").pop();
    if (!id) {
      return NextResponse.json({ success: false, message: "Invalid blog slug" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("janaram-db");
    const collection = db.collection("blogs");

    const blog = await collection.findOne({ _id: new ObjectId(id) });
    if (!blog) return NextResponse.json({ success: false, message: "Blog not found" }, { status: 404 });

    return NextResponse.json(
      {
        success: true,
        blog: {
          _id: blog._id.toString(),
          slug: blog.slug,
          title: blog.title,
          content: blog.content,
          authorId: blog.authorId.toString(),
          imageUrl: blog.imageUrl,
          createdAt: blog.createdAt.toISOString(),
          updatedAt: blog.updatedAt.toISOString(),
          description: blog.description,
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
    const id = req.nextUrl.pathname.split("/").pop();
    if (!id) {
      return NextResponse.json({ success: false, message: "Invalid blog slug" }, { status: 400 });
    }

    const formData = await req.formData();
    const title = formData.get("title")?.toString();
    const content = formData.get("content")?.toString();
    const description = formData.get("description")?.toString();
    const image = formData.get("image") as File | null;

    if (!title && !content && !image) {
      return NextResponse.json({ success: false, message: "At least one field is required" }, { status: 400 });
    }

    const updateFields: {
      title?: string;
      content?: string;
      imageUrl?: string;
      updatedAt: Date;
      description?: string;
      slug?: string;
    } = {
      updatedAt: new Date(),
    };
    if (title) {
      updateFields.title = title;
      updateFields.slug = createSlug(title); // ✅ ایجاد slug جدید
    }
    if (content) updateFields.content = content;
    if (description) updateFields.description = description;

    if (image) {
      const imageExtension = image.name.split(".").pop()?.toLowerCase() || "jpg";
      const uniqueImageName = `${randomUUID()}.${imageExtension}`;
      const imageBuffer = Buffer.from(await image.arrayBuffer());
      await s3.send(
        new PutObjectCommand({
          Bucket: process.env.LIARA_BUCKET_NAME,
          Key: `images/${uniqueImageName}`,
          Body: imageBuffer,
        })
      );
      updateFields.imageUrl = `/images/${uniqueImageName}`;
    }
    console.log("object");
    const client = await clientPromise;
    const db = client.db("janaram-db");
    const collection = db.collection("blogs");

    const result = await collection.updateOne({ _id: new ObjectId(id) }, { $set: updateFields });
    if (result.matchedCount === 0)
      return NextResponse.json({ success: false, message: "Blog not found" }, { status: 404 });

    return NextResponse.json({ success: true, message: "Blog updated successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error updating blog:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
});

export const DELETE = withAdminAuth(async function (req: NextRequest) {
  try {
    const id = req.nextUrl.pathname.split("/").pop();
    if (!id) {
      return NextResponse.json({ success: false, message: "Invalid blog slug" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("janaram-db");
    const collection = db.collection("blogs");

    const blog = await collection.findOne({ _id: new ObjectId(id) });
    if (!blog) return NextResponse.json({ success: false, message: "Blog not found" }, { status: 404 });

    // حذف تصویر از S3
    if (blog.imageUrl) {
      const imageKey = blog.imageUrl.replace("/images/", "");
      try {
        const command = new DeleteObjectCommand({
          Bucket: process.env.LIARA_BUCKET_NAME,
          Key: `images/${imageKey}`,
        });
        await s3.send(command);
      } catch (error) {
        console.warn(`Failed to delete S3 image ${imageKey}:`, error);
      }
    }

    const result = await collection.deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0)
      return NextResponse.json({ success: false, message: "Blog not found" }, { status: 404 });

    return NextResponse.json({ success: true, message: "Blog deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting blog:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
});
