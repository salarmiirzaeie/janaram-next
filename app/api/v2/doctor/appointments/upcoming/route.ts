import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { withDoctorAuth } from "@/lib/doctor/lib/middleware/withDoctorAuth";
import { getTodayTehran } from "@/lib/booking";
import { serializeDoctorAppointment } from "@/lib/doctor-appointment-display";

export const GET = withDoctorAuth(async (req: NextRequest, doctor: any) => {
  try {
    const db = (await clientPromise).db("janaram-db");
    const appointments = db.collection("appointments");
    const users = db.collection("users");

    const today = getTodayTehran();

    const upcomingAppointments = await appointments
      .find({
        doctorId: doctor.sub,
        date: { $gt: today },
      })
      .sort({ date: 1, time: 1 })
      .toArray();

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

    const result = upcomingAppointments.map((app) =>
      serializeDoctorAppointment(app, userMap.get(app.userId))
    );

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
