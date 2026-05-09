import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

// تبدیل تاریخ میلادی به نام روز هفته فارسی (با استفاده از Intl)
function getPersianWeekdayName(dateStr: string): string {
  const date = new Date(dateStr);
  const formatter = new Intl.DateTimeFormat("fa-IR", {
    timeZone: "Asia/Tehran",
    weekday: "long",
  });
  return formatter.format(date);
}

// تبدیل نام روز فارسی به عدد (0=شنبه تا 6=جمعه)
function getPersianWeekdayNumber(dateStr: string): number {
  const dayName = getPersianWeekdayName(dateStr);
  const weekdayMap: Record<string, number> = {
    شنبه: 0,
    یکشنبه: 1,
    دوشنبه: 2,
    سه‌شنبه: 3,
    چهارشنبه: 4,
    پنجشنبه: 5,
    جمعه: 6,
  };
  return weekdayMap[dayName] ?? 0;
}

function getWeekdayName(weekday: number): string {
  const days = ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه"];
  return days[weekday];
}

// بررسی آیا زمان انتخابی از زمان فعلی گذشته است یا نه
function isTimePassed(dateStr: string, timeStr: string): boolean {
  const now = new Date();
  const appointmentDateTime = new Date(`${dateStr}T${timeStr}:00`);
  
  // تنظیم منطقه زمانی ایران
  const iranTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Tehran" }));
  const appointmentIranTime = new Date(appointmentDateTime.toLocaleString("en-US", { timeZone: "Asia/Tehran" }));
  
  return appointmentIranTime < iranTime;
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

    // محاسبه روز هفته شمسی بدون استفاده از moment
    const persianWeekday = getPersianWeekdayNumber(dateStr);
    const schedule = doctor.schedule || {};
    const availableTimes = schedule[persianWeekday] || [];

    // دریافت نوبت‌های رزرو شده برای این تاریخ
    const booked = await appointments
      .find({ doctorId: id, date: dateStr, status: { $ne: "cancelled" } })
      .toArray();
    const bookedTimes = booked.map((a) => a.time);

    // فیلتر کردن زمان‌های خالی و حذف زمان‌های گذشته
    const freeSlots = availableTimes.filter((time: string) => {
      // اگر تاریخ امروز است، زمان‌های گذشته را حذف کن
      const today = new Date().toISOString().split("T")[0];
      if (dateStr === today && isTimePassed(dateStr, time)) {
        return false;
      }
      // اگر زمان رزرو شده است، حذف کن
      return !bookedTimes.includes(time);
    });

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