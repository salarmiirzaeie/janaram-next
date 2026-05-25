import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

// اعتبارسنجی شماره تلفن ایران
const validatePhoneNumber = (phone: string): boolean => {
  return /^(\+98|0)?9\d{9}$/.test(phone);
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phoneNumber } = body;

    // validation
    if (!phoneNumber) {
      return NextResponse.json(
        { success: false, message: "شماره تلفن الزامی است" },
        { status: 400 }
      );
    }

    if (!validatePhoneNumber(phoneNumber)) {
      return NextResponse.json(
        { success: false, message: "شماره تلفن نامعتبر است" },
        { status: 400 }
      );
    }

    const db = (await clientPromise).db("janaram-db");
    const waitlist = db.collection("psychologist_waitlist");

    // بررسی قبلاً ثبت نام کرده یا نه
    const existingUser = await waitlist.findOne({ phoneNumber });

    if (existingUser) {
      return NextResponse.json(
        { success: false, message: "این شماره قبلاً ثبت شده است" },
        { status: 409 }
      );
    }

    // ثبت در دیتابیس
    await waitlist.insertOne({
      phoneNumber,
      registeredAt: new Date(),
      notified: false,
    });

    return NextResponse.json(
      {
        success: true,
        message:
          "شماره شما با موفقیت ثبت شد. به محض راه‌اندازی به شما پیامک می‌زنیم.",
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("Error in waitlist API:", err.message);
    return NextResponse.json(
      { success: false, message: "خطای سرور. لطفاً مجدداً تلاش کنید." },
      { status: 500 }
    );
  }
}
