import { withAdminAuth } from "@/lib/middleware/withAdmin";
import clientPromise from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { ObjectId } from "mongodb";

// Define directories for file storage
const meditationsDir = path.join(process.cwd(), "public", "meditations");
const imagesDir = path.join(process.cwd(), "public", "images");

export const POST = withAdminAuth(async function (req: NextRequest) {
  try {
    // Parse multipart/form-data
    const formData = await req.formData();
    const title = formData.get("title")?.toString();
    const type = formData.get("type")?.toString();
    const description = formData.get("description")?.toString();
    const duration = formData.get("duration")?.toString();
    const isSuggested = formData.get("isSuggested")?.toString() === "true";
    const file = formData.get("file") as File;
    const image = formData.get("image") as File;

    // Validate input
    if (!title || !type || !file || !description || !duration) {
      return NextResponse.json({ success: false, message: "All fields are required" }, { status: 400 });
    }

    // Validate meditation type
    const validTypes = ["instrumental", "nature", "love", "calm", "sleep", "sleep-music", "story"];
    if (!validTypes.includes(type)) {
      return NextResponse.json({ success: false, message: "Invalid meditation type" }, { status: 400 });
    }

    // Ensure directories exist
    await fs.mkdir(meditationsDir, { recursive: true });
    await fs.mkdir(imagesDir, { recursive: true });

    // Generate unique filenames
    const fileExtension = path.extname(file.name) || ".mp3";
    const imageExtension = path.extname(image.name) || ".jpg";
    const uniqueFileName = `${randomUUID()}${fileExtension}`;
    const uniqueImageName = `${randomUUID()}${imageExtension}`;

    // Define file paths
    const filePath = path.join(meditationsDir, uniqueFileName);
    const imagePath = path.join(imagesDir, uniqueImageName);

    // Save files to the public directory
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const imageBuffer = Buffer.from(await image.arrayBuffer());
    await fs.writeFile(filePath, fileBuffer);
    await fs.writeFile(imagePath, imageBuffer);

    // Generate public URLs for the files
    const fileUrl = `/meditations/${uniqueFileName}`;
    const imageUrl = `/images/${uniqueImageName}`;

    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db("janaram-db");
    const collection = db.collection("meditations");

    // Insert meditation into MongoDB
    const result = await collection.insertOne({
      title,
      type,
      description,
      duration: duration,
      fileUrl,
      imageUrl,
      isSuggested,
      createdAt: new Date(),
    });

    return NextResponse.json(
      {
        success: true,
        message: "Meditation created successfully",
        meditation: {
          id: result.insertedId.toString(),
          title,
          type,
          fileUrl,
          imageUrl,
          description,
          duration: parseInt(duration),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating meditation:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
});
