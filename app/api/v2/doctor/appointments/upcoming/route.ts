import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { withDoctorAuth } from "@/lib/doctor/lib/middleware/withDoctorAuth";

// گرفتن تاریخ امروز به وقت ایران (فرمت YYYY-MM-DD)
function getTodayTehran(): string {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tehran",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(now);
}

export const GET = withDoctorAuth(async (req: NextRequest, doctor: any) => {
  try {
    const db = (await clientPromise).db("janaram-db");
    const appointments = db.collection("appointments");
    const users = db.collection("users");

    // تاریخ امروز به وقت ایران
    const today = getTodayTehran();

    // نوبت‌های آینده (بعد از امروز)
    const upcomingAppointments = await appointments
      .find({
        doctorId: doctor.sub,
        date: { $gt: today },
        status: { $ne: "cancelled" },
      })
      .sort({ date: 1, time: 1 })
      .toArray();

    // گرفتن اطلاعات کاربران
    const userIds = upcomingAppointments.map((a) => new ObjectId(a.userId));
    const userDocs = await users
      .find({ _id: { $in: userIds } })
      .project({ name: 1, phoneNumber: 1 })
      .toArray();

    const userMap = new Map();
    userDocs.forEach((u) => {
      userMap.set(u._id.toString(), {
        name: u.name,
        phone: u.phoneNumber,
      });
    });

    const result = upcomingAppointments.map((app) => ({
      id: app._id.toString(),
      date: app.date,
      time: app.time,
      status: app.status,
      user: userMap.get(app.userId) || {
        name: "کاربر ناشناس",
        phone: "نامشخص",
      },
      createdAt: app.createdAt,
    }));

    return NextResponse.json({
      success: true,
      data: {
        count: result.length,
        appointments: result,
      },
    });
  } catch (err: any) {
    console.error("Error fetching upcoming appointments:", err);
    return NextResponse.json(
      { success: false, message: "خطای سرور" },
      { status: 500 }
    );
  }
});
