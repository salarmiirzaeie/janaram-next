import { withAdminAuth } from "@/lib/middleware/withAdmin";
import clientPromise from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { ObjectId } from "mongodb";
import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { s3 } from "@/lib/s3";

import { breathingDetails, breathingTypes } from "@/lib/mood";

export const PUT = withAdminAuth(async function (req: NextRequest) {
  try {
    const id = req.nextUrl.pathname.split("/").pop();
    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid breathing ID" },
        { status: 400 }
      );
    }

    const formData = await req.formData();
    const title = formData.get("title")?.toString();
    const type = formData.get("type")?.toString();
    const duration = formData.get("duration")?.toString();
    const isPremium = formData.get("isPremium")?.toString();
    const file = formData.get("file") as File | null;
    const image = formData.get("image") as File | null;

    if (!title && !type && !duration && !file && !image && !isPremium) {
      return NextResponse.json(
        { success: false, message: "At least one field must be provided" },
        { status: 400 }
      );
    }

    if (type && !breathingTypes.includes(type)) {
      return NextResponse.json(
        { success: false, message: "Invalid breathing type" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("janaram-db");
    const collection = db.collection("breathing");

    const breathing = await collection.findOne({ _id: new ObjectId(id) });
    if (!breathing) {
      return NextResponse.json(
        { success: false, message: "Breathing not found" },
        { status: 404 }
      );
    }

    const update: any = {};
    if (title) update.title = title;
    if (duration) update.duration = duration;
    if (isPremium !== undefined) update.isPremium = isPremium === "true";

    if (type) {
      update.type = type;
      update.inhaleDuration = breathingDetails[type].inhaleDuration;
      update.holdDuration = breathingDetails[type].holdDuration;
      update.exhaleDuration = breathingDetails[type].exhaleDuration;
      update.description = breathingDetails[type].description;
    }

    const bucketName = process.env.LIARA_BUCKET_NAME!;

    // 🔊 update audio
    if (file) {
      if (breathing.url) {
        const oldKey = breathing.url.replace("/", "");
        await s3.send(
          new DeleteObjectCommand({ Bucket: bucketName, Key: oldKey })
        );
      }

      const ext = file.name.split(".").pop() || "mp3";
      const key = `breathings/${randomUUID()}.${ext}`;

      await s3.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: key,
          Body: Buffer.from(await file.arrayBuffer()),
          ContentType: file.type,
        })
      );

      update.url = `/${key}`;
    }

    // 🖼 update image
    if (image) {
      if (breathing.imageUrl) {
        const oldKey = breathing.imageUrl.replace("/", "");
        await s3.send(
          new DeleteObjectCommand({ Bucket: bucketName, Key: oldKey })
        );
      }

      const ext = image.name.split(".").pop() || "jpg";
      const key = `images/${randomUUID()}.${ext}`;

      await s3.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: key,
          Body: Buffer.from(await image.arrayBuffer()),
          ContentType: image.type,
        })
      );

      update.imageUrl = `/${key}`;
    }

    await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { ...update, updatedAt: new Date() } }
    );

    const updatedBreathing = await collection.findOne({
      _id: new ObjectId(id),
    });

    return NextResponse.json(
      {
        success: true,
        message: "Breathing updated successfully",
        breathing: updatedBreathing,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating breathing:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
});

export const DELETE = withAdminAuth(async function (req: NextRequest) {
  try {
    const id = req.nextUrl.pathname.split("/").pop();
    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid meditation ID" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("janaram-db");
    const collection = db.collection("breathing");

    const breathing = await collection.findOne({ _id: new ObjectId(id) });
    if (!breathing)
      return NextResponse.json(
        { success: false, message: "Meditation not found" },
        { status: 404 }
      );

    const bucketName = process.env.LIARA_BUCKET_NAME!;

    // Delete files from S3
    if (breathing.url) {
      const key = breathing.url.split("/").pop();
      if (key)
        await s3.send(
          new DeleteObjectCommand({ Bucket: bucketName, Key: key })
        );
    }
    if (breathing.imageUrl) {
      const key = breathing.imageUrl.split("/").pop();
      if (key)
        await s3.send(
          new DeleteObjectCommand({ Bucket: bucketName, Key: key })
        );
    }

    await collection.deleteOne({ _id: new ObjectId(id) });

    return NextResponse.json(
      { success: true, message: "Meditation deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting meditation:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
});
