import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { withDoctorAuth } from "@/lib/doctor/lib/middleware/withDoctorAuth";
import { formatMonthLabel } from "@/lib/financial";

export const GET = withDoctorAuth(async (req: NextRequest, doctor: any) => {
  try {
    const db = (await clientPromise).db("janaram-db");
    const transactions = db.collection("transactions");
    const appointments = db.collection("appointments");

    const monthlyDeposits = await transactions
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
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
            },
            amount: { $sum: "$amount" },
            commission: { $sum: "$commission" },
            net: { $sum: "$net" },
            transactionCount: { $sum: 1 },
          },
        },
        { $sort: { "_id.year": -1, "_id.month": -1 } },
      ])
      .toArray();

    const monthlyAppointments = await appointments
      .aggregate([
        {
          $match: {
            doctorId: doctor.sub,
            status: "completed",
          },
        },
        {
          $addFields: {
            completedDate: { $ifNull: ["$completedAt", "$updatedAt"] },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: "$completedDate" },
              month: { $month: "$completedDate" },
            },
            count: { $sum: 1 },
          },
        },
      ])
      .toArray();

    const appointmentsMap = new Map<string, number>();
    monthlyAppointments.forEach((item) => {
      if (item._id.year && item._id.month) {
        appointmentsMap.set(
          `${item._id.year}-${item._id.month}`,
          item.count
        );
      }
    });

    const result = monthlyDeposits.map((item) => {
      const year = item._id.year;
      const month = item._id.month;
      const key = `${year}-${month}`;

      return {
        year,
        month,
        persianMonth: formatMonthLabel(year, month),
        amount: item.amount,
        commission: item.commission,
        net: item.net,
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
