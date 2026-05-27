import { NextRequest, NextResponse } from "next/server";
import { withDoctorAuth } from "@/lib/doctor/lib/middleware/withDoctorAuth";
import { unlink } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { s3 } from "@/lib/s3";
import {
  isS3StoragePath,
  avatarApiUrl,
  storagePathToS3Key,
} from "@/lib/storage-url";

const MAX_FILE_SIZE = 2 * 1024 * 1024;
const ALLOWED_FORMATS = ["image/jpeg", "image/png", "image/jpg", "image/webp"];

async function deleteStoredAvatar(avatarPath: string) {
  if (isS3StoragePath(avatarPath)) {
    const bucketName = process.env.LIARA_BUCKET_NAME;
    if (!bucketName) return;
    try {
      await s3.send(
        new DeleteObjectCommand({
          Bucket: bucketName,
          Key: storagePathToS3Key(avatarPath),
        })
      );
    } catch (e) {
      console.error("[upload-avatar] S3 delete error:", e);
    }
    return;
  }

  if (avatarPath.startsWith("/uploads/")) {
    const oldFilePath = path.join(process.cwd(), "public", avatarPath);
    try {
      await unlink(oldFilePath);
    } catch {
      // file may already be gone
    }
  }
}

export const POST = withDoctorAuth(async (req: NextRequest, doctor: any) => {
  try {
    const formData = await req.formData();
    const file = formData.get("avatar") as File;

    if (!file) {
      return NextResponse.json(
        { success: false, message: "فایلی ارسال نشده است" },
        { status: 400 }
      );
    }

    if (!ALLOWED_FORMATS.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "فرمت فایل مجاز نیست. فقط JPEG، PNG و WEBP پشتیبانی می‌شوند.",
        },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, message: "حجم فایل نباید بیشتر از ۲ مگابایت باشد" },
        { status: 400 }
      );
    }

    const bucketName = process.env.LIARA_BUCKET_NAME;
    if (!bucketName) {
      return NextResponse.json(
        { success: false, message: "پیکربندی ذخیره‌سازی فایل ناقص است" },
        { status: 500 }
      );
    }

    const db = (await clientPromise).db("janaram-db");
    const psychologists = db.collection("psychologists");
    const doctorDoc = await psychologists.findOne({
      _id: new ObjectId(doctor.sub),
    });

    const imageExtension =
      file.name.split(".").pop()?.toLowerCase() ||
      file.type.split("/")[1] ||
      "jpg";
    const uniqueImageName = `images/doctor-avatars/${randomUUID()}.${imageExtension}`;
    const imageBuffer = Buffer.from(await file.arrayBuffer());

    await s3.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: uniqueImageName,
        Body: imageBuffer,
        ContentType: file.type,
      })
    );

    const avatarPath = `/${uniqueImageName}`;

    if (doctorDoc?.avatar) {
      await deleteStoredAvatar(doctorDoc.avatar);
    }

    await psychologists.updateOne(
      { _id: new ObjectId(doctor.sub) },
      {
        $set: {
          avatar: avatarPath,
          updatedAt: new Date(),
        },
      }
    );

    return NextResponse.json({
      success: true,
      message: "عکس پروفایل با موفقیت آپلود شد",
      data: {
        avatar: avatarApiUrl(avatarPath),
      },
    });
  } catch (err: any) {
    console.error("Error uploading avatar:", err);
    return NextResponse.json(
      { success: false, message: "خطا در آپلود عکس" },
      { status: 500 }
    );
  }
});

export const DELETE = withDoctorAuth(async (req: NextRequest, doctor: any) => {
  try {
    const db = (await clientPromise).db("janaram-db");
    const psychologists = db.collection("psychologists");

    const doctorDoc = await psychologists.findOne({
      _id: new ObjectId(doctor.sub),
    });

    if (doctorDoc?.avatar) {
      await deleteStoredAvatar(doctorDoc.avatar);
    }

    await psychologists.updateOne(
      { _id: new ObjectId(doctor.sub) },
      {
        $set: {
          avatar: null,
          updatedAt: new Date(),
        },
      }
    );

    return NextResponse.json({
      success: true,
      message: "عکس پروفایل با موفقیت حذف شد",
    });
  } catch (err: any) {
    console.error("Error deleting avatar:", err);
    return NextResponse.json(
      { success: false, message: "خطا در حذف عکس" },
      { status: 500 }
    );
  }
});
