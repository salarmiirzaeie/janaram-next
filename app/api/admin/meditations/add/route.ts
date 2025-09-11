import { withAdminAuth } from "@/lib/middleware/withAdmin";
import clientPromise from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { sendToAll } from "@/lib/notifications";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
const sw3client = new S3Client({
  region: "default",
  endpoint: process.env.LIARA_ENDPOINT || "",
  credentials: {
    accessKeyId: process.env.LIARA_ACCESS_KEY || "",
    secretAccessKey: process.env.LIARA_SECRET_KEY || "",
  },
});
const params = {
  Body: "<Binary String>",
  Bucket: process.env.LIARA_BUCKET_NAME,
  Key: "objectkey",
};
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

    // Generate file extensions from file names
    const fileExtension = file.name.split(".").pop()?.toLowerCase() || "mp3";
    const imageExtension = image.name.split(".").pop()?.toLowerCase() || "jpg";
    const uniqueFileName = `meditations/${randomUUID()}.${fileExtension}`;
    const uniqueImageName = `images/${randomUUID()}.${imageExtension}`;

    // Convert files to buffers
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const imageBuffer = Buffer.from(await image.arrayBuffer());

    // Upload files to Liara S3
    const bucketName = process.env.LIARA_BUCKET_NAME || "janaram";

    await sw3client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: uniqueFileName,
        Body: fileBuffer,
        ContentType: file.type,
        ACL: "public-read", // Make file publicly accessible
      })
    );

    // Upload image file
    await sw3client
      .send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: uniqueImageName,
          Body: imageBuffer,
          ContentType: image.type,
          ACL: "public-read", // Make image publicly accessible
        })
      )
      .then((res) => {
        console.log(res, "k");
      });

    // Generate public URLs for the files
    const fileUrl = `${process.env.LIARA_ENDPOINT}/${bucketName}/${uniqueFileName}`;
    const imageUrl = `${process.env.LIARA_ENDPOINT}/${bucketName}/${uniqueImageName}`;

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
