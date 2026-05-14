import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { withDoctorAuth } from "@/lib/doctor/lib/middleware/withDoctorAuth";

// GET : دریافت لیست تراکنش‌ها با فیلتر و صفحه‌بندی
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

    // ساخت فیلتر
    let filter: any = { doctorId: doctor.sub };

    if (status && status !== "all") {
      filter.status = status;
    }
    if (type && type !== "all") {
      filter.type = type;
    }
    if (startDate) {
      filter.createdAt = { ...filter.createdAt, $gte: new Date(startDate) };
    }
    if (endDate) {
      filter.createdAt = { ...filter.createdAt, $lte: new Date(endDate) };
    }

    // دریافت تراکنش‌ها با صفحه‌بندی
    const transactionList = await transactions
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    // تعداد کل تراکنش‌ها برای پیجینیشن
    const total = await transactions.countDocuments(filter);

    // فرمت کردن تاریخ شمسی برای هر تراکنش
    const formatPersianDate = (date: Date) => {
      return new Intl.DateTimeFormat("fa-IR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(date);
    };

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

// POST : ثبت تراکنش جدید (برای واریز یا برداشت)
export const POST = withDoctorAuth(async (req: NextRequest, doctor: any) => {
  try {
    const body = await req.json();
    const { amount, type, description, patientName, appointmentId } = body;

    if (!amount || !type || !description) {
      return NextResponse.json(
        { success: false, message: "اطلاعات ناقص است" },
        { status: 400 }
      );
    }

    const commission = type === "deposit" ? Math.floor(amount * 0.1) : 0;
    const net = type === "deposit" ? amount - commission : amount;

    const db = (await clientPromise).db("janaram-db");
    const transactions = db.collection("transactions");

    // ایجاد شماره پیگیری یکتا
    const referenceId = `TRX-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const newTransaction = {
      doctorId: doctor.sub,
      appointmentId: appointmentId || null,
      amount,
      commission,
      net,
      type,
      status: type === "deposit" ? "success" : "pending",
      description,
      patientName: patientName || null,
      referenceId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await transactions.insertOne(newTransaction);

    // اگر درخواست برداشت است، یک رکورد در withdraw_requests هم ایجاد کن
    if (type === "withdrawal") {
      const withdrawRequests = db.collection("withdraw_requests");
      await withdrawRequests.insertOne({
        doctorId: doctor.sub,
        transactionId: result.insertedId,
        amount,
        status: "pending",
        createdAt: new Date(),
      });
    }

    return NextResponse.json({
      success: true,
      message:
        type === "deposit" ? "واریز با موفقیت ثبت شد" : "درخواست برداشت ثبت شد",
      data: { id: result.insertedId.toString(), referenceId },
    });
  } catch (err: any) {
    console.error("Error creating transaction:", err);
    return NextResponse.json(
      { success: false, message: "خطای سرور" },
      { status: 500 }
    );
  }
});
