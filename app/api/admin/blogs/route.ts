import { withAdminAuth } from "@/lib/middleware/withAdmin";
import clientPromise from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { ObjectId, Sort } from "mongodb";
import { generateUniqueSlug } from "@/lib/slugify";

// Define directory for image storage
const imagesDir = path.join(process.cwd(), "public", "images");

export const POST = withAdminAuth(async function (req: NextRequest) {
  try {
    // Parse multipart/form-data
    const formData = await req.formData();
    const title = formData.get("title")?.toString();
    const content = formData.get("content")?.toString();
    const authorId = formData.get("authorId")?.toString();
    const image = formData.get("image") as File;

    // Validate input
    if (!title || !content || !authorId || !image) {
      return NextResponse.json({ success: false, message: "All fields are required" }, { status: 400 });
    }
    if (!ObjectId.isValid(authorId)) {
      return NextResponse.json({ success: false, message: "Invalid authorId" }, { status: 400 });
    }

    // Generate unique slug
    const slug = await generateUniqueSlug(title);

    // Ensure images directory exists
    await fs.mkdir(imagesDir, { recursive: true });

    // Generate unique filename for image
    const imageExtension = path.extname(image.name) || ".jpg";
    const uniqueImageName = `${randomUUID()}${imageExtension}`;
    const imagePath = path.join(imagesDir, uniqueImageName);

    // Save image to public directory
    const imageBuffer = Buffer.from(await image.arrayBuffer());
    await fs.writeFile(imagePath, imageBuffer);

    // Generate public URL for the image
    const imageUrl = `/images/${uniqueImageName}`;

    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db("janaram-db");
    const collection = db.collection("blogs");

    // Insert blog into MongoDB
    const result = await collection.insertOne({
      title,
      slug,
      content,
      authorId: new ObjectId(authorId),
      imageUrl,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json(
      {
        success: true,
        message: "Blog created successfully",
        blog: {
          _id: result.insertedId.toString(),
          title,
          slug,
          content,
          authorId,
          imageUrl,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating blog:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
});

export const GET = withAdminAuth(async function (req: NextRequest) {
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
      slug: blog.slug,
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
});
