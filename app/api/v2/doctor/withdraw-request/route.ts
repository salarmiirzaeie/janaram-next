import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { withDoctorAuth } from "@/lib/doctor/lib/middleware/withDoctorAuth";

// GET : دریافت تاریخچه درخواست‌های تسویه
export const GET = withDoctorAuth(async (req: NextRequest, doctor: any) => {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const db = (await clientPromise).db("janaram-db");
    const withdrawRequests = db.collection("withdraw_requests");

    let filter: any = { doctorId: doctor.sub };
    if (status && status !== "all") {
      filter.status = status;
    }

    const requests = await withdrawRequests
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    const total = await withdrawRequests.countDocuments(filter);

    const formatPersianDate = (date: Date) => {
      return new Intl.DateTimeFormat("fa-IR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(date);
    };

    const formattedRequests = requests.map((req) => ({
      id: req._id.toString(),
      amount: req.amount,
      status: req.status,
      bankAccount: req.bankAccount,
      rejectionReason: req.rejectionReason || null,
      createdAt: formatPersianDate(req.createdAt),
      processedAt: req.processedAt ? formatPersianDate(req.processedAt) : null,
    }));

    return NextResponse.json({
      success: true,
      data: {
        requests: formattedRequests,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (err: any) {
    console.error("Error fetching withdraw requests:", err);
    return NextResponse.json(
      { success: false, message: "خطای سرور" },
      { status: 500 }
    );
  }
});

// POST : ثبت درخواست تسویه حساب جدید
export const POST = withDoctorAuth(async (req: NextRequest, doctor: any) => {
  try {
    const { amount } = await req.json();

    if (!amount || amount < 50000) {
      return NextResponse.json(
        { success: false, message: "حداقل مبلغ تسویه ۵۰,۰۰۰ تومان است" },
        { status: 400 }
      );
    }

    const db = (await clientPromise).db("janaram-db");
    const bankAccounts = db.collection("doctor_bank_accounts");
    const withdrawRequests = db.collection("withdraw_requests");
    const transactions = db.collection("transactions");

    // بررسی وجود حساب بانکی
    const bankAccount = await bankAccounts.findOne({ doctorId: doctor.sub });
    if (!bankAccount) {
      return NextResponse.json(
        {
          success: false,
          message: "لطفاً ابتدا اطلاعات حساب بانکی خود را کامل کنید",
        },
        { status: 400 }
      );
    }

    // بررسی درخواست تسویه در انتظار قبلی
    const pendingRequest = await withdrawRequests.findOne({
      doctorId: doctor.sub,
      status: "pending",
    });

    if (pendingRequest) {
      return NextResponse.json(
        { success: false, message: "شما یک درخواست تسویه در انتظار دارید" },
        { status: 400 }
      );
    }

    // محاسبه موجودی قابل تسویه
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

    const totalEarnings = totalEarningsAgg[0]?.total || 0;
    const totalWithdrawn = totalWithdrawnAgg[0]?.total || 0;
    const availableBalance = totalEarnings - totalWithdrawn;

    if (amount > availableBalance) {
      return NextResponse.json(
        {
          success: false,
          message: `موجودی قابل تسویه شما ${availableBalance.toLocaleString()} تومان است`,
        },
        { status: 400 }
      );
    }

    // ایجاد درخواست تسویه
    const newRequest = {
      doctorId: doctor.sub,
      amount,
      status: "pending",
      bankAccount: {
        accountName: bankAccount.accountName,
        bankName: bankAccount.bankName,
        cardNumber: bankAccount.cardNumber,
        sheba: bankAccount.sheba,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await withdrawRequests.insertOne(newRequest);

    // ایجاد تراکنش برداشت با وضعیت pending
    const referenceId = `WD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    await transactions.insertOne({
      doctorId: doctor.sub,
      amount,
      commission: 0,
      net: amount,
      type: "withdrawal",
      status: "pending",
      description: "درخواست تسویه حساب",
      referenceId,
      withdrawRequestId: result.insertedId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: "درخواست تسویه حساب با موفقیت ثبت شد",
      data: { id: result.insertedId.toString(), amount, status: "pending" },
    });
  } catch (err: any) {
    console.error("Error creating withdraw request:", err);
    return NextResponse.json(
      { success: false, message: "خطای سرور" },
      { status: 500 }
    );
  }
});

// PUT : بروزرسانی وضعیت درخواست تسویه (فقط برای ادمین)
export const PUT = withDoctorAuth(async (req: NextRequest, doctor: any) => {
  try {
    const url = new URL(req.url);
    const pathSegments = url.pathname.split("/");
    const requestId = pathSegments[pathSegments.length - 1];

    if (!requestId) {
      return NextResponse.json(
        { success: false, message: "شناسه درخواست نامعتبر است" },
        { status: 400 }
      );
    }

    const { status, rejectionReason } = await req.json();

    if (!status || !["approved", "rejected", "paid"].includes(status)) {
      return NextResponse.json(
        { success: false, message: "وضعیت نامعتبر است" },
        { status: 400 }
      );
    }

    if (status === "rejected" && !rejectionReason) {
      return NextResponse.json(
        { success: false, message: "لطفاً دلیل رد شدن را وارد کنید" },
        { status: 400 }
      );
    }

    const db = (await clientPromise).db("janaram-db");
    const withdrawRequests = db.collection("withdraw_requests");
    const transactions = db.collection("transactions");

    const request = await withdrawRequests.findOne({
      _id: new ObjectId(requestId),
    });
    if (!request) {
      return NextResponse.json(
        { success: false, message: "درخواست یافت نشد" },
        { status: 404 }
      );
    }

    const updateFields: any = {
      status,
      updatedAt: new Date(),
      processedAt: new Date(),
    };

    if (status === "rejected") {
      updateFields.rejectionReason = rejectionReason;
    }

    await withdrawRequests.updateOne(
      { _id: new ObjectId(requestId) },
      { $set: updateFields }
    );

    // بروزرسانی تراکنش مربوطه
    await transactions.updateOne(
      { withdrawRequestId: requestId },
      {
        $set: {
          status: status === "approved" ? "success" : "failed",
          updatedAt: new Date(),
        },
      }
    );

    const message =
      status === "approved"
        ? "درخواست تسویه تأیید شد"
        : status === "paid"
        ? "تسویه حساب انجام شد"
        : "درخواست تسویه رد شد";

    return NextResponse.json({
      success: true,
      message,
    });
  } catch (err: any) {
    console.error("Error updating withdraw request:", err);
    return NextResponse.json(
      { success: false, message: "خطای سرور" },
      { status: 500 }
    );
  }
});
