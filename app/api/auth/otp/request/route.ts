import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { randomBytes } from "crypto";
import { smsOtpCode } from "@/lib/sms";

const validatePhoneNumber = (phone: string): boolean => {
  return /^(\+98|0)?9\d{9}$/.test(phone);
};

export async function POST(req: Request) {
  try {
    const { phoneNumber } = await req.json();

    if (!phoneNumber || !validatePhoneNumber(phoneNumber)) {
      return NextResponse.json(
        { success: false, message: "شماره تلفن نامعتبر است" },
        { status: 400 }
      );
    }

    const otp = (randomBytes(3).readUIntBE(0, 3) % 1000000)
      .toString()
      .padStart(6, "0");
    const expiresAt = Date.now() + 4 * 60 * 1000;

    const db = (await clientPromise).db("janaram-db");

    const existingOtp = await db.collection("otp_codes").findOne({
      phoneNumber,
      expiresAt: { $gt: Date.now() },
      verified: false,
    });

    if (existingOtp) {
      return NextResponse.json(
        { success: true, message: "لطفاً از کد قبلی استفاده کنید یا صبر کنید" },
        { status: 429 }
      );
    }

    await db.collection("otp_codes").insertOne({
      phoneNumber,
      otp,
      expiresAt,
      verified: false,
      createdAt: Date.now(),
    });

    try {
      await smsOtpCode(phoneNumber, otp);
    } catch (smsError: unknown) {
      const message =
        smsError instanceof Error ? smsError.message : "unknown";
      console.error("SMS API error:", { phoneNumber, error: message });
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
    console.error("Error in OTP sending:", message);
    return NextResponse.json(
      { success: false, message: "خطای سرور" },
      { status: 500 }
    );
  }
}
