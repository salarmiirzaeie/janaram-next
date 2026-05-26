import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { randomBytes } from "crypto";
const MelipayamakApi = require("melipayamak");
const https = require("https");

// Environment variable validation
const SMS_API_KEY = process.env.SMS_API_KEY_PRO || "";
if (!SMS_API_KEY) throw new Error("SMS_API_KEY_PRO is not defined");

// Phone number validation (for Iranian numbers)
const validatePhoneNumber = (phone: string): boolean => {
  return /^(\+98|0)?9\d{9}$/.test(phone);
};

// App hash validation (11 characters or null/undefined)
// const validateAppHash = (appHash: string | null | undefined): boolean => {
//   return appHash == null || (typeof appHash === "string" && appHash.length === 11);
// };

export async function POST(req: Request) {
  try {
    const { phoneNumber } = await req.json();

    // Input validation
    if (!phoneNumber || !validatePhoneNumber(phoneNumber)) {
      return NextResponse.json(
        { success: false, message: "شماره تلفن نامعتبر است" },
        { status: 400 }
      );
    }

    const otp = (randomBytes(3).readUIntBE(0, 3) % 1000000)
      .toString()
      .padStart(6, "0");

    return NextResponse.json({
      success: true,
      message: "کد تایید ارسال شد",
      data: { otp },
    });
  } catch (err: any) {
    console.error("Error in OTP sending:", {
      error: err.message,
      stack: err.stack,
    });
    return NextResponse.json(
      { success: false, message: "خطای سرور" },
      { status: 500 }
    );
  }
}
