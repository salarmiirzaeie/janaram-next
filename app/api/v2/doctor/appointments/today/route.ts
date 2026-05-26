import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { withDoctorAuth } from "@/lib/doctor/lib/middleware/withDoctorAuth";
import { getTodayTehran } from "@/lib/booking";
import { asStoredAppointment } from "@/lib/appointment-doc";
import { serializeDoctorAppointment } from "@/lib/doctor-appointment-display";

export const GET = withDoctorAuth(async (req: NextRequest, doctor: any) => {
  try {
    const db = (await clientPromise).db("janaram-db");
    const appointments = db.collection("appointments");
    const users = db.collection("users");

    const today = getTodayTehran();

    const todayAppointments = await appointments
      .find({
        doctorId: doctor.sub,
        date: today,
      })
      .sort({ time: 1 })
      .toArray();

    const userIds = todayAppointments.map((a) => new ObjectId(a.userId));
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

    const result = todayAppointments.map((app) =>
      serializeDoctorAppointment(
        asStoredAppointment(app),
        userMap.get(app.userId)
      )
    );

    return NextResponse.json({
      success: true,
      data: {
        date: today,
        count: result.length,
        appointments: result,
      },
    });
  } catch (err: any) {
    console.error("Error fetching today's appointments:", err);
    return NextResponse.json(
      { success: false, message: "خطای سرور" },
      { status: 500 }
    );
  }
});
