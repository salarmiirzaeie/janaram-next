import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { User } from "@/lib/types/user";
import { getTodayGregorianDate } from "../mood/set/route";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const name = formData.get("name")?.toString();
    const email = formData.get("email")?.toString();
    const phoneNumber = formData.get("phoneNumber")?.toString();
    const message = formData.get("message")?.toString();

    // Validate inputs

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, message: "ایمیل نا معتبر" },
        { status: 400 }
      );
    }
    if (!name) {
      console.error("Missing name or phoneNumber:", { name, phoneNumber });
      return NextResponse.json(
        { success: false, message: "نام  الزامی هستند" },
        { status: 400 }
      );
    }

    // Connect to the database
    const db = (await clientPromise).db("janaram-db");
    const users = db.collection<User>("users");

    await db.collection("messages").insertOne({
      name,
      phoneNumber,
      message,
      email,
      createdAt: getTodayGregorianDate(), // Added for better tracking
    });

    return NextResponse.json({ success: true, message: "پیام فرستاده شد " });
  } catch (err: any) {
    console.error("Error in updating user profile:", err.message);
    return NextResponse.json(
      { success: false, message: err.message || "خطای سرور" },
      { status: 500 }
    );
  }
}
