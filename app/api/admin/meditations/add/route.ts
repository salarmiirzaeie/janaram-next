import { withAdminAuth } from "@/lib/middleware/withAdmin";
import clientPromise from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3 } from "@/lib/s3"; // your S3 client instance
import { sendToAll } from "@/lib/notifications";

export const POST = withAdminAuth(async function (req: NextRequest) {
  try {
    const formData = await req.formData();
    const title = formData.get("title")?.toString();
    const type = formData.get("type")?.toString();
    const description = formData.get("description")?.toString();
    const duration = formData.get("duration")?.toString();
    const isSuggested = formData.get("isSuggested")?.toString() === "true";
    const file = formData.get("file") as File;
    const image = formData.get("image") as File;

    // Validate input
    if (!title || !type || !file || !description || !duration || !image) {
      return NextResponse.json({ success: false, message: "All fields are required" }, { status: 400 });
    }

    const validTypes = ["instrumental", "nature", "love", "calm", "sleep", "sleep-music", "story"];
    if (!validTypes.includes(type)) {
      return NextResponse.json({ success: false, message: "Invalid meditation type" }, { status: 400 });
    }

    // Generate unique file names
    const fileExtension = file.name.split(".").pop()?.toLowerCase() || "mp3";
    const imageExtension = image.name.split(".").pop()?.toLowerCase() || "jpg";
    const uniqueFileName = `meditations/${randomUUID()}.${fileExtension}`;
    const uniqueImageName = `images/${randomUUID()}.${imageExtension}`;

    // Convert files to buffers
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const imageBuffer = Buffer.from(await image.arrayBuffer());

    const bucketName = process.env.LIARA_BUCKET_NAME;

    // Upload audio
    await s3.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: uniqueFileName,
        Body: fileBuffer,
        ContentType: file.type,
      })
    );

    // Upload image
    await s3.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: uniqueImageName,
        Body: imageBuffer,
        ContentType: image.type,
      })
    );

    const fileUrl = `/${uniqueFileName}`;
    const imageUrl = `/${uniqueImageName}`;

    // Insert into MongoDB
    const client = await clientPromise;
    const db = client.db("janaram-db");
    const collection = db.collection("meditations");

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
    await sendToAll({
      title: "مدیتیشن جدید اضافه شد 🧘‍♂️",
      body: type === "story" ? `قصه جدید ${title} اضافه شد` : `مدیتیشن جدید ${title} اضافه شد`,
      data: {
        meditationId: result.insertedId.toString(),
        type,
      },
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
          isSuggested,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating meditation:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
});
