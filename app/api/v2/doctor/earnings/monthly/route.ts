import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { withDoctorAuth } from "@/lib/doctor/lib/middleware/withDoctorAuth";

// GET : دریافت درآمد ماهانه به تفکیک ماه
export const GET = withDoctorAuth(async (req: NextRequest, doctor: any) => {
  try {
    const db = (await clientPromise).db("janaram-db");
    const payments = db.collection("payments");
    const appointments = db.collection("appointments");

    // دریافت پرداخت‌های موفق ماهانه
    const monthlyPayments = await payments
      .aggregate([
        {
          $match: {
            status: "SUCCESS", // فقط پرداخت‌های موفق
          },
        },
        {
          $lookup: {
            from: "appointments",
            localField: "appointmentId",
            foreignField: "_id",
            as: "appointment",
          },
        },
        {
          $unwind: {
            path: "$appointment",
            preserveNullAndEmptyArrays: false,
          },
        },
        {
          $match: {
            "appointment.doctorId": doctor.sub, // فقط نوبت‌های این دکتر
          },
        },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
            },
            amount: { $sum: "$amount" }, // کل مبلغ پرداختی (ریال)
            commission: { $sum: { $multiply: ["$amount", 0.1] } }, // کارمزد ۱۰٪
            net: { $sum: { $multiply: ["$amount", 0.9] } }, // خالص دریافتی بعد از کارمزد
            transactionCount: { $sum: 1 },
          },
        },
        {
          $sort: { "_id.year": -1, "_id.month": -1 },
        },
      ])
      .toArray();
    console.log(monthlyPayments);
    // دریافت تعداد جلسات انجام شده در هر ماه
    const monthlyAppointments = await appointments
      .aggregate([
        {
          $match: {
            doctorId: doctor.sub,
            status: "completed",
          },
        },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
            },
            count: { $sum: 1 },
          },
        },
      ])
      .toArray();

    // تبدیل به فرمت readable
    const monthsMap: Record<string, string> = {
      "1": "فروردین",
      "2": "اردیبهشت",
      "3": "خرداد",
      "4": "تیر",
      "5": "مرداد",
      "6": "شهریور",
      "7": "مهر",
      "8": "آبان",
      "9": "آذر",
      "10": "دی",
      "11": "بهمن",
      "12": "اسفند",
    };

    // ایجاد نقشه برای جلسات
    const appointmentsMap = new Map();
    monthlyAppointments.forEach((item) => {
      const key = `${item._id.year}-${item._id.month}`;
      appointmentsMap.set(key, item.count);
    });

    // ساخت خروجی نهایی (تبدیل ریال به تومان)
    const result = monthlyPayments.map((item) => {
      const year = item._id.year;
      const month = item._id.month;
      const key = `${year}-${month}`;
      const persianMonth = monthsMap[month.toString()];

      // تبدیل ریال به تومان (تقسیم بر ۱۰)
      const amountInTomans = Math.floor(item.amount / 10);
      const commissionInTomans = Math.floor(item.commission / 10);
      const netInTomans = Math.floor(item.net / 10);

      return {
        year,
        month: item._id.month,
        persianMonth: `${persianMonth} ${year}`,
        amount: amountInTomans, // کل درآمد ناخالص (تومان)
        commission: commissionInTomans, // کارمزد (۱۰٪) (تومان)
        net: netInTomans, // خالص دریافتی (تومان)
        appointments: appointmentsMap.get(key) || 0,
        transactions: item.transactionCount,
      };
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (err: any) {
    console.error("Error fetching monthly earnings:", err);
    return NextResponse.json(
      { success: false, message: "خطای سرور" },
      { status: 500 }
    );
  }
});
