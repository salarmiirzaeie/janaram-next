import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { withAdminAuth } from "@/lib/middleware/withAdmin";
import { releaseDoctorEarningsFromAppointment } from "@/lib/financial";

/** Backfill: release doctor earnings for sessions missing ledger rows */
export const POST = withAdminAuth(async () => {
  try {
    const db = (await clientPromise).db("janaram-db");
    const appointments = db.collection("appointments");

    const eligible = await appointments
      .find({
        payoutStatus: { $ne: "released" },
        $or: [
          { status: "completed" },
          { status: "no-show" },
          {
            status: "cancelled",
            cancelReason: "patient_cancelled_late",
          },
        ],
      })
      .toArray();

    let created = 0;
    let skipped = 0;

    for (const app of eligible) {
      const result = await releaseDoctorEarningsFromAppointment(
        db,
        app._id.toString()
      );
      if (result.created) created++;
      else skipped++;
    }

    return NextResponse.json({
      success: true,
      message: `همگام‌سازی: ${created} واریز جدید، ${skipped} بدون تغییر`,
      data: { created, skipped, total: eligible.length },
    });
  } catch (err: any) {
    console.error("Error syncing deposits:", err);
    return NextResponse.json(
      { success: false, message: "خطای سرور" },
      { status: 500 }
    );
  }
});
