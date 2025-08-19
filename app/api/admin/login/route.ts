// pages/api/admin/login.ts
import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import clientPromise from "@/lib/mongodb";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    console.log(email, password, "req");
    if (!email || !password) {
      return NextResponse.json({ success: false, message: "ایمیل و رمز عبور الزامی است" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("janaram-db"); // Replace with your database name
    const admin = await db.collection("admins").findOne({ email });

    if (!admin) {
      return NextResponse.json({ success: false, message: "کاربر ادمین یافت نشد" }, { status: 401 });
    }

    // Compare plain text password directly
    if (password !== admin.password) {
      return NextResponse.json({ success: false, message: "رمز عبور نادرست است" }, { status: 401 });
    }

    const token = jwt.sign(
      { sub: admin._id.toString(), email: admin.email, role: admin.role },
      process.env.JWT_SECRET!,
      { expiresIn: "1h" }
    );

    return NextResponse.json({ success: true, token, message: "ورود موفقیت‌آمیز بود" }, { status: 200 });
  } catch (error) {
    console.error("Admin login error:", error);
    return NextResponse.json({ success: false, message: "خطای سرور" }, { status: 500 });
  }
}
