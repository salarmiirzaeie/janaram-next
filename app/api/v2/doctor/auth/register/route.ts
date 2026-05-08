import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      phone,
      password,
      specialty,
      specialties, // آرایه تخصص‌ها (جدید)
      experience,
      sessionPrice,
      bio,
      categoryId,
      medicalLicenseNumber, // شماره نظام پزشکی (اجباری)
      baleId, // آیدی بله (اختیاری)
    } = body;

    // اعتبارسنجی
    if (!name || !phone || !password) {
      return NextResponse.json(
        { success: false, message: "نام، شماره تلفن و رمز عبور الزامی هستند" },
        { status: 400 }
      );
    }

    // اعتبارسنجی شماره نظام پزشکی
    if (!medicalLicenseNumber) {
      return NextResponse.json(
        { success: false, message: "شماره نظام پزشکی الزامی است" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, message: "رمز عبور باید حداقل ۶ کاراکتر باشد" },
        { status: 400 }
      );
    }

    const db = (await clientPromise).db("janaram-db");
    const psychologists = db.collection("psychologists");

    // بررسی تکراری نبودن شماره تلفن
    const existingDoctor = await psychologists.findOne({ phone });
    if (existingDoctor) {
      return NextResponse.json(
        { success: false, message: "این شماره تلفن قبلاً ثبت شده است" },
        { status: 409 }
      );
    }

    // بررسی تکراری نبودن شماره نظام پزشکی
    const existingLicense = await psychologists.findOne({
      medicalLicenseNumber,
    });
    if (existingLicense) {
      return NextResponse.json(
        { success: false, message: "این شماره نظام پزشکی قبلاً ثبت شده است" },
        { status: 409 }
      );
    }

    // هش کردن رمز عبور
    const hashedPassword = await bcrypt.hash(password, 10);

    // تخصص‌ها: اگر specialties ارسال شده از آن استفاده کن، وگرنه از specialty قدیمی یک آرایه بساز
    const finalSpecialties = specialties || (specialty ? [specialty] : []);

    // تمیز کردن baleId (حذف @ اگر در ابتدا باشد)
    let cleanedBaleId = baleId;
    if (cleanedBaleId && cleanedBaleId.startsWith("@")) {
      cleanedBaleId = cleanedBaleId.substring(1);
    }

    // ایجاد روانشناس جدید با وضعیت pending
    const newDoctor = {
      name,
      phone,
      password: hashedPassword,
      specialty: finalSpecialties[0] || "", // برای سازگاری با نسخه قبل
      specialties: finalSpecialties,
      bio: bio || "",
      experience: experience || 0,
      sessionPrice: sessionPrice || 0,
      categoryId: categoryId || "individual",
      medicalLicenseNumber,
      successfulConsultations: 0,
      status: "pending", // در انتظار تایید ادمین
      rejectionReason: null,
      verifiedAt: null,
      verifiedBy: null,
      avatar: null,
      schedule: {},
      offDays: [],
      isActive: true,
      baleId: cleanedBaleId || null, // اضافه شد
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await psychologists.insertOne(newDoctor);

    return NextResponse.json({
      success: true,
      message:
        "ثبت‌نام با موفقیت انجام شد. پس از تأیید ادمین می‌توانید وارد پنل شوید.",
      data: { id: result.insertedId.toString(), status: "pending" },
    });
  } catch (err: any) {
    console.error("Error in doctor registration:", err);
    return NextResponse.json(
      { success: false, message: "خطای سرور" },
      { status: 500 }
    );
  }
}
