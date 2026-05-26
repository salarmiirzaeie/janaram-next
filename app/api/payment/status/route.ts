import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { withAuth } from "@/lib/middleware/withAuth";

/** Fast poll after returning from Zarinpal in the mobile app */
export const GET = withAuth(async (req: NextRequest, user: any) => {
  try {
    const appointmentId = req.nextUrl.searchParams.get("appointmentId");
    if (!appointmentId) {
      return NextResponse.json(
        { success: false, message: "appointmentId الزامی است" },
        { status: 400 }
      );
    }

    const db = (await clientPromise).db("janaram-db");
    const appointment = await db.collection("appointments").findOne({
      _id: new ObjectId(appointmentId),
      userId: user.sub,
    });

    if (!appointment) {
      return NextResponse.json(
        { success: false, message: "نوبت یافت نشد" },
        { status: 404 }
      );
    }

    const payment = await db.collection("payments").findOne(
      { appointmentId, userId: new ObjectId(user.sub) },
      { sort: { createdAt: -1 } }
    );

    return NextResponse.json({
      success: true,
      data: {
        appointmentStatus: appointment.status,
        paid: appointment.status === "confirmed",
        paymentStatus: payment?.status ?? null,
        refId: payment?.refId ?? appointment.paymentRefId ?? null,
      },
    });
  } catch (err: unknown) {
    console.error("payment status:", err);
    return NextResponse.json(
      { success: false, message: "خطا در بررسی وضعیت پرداخت" },
      { status: 500 }
    );
  }
});
