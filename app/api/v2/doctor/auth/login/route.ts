import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import bcrypt from "bcryptjs";
import { signJwt } from "@/lib/doctor/lib/jwt";

export async function POST(req: NextRequest) {
  try {
    const { phone, password } = await req.json();

    if (!phone || !password) {
      return NextResponse.json(
        { success: false, message: "شماره تلفن و رمز عبور الزامی است" },
        { status: 400 }
      );
    }

    const db = (await clientPromise).db("janaram-db");
    const psychologists = db.collection("psychologists");

    // پیدا کردن روانشناس با شماره تلفن
    const doctor = await psychologists.findOne({ phone });
    if (!doctor) {
      return NextResponse.json(
        { success: false, message: "شماره تلفن یا رمز عبور اشتباه است" },
        { status: 401 }
      );
    }

    // بررسی رمز عبور با bcrypt
    const isPasswordValid = await bcrypt.compare(password, doctor.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, message: "شماره تلفن یا رمز عبور اشتباه است" },
        { status: 401 }
      );
    }

    // بررسی وضعیت تأیید حساب
    if (doctor.status === "pending") {
      return NextResponse.json(
        {
          success: false,
          message:
            "حساب کاربری شما در انتظار تأیید ادمین است. پس از تأیید می‌توانید وارد شوید.",
        },
        { status: 403 }
      );
    }

    if (doctor.status === "rejected") {
      return NextResponse.json(
        {
          success: false,
          message: `حساب کاربری شما رد شده است. دلیل: ${
            doctor.rejectionReason || "نامشخص"
          }`,
        },
        { status: 403 }
      );
    }

    // ساخت توکن JWT
    const token = await signJwt({
      sub: doctor._id.toString(),
      role: "doctor",
      name: doctor.name,
      phone: doctor.phone,
      status: doctor.status,
    });

    return NextResponse.json({
      success: true,
      data: {
        token,
        doctor: {
          id: doctor._id.toString(),
          name: doctor.name,
          phone: doctor.phone,
          specialty: doctor.specialty,
          status: doctor.status,
        },
      },
    });
  } catch (err: any) {
    console.error("Error in doctor login:", err);
    return NextResponse.json(
      { success: false, message: "خطای سرور" },
      { status: 500 }
    );
  }
}
