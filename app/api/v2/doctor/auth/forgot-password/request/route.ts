import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import clientPromise from "@/lib/mongodb";
import { smsOtpCode } from "@/lib/sms";

const validatePhone = (phone: string): boolean =>
  /^(\+98|0)?9\d{9}$/.test(phone.replace(/\s/g, ""));

export async function POST(req: Request) {
  try {
    const { phone } = await req.json();
    const phoneNumber = typeof phone === "string" ? phone.replace(/\s/g, "") : "";

    if (!phoneNumber || !validatePhone(phoneNumber)) {
      return NextResponse.json(
        { success: false, message: "شماره تلفن نامعتبر است" },
        { status: 400 }
      );
    }

    const db = (await clientPromise).db("janaram-db");
    const doctor = await db.collection("psychologists").findOne({ phone: phoneNumber });

    if (!doctor) {
      return NextResponse.json(
        { success: false, message: "شماره تلفن در سیستم ثبت نشده است" },
        { status: 404 }
      );
    }

    const otpCodes = db.collection("doctor_password_reset_otps");
    const existingOtp = await otpCodes.findOne({
      phone: phoneNumber,
      expiresAt: { $gt: Date.now() },
      verified: false,
    });

    if (existingOtp) {
      return NextResponse.json(
        { success: true, message: "لطفاً از کد قبلی استفاده کنید یا صبر کنید" },
        { status: 429 }
      );
    }

    const otp = (randomBytes(3).readUIntBE(0, 3) % 1000000)
      .toString()
      .padStart(6, "0");
    const expiresAt = Date.now() + 4 * 60 * 1000;

    await otpCodes.insertOne({
      phone: phoneNumber,
      otp,
      expiresAt,
      verified: false,
      createdAt: Date.now(),
    });

    try {
      await smsOtpCode(phoneNumber, otp);
    } catch (smsError: unknown) {
      const message = smsError instanceof Error ? smsError.message : "unknown";
      console.error("[doctor forgot-password] SMS error:", { phoneNumber, error: message });
      return NextResponse.json(
        { success: false, message: "خطا در ارسال پیامک" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "کد تایید ارسال شد",
      ...(process.env.NODE_ENV !== "production" ? { data: { otp } } : {}),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "unknown";
    console.error("[doctor forgot-password] request error:", message);
    return NextResponse.json(
      { success: false, message: "خطای سرور" },
      { status: 500 }
    );
  }
}
