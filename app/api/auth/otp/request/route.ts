import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import axios from "axios";
import { randomBytes } from "crypto";

// Environment variable validation
const SMS_API_KEY = process.env.SMS_API_KEY_TEST || "";
if (!SMS_API_KEY) throw new Error("SMS_API_KEY_TEST is not defined");

// Phone number validation (example for Iranian numbers)
const validatePhoneNumber = (phone: string): boolean => {
  return /^(\+98|0)?9\d{9}$/.test(phone);
};

export async function POST(req: Request) {
  try {
    const { phoneNumber } = await req.json();

    // Input validation
    if (!phoneNumber || !validatePhoneNumber(phoneNumber)) {
      return NextResponse.json({ success: false, message: "شماره تلفن نامعتبر است" }, { status: 400 });
    }

    // Generate 6-digit OTP using crypto
    const otp = (randomBytes(3).readUIntBE(0, 3) % 1000000).toString().padStart(6, "0");
    const expiresAt = Date.now() + 2 * 60 * 1000; // 2-minute expiry

    const db = (await clientPromise).db("janaram-db");

    // Check for existing unexpired OTP
    const existingOtp = await db.collection("otp_codes").findOne({
      phoneNumber,
      expiresAt: { $gt: Date.now() },
      verified: false,
    });

    if (existingOtp) {
      return NextResponse.json(
        { success: false, message: "لطفاً از کد قبلی استفاده کنید یا صبر کنید" },
        { status: 429 }
      );
    }

    // Store OTP
    await db.collection("otp_codes").insertOne({
      phoneNumber,
      otp,
      expiresAt,
      verified: false,
    });

    // Send OTP via SMS
    try {
      const smsResponse = await axios.post(
        "https://api.sms.ir/v1/send/verify",
        {
          mobile: phoneNumber,
          templateId: 123456,
          parameters: [{ name: "Code", value: "000000" }],
        },
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "text/plain",
            "x-api-key": SMS_API_KEY,
          },
        }
      );
      console.log("SMS sent:", smsResponse.data); // Structured logging
    } catch (smsError: any) {
      console.error("SMS API error:", smsError.response?.data || smsError.message);
      return NextResponse.json({ success: false, message: "خطا در ارسال پیامک" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "کد تایید ارسال شد",
      otp,
    });
  } catch (err: any) {
    console.error("Error in OTP sending:", err);
    return NextResponse.json({ success: false, message: "خطای سرور" }, { status: 500 });
  }
}
