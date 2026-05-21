import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { withDoctorAuth } from "@/lib/doctor/lib/middleware/withDoctorAuth";

/** Doctor: history of payouts made by admin */
export const GET = withDoctorAuth(async (req: NextRequest, doctor: any) => {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const db = (await clientPromise).db("janaram-db");
    const settlements = db.collection("settlements");

    const filter = { doctorId: doctor.sub, status: "paid" };

    const list = await settlements
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    const total = await settlements.countDocuments(filter);

    const formatPersianDate = (date: Date) =>
      new Intl.DateTimeFormat("fa-IR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(date);

    return NextResponse.json({
      success: true,
      data: {
        settlements: list.map((s) => ({
          id: s._id.toString(),
          amount: s.amount,
          settlementDate: s.settlementDate,
          note: s.note,
          referenceId: s.referenceId,
          paidAt: s.paidAt ? formatPersianDate(s.paidAt) : null,
          createdAt: formatPersianDate(s.createdAt),
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (err: any) {
    console.error("Error fetching doctor settlements:", err);
    return NextResponse.json(
      { success: false, message: "خطای سرور" },
      { status: 500 }
    );
  }
});
