import { withAdminAuth } from "@/lib/middleware/withAdmin";
import clientPromise from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { ObjectId } from "mongodb";
const meditationsDir = path.join(process.cwd(), "public", "meditations");
const imagesDir = path.join(process.cwd(), "public", "images");

export const PUT = withAdminAuth(async function (req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = req.nextUrl.pathname.split("/").pop(); // Extract ID from URL
    console.log(id);
    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: "Invalid meditation ID" }, { status: 400 });
    }

    // Parse multipart/form-data
    const formData = await req.formData();
    const title = formData.get("title")?.toString();
    const type = formData.get("type")?.toString();
    const description = formData.get("description")?.toString();
    const duration = formData.get("duration")?.toString();
    const isSuggested = formData.get("isSuggested")?.toString() === "true";
    const file = formData.get("file") as File | null;
    const image = formData.get("image") as File | null;

    // Validate input
    if (!title && !type && !description && !duration && !file && !image) {
      return NextResponse.json({ success: false, message: "At least one field must be provided" }, { status: 400 });
    }

    // Validate meditation type if provided
    if (type) {
      const validTypes = ["instrumental", "nature", "love", "calm", "sleep", "sleep-music", "story"];
      if (!validTypes.includes(type)) {
        return NextResponse.json({ success: false, message: "Invalid meditation type" }, { status: 400 });
      }
    }

    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db("janaram-db");
    const collection = db.collection("meditations");

    // Prepare update object
    const update: any = {};
    if (title) update.title = title;
    if (type) update.type = type;
    if (description) update.description = description;
    if (duration) update.duration = parseInt(duration);
    if (isSuggested !== undefined) update.isSuggested = isSuggested;

    // Handle file uploads if provided
    if (file) {
      const fileExtension = path.extname(file.name) || ".mp3";
      const uniqueFileName = `${randomUUID()}${fileExtension}`;
      const filePath = path.join(meditationsDir, uniqueFileName);
      const fileBuffer = Buffer.from(await file.arrayBuffer());
      await fs.writeFile(filePath, fileBuffer);
      update.fileUrl = `/meditations/${uniqueFileName}`;
    }
    if (image) {
      const imageExtension = path.extname(image.name) || ".jpg";
      const uniqueImageName = `${randomUUID()}${imageExtension}`;
      const imagePath = path.join(imagesDir, uniqueImageName);
      const imageBuffer = Buffer.from(await image.arrayBuffer());
      await fs.writeFile(imagePath, imageBuffer);
      update.imageUrl = `/images/${uniqueImageName}`;
    }

    // Update meditation in MongoDB
    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { ...update, updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ success: false, message: "Meditation not found" }, { status: 404 });
    }

    // Fetch the updated meditation
    const updatedMeditation = await collection.findOne({ _id: new ObjectId(id) });

    if (!updatedMeditation) {
      return NextResponse.json({ success: false, message: "Meditation not found" }, { status: 404 });
    }

    return NextResponse.json(
      {
        success: true,
        message: "Meditation updated successfully",
        meditation: {
          id: id,
          title: updatedMeditation.title,
          type: updatedMeditation.type,
          fileUrl: updatedMeditation.fileUrl,
          imageUrl: updatedMeditation.imageUrl,
          description: updatedMeditation.description,
          duration: updatedMeditation.duration,
          isSuggested: updatedMeditation.isSuggested,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating meditation:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
});
export const DELETE = withAdminAuth(async function (req: NextRequest) {
  try {
    const id = req.nextUrl.pathname.split("/").pop();
    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: "Invalid meditation ID" }, { status: 400 });
    }

    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db("janaram-db");
    const collection = db.collection("meditations");

    // Find the meditation to get file paths
    const meditation = await collection.findOne({ _id: new ObjectId(id) });
    if (!meditation) {
      return NextResponse.json({ success: false, message: "Meditation not found" }, { status: 404 });
    }

    // Delete associated files
    if (meditation.fileUrl) {
      const filePath = path.join(process.cwd(), "public", meditation.fileUrl);
      try {
        await fs.unlink(filePath);
      } catch (error) {
        console.warn(`Failed to delete file ${filePath}:`, error);
      }
    }
    if (meditation.imageUrl) {
      const imagePath = path.join(process.cwd(), "public", meditation.imageUrl);
      try {
        await fs.unlink(imagePath);
      } catch (error) {
        console.warn(`Failed to delete image ${imagePath}:`, error);
      }
    }

    // Delete meditation from MongoDB
    const result = await collection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json({ success: false, message: "Meditation not found" }, { status: 404 });
    }

    return NextResponse.json(
      {
        success: true,
        message: "Meditation deleted successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting meditation:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
});
