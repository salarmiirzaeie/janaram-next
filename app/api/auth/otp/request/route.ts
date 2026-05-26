import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { randomBytes } from "crypto";
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
    const { phoneNumber, appHash } = await req.json();

    // Input validation
    if (!phoneNumber || !validatePhoneNumber(phoneNumber)) {
      return NextResponse.json({ success: false, message: "شماره تلفن نامعتبر است" }, { status: 400 });
    }
    // if (!validateAppHash(appHash)) {
    //   return NextResponse.json({ success: false, message: "مقدار appHash نامعتبر است" }, { status: 400 });
    // }j

    // Generate 6-digit OTP using crypto
    const otp = (randomBytes(3).readUIntBE(0, 3) % 1000000).toString().padStart(6, "0");
    const expiresAt = Date.now() + 4 * 60 * 1000; // 4-minute expiry (increased from 2 for better UX)

    const db = (await clientPromise).db("janaram-db");

    const existingOtp = await db.collection("otp_codes").findOne({
      phoneNumber,
      expiresAt: { $gt: Date.now() },
      verified: false,
    });

    if (existingOtp) {
      return NextResponse.json(
        { success: true, message: "لطفاً از کد قبلی استفاده کنید یا صبر کنید" },
        { status: 429 },
      );
    }

    // Store OTP
    await db.collection("otp_codes").insertOne({
      phoneNumber,
      otp,
      expiresAt,
      verified: false,
      createdAt: Date.now(), // Added for better tracking
    });

    // Prepare SMS parameters
    // const smsParameters = [{ name: "Code", value: otp }];
    // if (appHash) {
    //   smsParameters.push({ name: "Hash", value: appHash });
    // }

    try {
      const data = JSON.stringify({
        bodyId: 420054,
        to: phoneNumber,
        args: [otp],
      });

      const options = {
        hostname: "console.melipayamak.com",
        port: 443,
        path: "/api/send/shared/6be212aadaea410b97e5ba4e98171dca",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": data.length,
        },
      };

      const req = https.request(options, (res: any) => {
        res.on("data", (d: any) => {
          process.stdout.write(d);
        });
      });

      req.on("error", (error: any) => {
        console.error(error);
      });

      req.write(data);
      req.end();
    } catch (smsError: any) {
      console.error("SMS API error:", {
        phoneNumber,
        error: smsError.response?.data || smsError.message,
      });
      return NextResponse.json({ success: false, message: "خطا در ارسال پیامک" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "کد تایید ارسال شد",
    });
  } catch (err: any) {
    console.error("Error in OTP sending:", {
      error: err.message,
      stack: err.stack,
    });
    return NextResponse.json({ success: false, message: "خطای سرور" }, { status: 500 });
  }
}
