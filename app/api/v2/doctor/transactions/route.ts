import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { withDoctorAuth } from "@/lib/doctor/lib/middleware/withDoctorAuth";

export const GET = withDoctorAuth(async (req: NextRequest, doctor: any) => {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const skip = (page - 1) * limit;

    const db = (await clientPromise).db("janaram-db");
    const transactions = db.collection("transactions");

    const filter: Record<string, unknown> = { doctorId: doctor.sub };

    if (status && status !== "all") {
      filter.status = status;
    }
    if (type && type !== "all") {
      filter.type = type;
    }
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        (filter.createdAt as Record<string, Date>).$gte = new Date(startDate);
      }
      if (endDate) {
        (filter.createdAt as Record<string, Date>).$lte = new Date(endDate);
      }
    }

    const transactionList = await transactions
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    const total = await transactions.countDocuments(filter);

    const formatPersianDate = (date: Date) =>
      new Intl.DateTimeFormat("fa-IR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(date);

    const formattedTransactions = transactionList.map((t) => ({
      id: t._id.toString(),
      date: formatPersianDate(t.createdAt),
      amount: t.amount,
      commission: t.commission,
      net: t.net,
      status: t.status,
      type: t.type,
      description: t.description,
      patientName: t.patientName || null,
      referenceId: t.referenceId,
      appointmentId: t.appointmentId || null,
      createdAt: t.createdAt,
    }));

    return NextResponse.json({
      success: true,
      data: {
        transactions: formattedTransactions,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (err: any) {
    console.error("Error fetching transactions:", err);
    return NextResponse.json(
      { success: false, message: "خطای سرور" },
      { status: 500 }
    );
  }
});

/** Doctors cannot manually create ledger entries — deposits come from payments */
export const POST = withDoctorAuth(async () => {
  return NextResponse.json(
    {
      success: false,
      message: "ثبت دستی تراکنش مجاز نیست. درآمد پس از پرداخت موفق بیمار ثبت می‌شود.",
    },
    { status: 403 }
  );
});
