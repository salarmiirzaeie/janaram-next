import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import axios from "axios";
import { randomBytes } from "crypto";
const MelipayamakApi = require("melipayamak");

// Environment variable validation
const SMS_API_KEY = process.env.SMS_API_KEY_PRO || "";
if (!SMS_API_KEY) throw new Error("SMS_API_KEY_PRO is not defined");

// Phone number validation (for Iranian numbers)
const validatePhoneNumber = (phone: string): boolean => {
  return /^(\+98|0)?9\d{9}$/.test(phone);
};

// App hash validation (11 characters or null/undefined)
const validateAppHash = (appHash: string | null | undefined): boolean => {
  return appHash == null || (typeof appHash === "string" && appHash.length === 11);
};

export async function POST(req: Request) {
  migrateUnlimitedUsers().catch(console.error);

  try {
    const { phoneNumber, appHash } = await req.json();

    // Input validation
    if (!phoneNumber || !validatePhoneNumber(phoneNumber)) {
      return NextResponse.json({ success: false, message: "شماره تلفن نامعتبر است" }, { status: 400 });
    }
    if (!validateAppHash(appHash)) {
      return NextResponse.json({ success: false, message: "مقدار appHash نامعتبر است" }, { status: 400 });
    }

    // Generate 6-digit OTP using crypto
    const otp = (randomBytes(3).readUIntBE(0, 3) % 1000000).toString().padStart(6, "0");
    const expiresAt = Date.now() + 4 * 60 * 1000; // 4-minute expiry (increased from 2 for better UX)

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
      createdAt: Date.now(), // Added for better tracking
    });

    // Prepare SMS parameters
    const smsParameters = [{ name: "Code", value: otp }];
    if (appHash) {
      smsParameters.push({ name: "Hash", value: appHash });
    }
    const username = "9381811680";
    const password = "BO2A4";
    const api = new MelipayamakApi(username, password);
    const sms = api.sms();
    const to = phoneNumber;
    const from = "";
    const text = `کد تایید شما: ${otp}

    تیم جانارام ${appHash ? appHash : ""}`;
    try {
      sms
        .send(to, from, text)
        .then((res: any) => {
          console.log(res, "red");
        })
        .catch((err: any) => {
          console.log(err, "err");
        });
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

async function migrateUnlimitedUsers() {
  const client = await clientPromise;

  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db("janaram-db");
    const users = db.collection("users");

    // Calculate subscription end date (1 month from August 19, 2025, 10:45 AM BST)
    const now = new Date("2025-08-19T09:45:00Z"); // BST is UTC+1, so adjust to UTC
    const subscriptionEndDate = new Date(now);
    subscriptionEndDate.setMonth(now.getMonth() + 1); // Add 1 month

    // Update users with plan: "unlimited" and missing subscription fields
    const result = await users.updateMany(
      {
        plan: "unlimited",
        $or: [{ subscriptionDuration: { $exists: false } }, { subscriptionEndDate: { $exists: false } }],
      },
      {
        $set: {
          subscriptionDuration: 1,
          subscriptionEndDate: subscriptionEndDate,
          updatedAt: now,
        },
      }
    );

    console.log(`Updated ${result.modifiedCount} users with unlimited plan`);
    console.log(`Matched ${result.matchedCount} users`);

    // Verify updated documents
    const updatedUsers = await users
      .find({
        plan: "unlimited",
        subscriptionDuration: 1,
        subscriptionEndDate: subscriptionEndDate,
      })
      .toArray();
    console.log("Updated users:", updatedUsers);
  } catch (err) {
    console.error("Error during migration:", err);
  } finally {
    await client.close();
    console.log("MongoDB connection closed");
  }
}
