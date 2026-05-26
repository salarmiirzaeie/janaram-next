import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { withDoctorAuth } from "@/lib/doctor/lib/middleware/withDoctorAuth";
import { getTodayTehran } from "@/lib/booking";
import { asStoredAppointment } from "@/lib/appointment-doc";
import { serializeDoctorAppointment } from "@/lib/doctor-appointment-display";

function getPastCutoffDate(daysBack: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysBack);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tehran",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

export const GET = withDoctorAuth(async (req: NextRequest, doctor: any) => {
  try {
    const db = (await clientPromise).db("janaram-db");
    const appointments = db.collection("appointments");
    const users = db.collection("users");

    const today = getTodayTehran();
    const cutoff = getPastCutoffDate(90);

    const pastAppointments = await appointments
      .find({
        doctorId: doctor.sub,
        date: { $gte: cutoff, $lt: today },
      })
      .sort({ date: -1, time: -1 })
      .toArray();

    const userIds = pastAppointments.map((a) => new ObjectId(a.userId));
    const userDocs = await users
      .find({ _id: { $in: userIds } })
      .project({ name: 1, phoneNumber: 1 })
      .toArray();

    const userMap = new Map<string, { name: string; phone: string }>();
    userDocs.forEach((u) => {
      userMap.set(u._id.toString(), {
        name: u.name,
        phone: u.phoneNumber,
      });
    });

    const result = pastAppointments.map((app) =>
      serializeDoctorAppointment(
        asStoredAppointment(app),
        userMap.get(app.userId)
      )
    );

    return NextResponse.json({
      success: true,
      data: {
        count: result.length,
        appointments: result,
      },
    });
  } catch (err: any) {
    console.error("Error fetching past appointments:", err);
    return NextResponse.json(
      { success: false, message: "خطای سرور" },
      { status: 500 }
    );
  }
});
