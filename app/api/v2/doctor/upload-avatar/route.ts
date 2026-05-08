import { NextRequest, NextResponse } from "next/server";
import { withDoctorAuth } from "@/lib/doctor/lib/middleware/withDoctorAuth";
import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";

// حداکثر سایز فایل: 2 مگابایت
const MAX_FILE_SIZE = 2 * 1024 * 1024;

// فرمت‌های مجاز
const ALLOWED_FORMATS = ["image/jpeg", "image/png", "image/jpg", "image/webp"];

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

    // بررسی نوع فایل
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

    // بررسی سایز فایل
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, message: "حجم فایل نباید بیشتر از ۲ مگابایت باشد" },
        { status: 400 }
      );
    }

    // تبدیل فایل به بافر
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // ایجاد نام یکتا برای فایل
    const fileExtension = file.type.split("/")[1];
    const fileName = `${doctor.sub}_${Date.now()}.${fileExtension}`;

    // مسیر ذخیره‌سازی
    const uploadDir = path.join(process.cwd(), "public", "uploads", "avatars");
    const filePath = path.join(uploadDir, fileName);
    const publicPath = `/uploads/avatars/${fileName}`;

    // ایجاد پوشه در صورت نبودن
    await mkdir(uploadDir, { recursive: true });

    // ذخیره فایل
    await writeFile(filePath, buffer);

    // به‌روزرسانی در دیتابیس
    const db = (await clientPromise).db("janaram-db");
    const psychologists = db.collection("psychologists");

    await psychologists.updateOne(
      { _id: new ObjectId(doctor.sub) },
      {
        $set: {
          avatar: publicPath,
          updatedAt: new Date(),
        },
      }
    );

    return NextResponse.json({
      success: true,
      message: "عکس پروفایل با موفقیت آپلود شد",
      data: {
        avatar: publicPath,
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

// DELETE : حذف عکس پروفایل
export const DELETE = withDoctorAuth(async (req: NextRequest, doctor: any) => {
  try {
    const db = (await clientPromise).db("janaram-db");
    const psychologists = db.collection("psychologists");

    // دریافت آواتار فعلی
    const doctorDoc = await psychologists.findOne({
      _id: new ObjectId(doctor.sub),
    });
    if (doctorDoc?.avatar) {
      // حذف فایل از سرور (اختیاری)
      const oldFilePath = path.join(process.cwd(), "public", doctorDoc.avatar);
      try {
        await unlink(oldFilePath);
      } catch (e) {
        // فایل وجود ندارد - ادامه بده
      }
    }

    // حذف آدرس از دیتابیس
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
