import { withAdminAuth } from "@/lib/middleware/withAdmin";
import clientPromise from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { ObjectId } from "mongodb";
import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { s3 } from "@/lib/s3";

export const PUT = withAdminAuth(async function (req: NextRequest) {
  try {
    const id = req.nextUrl.pathname.split("/").pop();
    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: "Invalid meditation ID" }, { status: 400 });
    }

    const formData = await req.formData();
    const title = formData.get("title")?.toString();
    const type = formData.get("type")?.toString();
    const description = formData.get("description")?.toString();
    const duration = formData.get("duration")?.toString();
    const isSuggested = formData.get("isSuggested")?.toString() === "true";
    const file = formData.get("file") as File | null;
    const image = formData.get("image") as File | null;

    if (!title && !type && !description && !duration && !file && !image) {
      return NextResponse.json({ success: false, message: "At least one field must be provided" }, { status: 400 });
    }

    if (type) {
      const validTypes = ["instrumental", "nature", "love", "calm", "sleep", "sleep-music", "story"];
      if (!validTypes.includes(type)) {
        return NextResponse.json({ success: false, message: "Invalid meditation type" }, { status: 400 });
      }
    }

    const client = await clientPromise;
    const db = client.db("janaram-db");
    const collection = db.collection("meditations");

    const meditation = await collection.findOne({ _id: new ObjectId(id) });
    if (!meditation) return NextResponse.json({ success: false, message: "Meditation not found" }, { status: 404 });

    const update: any = {};
    if (title) update.title = title;
    if (type) update.type = type;
    if (description) update.description = description;
    if (duration) update.duration = duration;
    if (isSuggested !== undefined) update.isSuggested = isSuggested;

    const bucketName = process.env.LIARA_BUCKET_NAME!;
    const endpoint = process.env.LIARA_ENDPOINT?.replace(/\/$/, "");

    // Handle new audio file
    if (file) {
      // Delete old file from S3
      if (meditation.fileUrl) {
        const oldKey = meditation.fileUrl.split("/").pop();
        if (oldKey) {
          await s3.send(new DeleteObjectCommand({ Bucket: bucketName, Key: oldKey }));
        }
      }

      const fileExtension = file.name.split(".").pop() || "mp3";
      const uniqueFileName = `meditations/${randomUUID()}.${fileExtension}`;
      const fileBuffer = Buffer.from(await file.arrayBuffer());

      await s3.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: uniqueFileName,
          Body: fileBuffer,
          ContentType: file.type,
        })
      );

      update.fileUrl = `/${uniqueFileName}`;
    }

    // Handle new image file
    if (image) {
      if (meditation.imageUrl) {
        const oldKey = meditation.imageUrl.split("/").pop();
        if (oldKey) {
          await s3.send(new DeleteObjectCommand({ Bucket: bucketName, Key: oldKey }));
        }
      }

      const imageExtension = image.name.split(".").pop() || "jpg";
      const uniqueImageName = `images/${randomUUID()}.${imageExtension}`;
      const imageBuffer = Buffer.from(await image.arrayBuffer());

      await s3.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: uniqueImageName,
          Body: imageBuffer,
          ContentType: image.type,
        })
      );

      update.imageUrl = `/${uniqueImageName}`;
    }

    // Update in MongoDB
    await collection.updateOne({ _id: new ObjectId(id) }, { $set: { ...update, updatedAt: new Date() } });
    const updatedMeditation = await collection.findOne({ _id: new ObjectId(id) });

    return NextResponse.json(
      {
        success: true,
        message: "Meditation updated successfully",
        meditation: updatedMeditation,
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

    const client = await clientPromise;
    const db = client.db("janaram-db");
    const collection = db.collection("meditations");

    const meditation = await collection.findOne({ _id: new ObjectId(id) });
    if (!meditation) return NextResponse.json({ success: false, message: "Meditation not found" }, { status: 404 });

    const bucketName = process.env.LIARA_BUCKET_NAME!;

    // Delete files from S3
    if (meditation.fileUrl) {
      const key = meditation.fileUrl.split("/").pop();
      if (key) await s3.send(new DeleteObjectCommand({ Bucket: bucketName, Key: key }));
    }
    if (meditation.imageUrl) {
      const key = meditation.imageUrl.split("/").pop();
      if (key) await s3.send(new DeleteObjectCommand({ Bucket: bucketName, Key: key }));
    }

    await collection.deleteOne({ _id: new ObjectId(id) });

    return NextResponse.json({ success: true, message: "Meditation deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting meditation:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
});
