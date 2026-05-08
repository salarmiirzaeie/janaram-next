// app/api/psychologists/[id]/available-slots/route.ts
import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import moment from "moment-jalaali";

moment.loadPersian({ dialect: "persian-modern", usePersianDigits: false });

function getPersianWeekday(dateStr: string): number {
  // استفاده مستقیم از متد day() در moment-jalaali
  const m = moment(dateStr);
  const weekday = m.day(); // 0=شنبه, 1=یکشنبه, ..., 6=جمعه

  console.log("getPersianWeekday:", {
    dateStr,
    weekday,
    weekdayName: getWeekdayName(weekday),
  });

  return weekday;
}

function getWeekdayName(weekday: number): string {
  const days = [
    "شنبه",
    "یکشنبه",
    "دوشنبه",
    "سه‌شنبه",
    "چهارشنبه",
    "پنجشنبه",
    "جمعه",
  ];
  return days[weekday];
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get("date");

    if (!dateStr) {
      return NextResponse.json(
        { success: false, message: "تاریخ الزامی است" },
        { status: 400 }
      );
    }

    const db = (await clientPromise).db("janaram-db");
    const psychologists = db.collection("psychologists");
    const appointments = db.collection("appointments");

    const doctor = await psychologists.findOne({ _id: new ObjectId(id) });
    if (!doctor) {
      return NextResponse.json(
        { success: false, message: "روانشناس یافت نشد" },
        { status: 404 }
      );
    }

    const persianWeekday = getPersianWeekday(dateStr);
    const schedule = doctor.schedule || {};
    const availableTimes = schedule[persianWeekday] || [];

    const booked = await appointments
      .find({ doctorId: id, date: dateStr, status: { $ne: "cancelled" } })
      .toArray();
    const bookedTimes = booked.map((a) => a.time);

    const freeSlots = availableTimes.filter(
      (time: string) => !bookedTimes.includes(time)
    );

    console.log({
      dateStr,
      persianWeekday,
      persianWeekdayName: getWeekdayName(persianWeekday),
      scheduleKeys: Object.keys(schedule).map(
        (k) => `${k}=${getWeekdayName(parseInt(k))}`
      ),
      availableTimesCount: availableTimes.length,
      freeSlotsCount: freeSlots.length,
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
