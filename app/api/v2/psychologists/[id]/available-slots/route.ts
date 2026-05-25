import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import {
  APPROVED_DOCTOR_FILTER,
  expireStalePendingPayments,
  getPersianWeekdayNumber,
  getTodayTehran,
  isOffDay,
  isTimePassedInTehran,
  isValidDateString,
} from "@/lib/booking";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get("date");

    if (!dateStr || !isValidDateString(dateStr)) {
      return NextResponse.json(
        { success: false, message: "تاریخ معتبر الزامی است (YYYY-MM-DD)" },
        { status: 400 }
      );
    }

    const db = (await clientPromise).db("janaram-db");
    await expireStalePendingPayments(db);

    const psychologists = db.collection("psychologists");
    const appointments = db.collection("appointments");

    const doctor = await psychologists.findOne({
      _id: new ObjectId(id),
      ...APPROVED_DOCTOR_FILTER,
    });
    if (!doctor) {
      return NextResponse.json(
        { success: false, message: "روانشناس یافت نشد" },
        { status: 404 }
      );
    }

    if (isOffDay(doctor.offDays, dateStr)) {
      return NextResponse.json({
        success: true,
        data: { date: dateStr, slots: [], reason: "off_day" },
      });
    }

    const persianWeekday = getPersianWeekdayNumber(dateStr);
    const schedule = doctor.schedule || {};
    const availableTimes =
      schedule[persianWeekday] ?? schedule[String(persianWeekday)] ?? [];

    const booked = await appointments
      .find({
        doctorId: id,
        date: dateStr,
        status: { $in: ["pending_payment", "confirmed", "completed"] },
      })
      .toArray();
    const bookedTimes = booked.map((a) => a.time);

    const today = getTodayTehran();
    const freeSlots = availableTimes.filter((time: string) => {
      if (bookedTimes.includes(time)) return false;
      if (dateStr === today && isTimePassedInTehran(dateStr, time)) {
        return false;
      }
      return true;
    });

    return NextResponse.json({
      success: true,
      data: { date: dateStr, slots: freeSlots },
    });
  } catch (err: any) {
    console.error("Error in available-slots:", err);
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}
