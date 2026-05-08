import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { withAuth } from "@/lib/middleware/withAuth";
import { createGroup, sendMessage } from "@/lib/bale/bale-api";

export const POST = withAuth(async (req: NextRequest, user: any) => {
  try {
    const url = new URL(req.url);
    const pathSegments = url.pathname.split("/");
    const appointmentId = pathSegments[pathSegments.length - 2];

    const db = (await clientPromise).db("janaram-db");
    const appointments = db.collection("appointments");
    const psychologists = db.collection("psychologists");
    const users = db.collection("users");

    const appointment = await appointments.findOne({
      _id: new ObjectId(appointmentId),
      userId: user.sub,
    });

    if (!appointment) {
      return NextResponse.json(
        { success: false, message: "نوبت یافت نشد" },
        { status: 404 }
      );
    }

    const doctor = await psychologists.findOne({
      _id: new ObjectId(appointment.doctorId),
    });
    const patient = await users.findOne({
      _id: new ObjectId(appointment.userId),
    });

    if (!doctor?.baleId || !patient?.baleId) {
      return NextResponse.json(
        {
          success: false,
          message: "لطفاً ابتدا آیدی بله خود را در پروفایل وارد کنید",
        },
        { status: 400 }
      );
    }

    // ایجاد گروه موقت
    const groupTitle = `جلسه مشاوره - دکتر ${doctor.name} - ${appointment.date}`;
    const group = await createGroup(groupTitle, [
      doctor.baleId,
      patient.baleId,
    ]);

    if (!group.ok) {
      return NextResponse.json(
        { success: false, message: "خطا در ایجاد گروه" },
        { status: 500 }
      );
    }

    // ذخیره آیدی گروه در دیتابیس
    await appointments.updateOne(
      { _id: new ObjectId(appointmentId) },
      {
        $set: {
          baleGroupId: group.result.chat_id,
          sessionStartedAt: new Date(),
          sessionStatus: "active",
        },
      }
    );

    // ارسال پیام خوش‌آمدگویی در گروه
    await sendMessage(
      group.result.chat_id,
      `🔒 جلسه مشاوره شما آغاز شد.\n\n` +
        `👤 روانشناس: دکتر ${doctor.name}\n` +
        `📅 تاریخ: ${appointment.date}\n` +
        `⏰ ساعت: ${appointment.time}\n\n` +
        `این گفتگو خصوصی و محرمانه است.`
    );

    return NextResponse.json({
      success: true,
      message: "اتاق گفتگو ساخته شد",
      chatId: group.result.chat_id,
    });
  } catch (err: any) {
    console.error("Error starting session:", err);
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
});
