import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { withDoctorAuth } from "@/lib/doctor/lib/middleware/withDoctorAuth";
import { applyDoctorStatusChange } from "@/lib/appointment-lifecycle";
import { NO_SHOW_GRACE_MINUTES } from "@/lib/booking-lifecycle";

export const PUT = withDoctorAuth(
  async (req: NextRequest, doctor: any, params?: Record<string, string>) => {
    try {
      const id = params?.id;
      const { status, note } = await req.json();

      if (!id || !status) {
        return NextResponse.json(
          { success: false, message: "شناسه نوبت و وضعیت الزامی است" },
          { status: 400 }
        );
      }

      const allowed = ["completed", "no-show"];
      if (!allowed.includes(status)) {
        return NextResponse.json(
          {
            success: false,
            message:
              "فقط وضعیت‌های «انجام شد» یا «حضور نیافت» مجاز است. لغو نوبت فقط توسط مراجع انجام می‌شود.",
          },
          { status: 400 }
        );
      }

      const db = (await clientPromise).db("janaram-db");
      const appointment = await db.collection("appointments").findOne({
        _id: new ObjectId(id),
        doctorId: doctor.sub,
      });

      if (!appointment) {
        return NextResponse.json(
          { success: false, message: "نوبت یافت نشد یا متعلق به شما نیست" },
          { status: 404 }
        );
      }

      if (appointment.status !== "confirmed") {
        return NextResponse.json(
          {
            success: false,
            message: "فقط نوبت‌های پرداخت‌شده و تأییدشده قابل به‌روزرسانی هستند",
          },
          { status: 400 }
        );
      }

      const result = await applyDoctorStatusChange(
        db,
        appointment as any,
        status,
        { note }
      );

      if (!result.ok) {
        return NextResponse.json(
          { success: false, message: result.message },
          { status: result.status }
        );
      }

      const messages: Record<string, string> = {
        completed:
          "جلسه انجام شد. مبلغ جلسه (منهای کارمزد پلتفرم در صورت تعریف) در گزارش مالی شما ثبت شد.",
        "no-show":
          "حضور نیافت ثبت شد. کل مبلغ جلسه به سهم شما در گزارش مالی واریز می‌شود.",
      };

      return NextResponse.json({
        success: true,
        message: messages[status] || "وضعیت به‌روزرسانی شد",
      });
    } catch (err: any) {
      console.error("Error updating appointment status:", err);
      return NextResponse.json(
        { success: false, message: "خطای سرور" },
        { status: 500 }
      );
    }
  }
);
