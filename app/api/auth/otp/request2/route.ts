import { NextResponse } from "next/server";
import { randomBytes } from "crypto";

// const MelipayamakApi = require("melipayamak");
// const SMS_API_KEY = process.env.SMS_API_KEY_PRO || "";
// if (!SMS_API_KEY) throw new Error("SMS_API_KEY_PRO is not defined");

const validatePhoneNumber = (phone: string): boolean => {
  return /^(\+98|0)?9\d{9}$/.test(phone);
};

/** Dev OTP — SMS disabled; OTP returned in response body */
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

    console.log("[otp] SMS disabled — OTP for", phoneNumber, ":", otp);

    return NextResponse.json({
      success: true,
      message: "کد تایید ارسال شد",
      data: { otp },
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
