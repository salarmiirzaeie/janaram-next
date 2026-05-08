import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { withAuth } from "@/lib/middleware/withAuth";
import { ObjectId } from "mongodb";

export const GET = withAuth(async (req: NextRequest, user: any) => {
  try {
    const db = (await clientPromise).db("janaram-db");
    const appointments = db.collection("appointments");
    const psychologists = db.collection("psychologists");

    // دریافت نوبت‌های کاربر
    const myAppointments = await appointments
      .find({ userId: user.sub })
      .sort({ date: -1, time: -1 })
      .toArray();

    // Fetch doctor names
    const doctorIds = [...new Set(myAppointments.map((a) => a.doctorId))];
    const doctors = await psychologists
      .find({ _id: { $in: doctorIds.map((id) => new ObjectId(id)) } })
      .toArray();
    const doctorMap = new Map(doctors.map((d) => [d._id.toString(), d.name]));

    const enriched = myAppointments.map((a) => ({
      id: a._id.toString(),
      doctorId: a.doctorId,
      doctorName: doctorMap.get(a.doctorId) || "نامشخص",
      date: a.date,
      time: a.time,
      status: a.status,
      createdAt: a.createdAt,
    }));

    return NextResponse.json({
      success: true,
      data: enriched,
    });
  } catch (err: any) {
    console.error("Error fetching user appointments:", err);
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
});
