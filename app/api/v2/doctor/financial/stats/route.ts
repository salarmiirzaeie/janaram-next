import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { withDoctorAuth } from "@/lib/doctor/lib/middleware/withDoctorAuth";
import { getDoctorFinancialSummary, getCommissionContext } from "@/lib/financial";
import { getTodayTehran } from "@/lib/booking";

export const GET = withDoctorAuth(async (req: NextRequest, doctor: any) => {
  try {
    const db = (await clientPromise).db("janaram-db");
    const appointments = db.collection("appointments");
    const commission = await getCommissionContext(db);

    const today = getTodayTehran();
    const allTime = await getDoctorFinancialSummary(db, doctor.sub);
    const todaySummary = await getDoctorFinancialSummary(db, doctor.sub, {
      date: today,
    });

    const totalAppointments = await appointments.countDocuments({
      doctorId: doctor.sub,
      status: "completed",
    });

    const todayAppointments = await appointments.countDocuments({
      doctorId: doctor.sub,
      date: today,
      status: { $ne: "cancelled" },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...commission,
        totalGross: allTime.totalGross,
        totalPlatformFee: allTime.totalPlatformFee,
        totalDoctorShare: allTime.totalDoctorShare,
        totalSettled: allTime.totalSettled,
        pendingPayout: allTime.pendingPayout,
        totalEarnings: allTime.totalDoctorShare,
        pendingBalance: allTime.pendingPayout,
        today: {
          date: today,
          gross: todaySummary.totalGross,
          platformFee: todaySummary.totalPlatformFee,
          doctorShare: todaySummary.totalDoctorShare,
          settled: todaySummary.totalSettled,
          pendingPayout: todaySummary.pendingPayout,
          sessionCount: todaySummary.sessionCount,
        },
        totalAppointments,
        todayAppointments,
        currentMonthEarnings: allTime.totalDoctorShare,
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
