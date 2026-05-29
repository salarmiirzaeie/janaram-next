import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import clientPromise from "@/lib/mongodb";

const validatePhone = (phone: string): boolean =>
  /^(\+98|0)?9\d{9}$/.test(phone.replace(/\s/g, ""));

const validateOtp = (otp: string): boolean => /^\d{6}$/.test(otp);

export async function POST(req: Request) {
  try {
    const { phone, otp, password } = await req.json();
    const phoneNumber = typeof phone === "string" ? phone.replace(/\s/g, "") : "";

    if (!phoneNumber || !validatePhone(phoneNumber)) {
      return NextResponse.json(
        { success: false, message: "شماره تلفن نامعتبر است" },
        { status: 400 }
      );
    }

    if (!otp || !validateOtp(otp)) {
      return NextResponse.json(
        { success: false, message: "کد تایید نامعتبر است" },
        { status: 400 }
      );
    }

    if (!password || typeof password !== "string" || password.length < 6) {
      return NextResponse.json(
        { success: false, message: "رمز عبور باید حداقل ۶ کاراکتر باشد" },
        { status: 400 }
      );
    }

    const db = (await clientPromise).db("janaram-db");
    const otpCodes = db.collection("doctor_password_reset_otps");

    const otpRecord = await otpCodes.findOne({
      phone: phoneNumber,
      otp,
      verified: false,
      expiresAt: { $gt: Date.now() },
    });

    if (!otpRecord) {
      return NextResponse.json(
        { success: false, message: "کد نامعتبر یا منقضی شده است" },
        { status: 400 }
      );
    }

    const psychologists = db.collection("psychologists");
    const doctor = await psychologists.findOne({ phone: phoneNumber });

    if (!doctor) {
      return NextResponse.json(
        { success: false, message: "شماره تلفن در سیستم ثبت نشده است" },
        { status: 404 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await psychologists.updateOne(
      { _id: doctor._id },
      { $set: { password: hashedPassword, updatedAt: new Date() } }
    );

    await otpCodes.updateOne(
      { _id: otpRecord._id },
      { $set: { verified: true, usedAt: Date.now() } }
    );

    return NextResponse.json({
      success: true,
      message: "رمز عبور با موفقیت تغییر کرد",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "unknown";
    console.error("[doctor forgot-password] reset error:", message);
    return NextResponse.json(
      { success: false, message: "خطای سرور" },
      { status: 500 }
    );
  }
}
