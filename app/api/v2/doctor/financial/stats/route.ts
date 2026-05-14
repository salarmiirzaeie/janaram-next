import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { withDoctorAuth } from "@/lib/doctor/lib/middleware/withDoctorAuth";

// GET : دریافت آمار مالی (کل درآمد، در انتظار تسویه، تعداد جلسات)
export const GET = withDoctorAuth(async (req: NextRequest, doctor: any) => {
  try {
    const db = (await clientPromise).db("janaram-db");
    const transactions = db.collection("transactions");
    const appointments = db.collection("appointments");
    const withdrawRequests = db.collection("withdraw_requests");

    // 1. کل درآمد خالص (تمام واریزهای موفق)
    const totalEarningsAgg = await transactions
      .aggregate([
        {
          $match: {
            doctorId: doctor.sub,
            type: "deposit",
            status: "success",
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$net" },
          },
        },
      ])
      .toArray();

    const totalEarnings = totalEarningsAgg[0]?.total || 0;

    // 2. مبلغ در انتظار تسویه (مبالغ واریز شده که هنوز تسویه نشده‌اند)
    // محاسبه: کل درآمد واریز شده - کل مبالغ تسویه شده
    const totalWithdrawnAgg = await transactions
      .aggregate([
        {
          $match: {
            doctorId: doctor.sub,
            type: "withdrawal",
            status: "success",
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$amount" },
          },
        },
      ])
      .toArray();

    const totalWithdrawn = totalWithdrawnAgg[0]?.total || 0;
    const pendingBalance = totalEarnings - totalWithdrawn;

    // 3. تعداد کل جلسات انجام شده
    const totalAppointments = await appointments.countDocuments({
      doctorId: doctor.sub,
      status: "completed",
    });

    // 4. تعداد جلسات امروز
    const today = new Date().toISOString().split("T")[0];
    const todayAppointments = await appointments.countDocuments({
      doctorId: doctor.sub,
      date: today,
      status: { $ne: "cancelled" },
    });

    // 5. درآمد ماه جاری
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfMonthStr = startOfMonth.toISOString().split("T")[0];
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const endOfMonthStr = endOfMonth.toISOString().split("T")[0];

    const currentMonthEarningsAgg = await transactions
      .aggregate([
        {
          $match: {
            doctorId: doctor.sub,
            type: "deposit",
            status: "success",
            date: { $gte: startOfMonthStr, $lte: endOfMonthStr },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$net" },
          },
        },
      ])
      .toArray();

    const currentMonthEarnings = currentMonthEarningsAgg[0]?.total || 0;

    return NextResponse.json({
      success: true,
      data: {
        totalEarnings, // کل درآمد خالص
        pendingBalance, // مبلغ در انتظار تسویه
        totalAppointments, // کل جلسات انجام شده
        todayAppointments, // جلسات امروز
        currentMonthEarnings, // درآمد ماه جاری
      },
    });
  } catch (err: any) {
    console.error("Error fetching financial stats:", err);
    return NextResponse.json(
      { success: false, message: "خطای سرور" },
      { status: 500 }
    );
  }
});
