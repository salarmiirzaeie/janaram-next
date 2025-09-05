import { withAdminAuth } from "@/lib/middleware/withAdmin";
import clientPromise from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { ObjectId } from "mongodb";
import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { s3 } from "@/lib/s3";

export const PUT = withAdminAuth(async function (req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = req.nextUrl.pathname.split("/").pop();
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
      // Extract file extension from file name or default to .mp3
      const fileExtension = file.name.split(".").pop()?.toLowerCase() || "mp3";
      const uniqueFileName = `${randomUUID()}.${fileExtension}`;
      const fileBuffer = Buffer.from(await file.arrayBuffer());

      const command = new PutObjectCommand({
        Bucket: process.env.LIARA_BUCKET_NAME,
        Key: `meditations/${uniqueFileName}`,
        Body: fileBuffer,
        ContentType: file.type || "audio/mpeg", // ✅ FIX
      });
      await s3.send(command);
      update.fileUrl = `/meditations/${uniqueFileName}`;
    }

    if (image) {
      // Extract image extension from file name or default to .jpg
      const imageExtension = image.name.split(".").pop()?.toLowerCase() || "jpg";
      const uniqueImageName = `${randomUUID()}.${imageExtension}`;
      const imageBuffer = Buffer.from(await image.arrayBuffer());

      const command = new PutObjectCommand({
        Bucket: process.env.LIARA_BUCKET_NAME,
        Key: `images/${uniqueImageName}`,
        Body: imageBuffer,
        ContentType: image.type || "image/jpeg", // ✅ FIX
      });
      await s3.send(command);
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

    // Delete associated files from S3
    if (meditation.fileUrl) {
      const fileKey = meditation.fileUrl.replace("/meditations/", "");
      try {
        const command = new DeleteObjectCommand({
          Bucket: process.env.LIARA_BUCKET_NAME,
          Key: `meditations/${fileKey}`,
        });
        await s3.send(command);
      } catch (error) {
        console.warn(`Failed to delete S3 file ${fileKey}:`, error);
      }
    }

    if (meditation.imageUrl) {
      const imageKey = meditation.imageUrl.replace("/images/", "");
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
