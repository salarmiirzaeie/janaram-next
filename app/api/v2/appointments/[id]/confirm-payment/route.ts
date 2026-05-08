import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { withAuth } from "@/lib/middleware/withAuth";

export const POST = withAuth(async (req: NextRequest, user: any) => {
  try {
    // استخراج ID از URL
    const url = new URL(req.url);
    const pathSegments = url.pathname.split("/");
    const id = pathSegments[pathSegments.length - 2]; // چون confirm-payment در مسیر هست

    if (!id) {
      return NextResponse.json(
        { success: false, message: "شناسه نوبت نامعتبر است" },
        { status: 400 }
      );
    }

    const { paymentRefId } = await req.json();

    const db = (await clientPromise).db("janaram-db");
    const appointments = db.collection("appointments");

    // پیدا کردن نوبت
    const appointment = await appointments.findOne({
      _id: new ObjectId(id),
      userId: user.sub,
    });

    if (!appointment) {
      return NextResponse.json(
        { success: false, message: "نوبت یافت نشد" },
        { status: 404 }
      );
    }

    // بررسی وضعیت فعلی
    if (appointment.status === "confirmed") {
      return NextResponse.json(
        { success: false, message: "این نوبت قبلاً تأیید شده است" },
        { status: 400 }
      );
    }

    if (appointment.status === "cancelled") {
      return NextResponse.json(
        { success: false, message: "این نوبت لغو شده است" },
        { status: 400 }
      );
    }

    if (appointment.status !== "pending_payment") {
      return NextResponse.json(
        { success: false, message: "وضعیت نوبت برای پرداخت مناسب نیست" },
        { status: 400 }
      );
    }

    // تأیید پرداخت و تغییر وضعیت
    await appointments.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          status: "confirmed",
          paymentRefId: paymentRefId,
          paidAt: new Date(),
          updatedAt: new Date(),
        },
      }
    );

    return NextResponse.json({
      success: true,
      message: "پرداخت با موفقیت انجام شد. نوبت شما تأیید شد.",
    });
  } catch (err: any) {
    console.error("Error confirming payment:", err);
    return NextResponse.json(
      { success: false, message: err.message || "خطای سرور" },
      { status: 500 }
    );
  }
});
