import { withAdminAuth } from "@/lib/middleware/withAdmin";
import clientPromise from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3 } from "@/lib/s3"; // your S3 client instance
import { breathingDetails, breathingTypes } from "@/lib/mood";

export const POST = withAdminAuth(async function (req: NextRequest) {
  try {
    const formData = await req.formData();
    const title = formData.get("title")?.toString();
    const type = formData.get("type")?.toString();
    const duration = formData.get("duration")?.toString();
    const isPremium = formData.get("isPremium")?.toString() as "true" | "false"; // 👈 new
    const file = formData.get("file") as File;
    const image = formData.get("image") as File;

    // Validate input
    if (!title || !type || !file || !duration || !image || !isPremium) {
      return NextResponse.json(
        { success: false, message: "All fields are required" },
        { status: 400 }
      );
    }

    const validTypes = breathingTypes;
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { success: false, message: "Invalid breathing type" },
        { status: 400 }
      );
    }

    const validAccessLevels = ["true", "false"];
    if (!validAccessLevels.includes(isPremium)) {
      return NextResponse.json(
        { success: false, message: "Invalid access level" },
        { status: 400 }
      );
    }

    // Generate unique file names
    const fileExtension = file.name.split(".").pop()?.toLowerCase() || "mp3";
    const imageExtension = image.name.split(".").pop()?.toLowerCase() || "jpg";
    const uniqueFileName = `breathings/${randomUUID()}.${fileExtension}`;
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
    const collection = db.collection("breathing");
    const isPro = isPremium === "true" ? true : false;

    const result = await collection.insertOne({
      title,
      type,
      description: breathingDetails[type].description,
      duration,
      url: fileUrl,
      imageUrl,
      isPremium: isPro,
      createdAt: new Date(),
      inhaleDuration: breathingDetails[type].inhaleDuration,
      holdDuration: breathingDetails[type].holdDuration,
      exhaleDuration: breathingDetails[type].exhaleDuration,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Breathing created successfully",
        meditation: {
          id: result.insertedId.toString(),
          title,
          type,
          fileUrl,
          imageUrl,
          duration: parseInt(duration),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating breathing:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
});
