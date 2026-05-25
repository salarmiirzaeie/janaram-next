import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { withAuth } from "@/lib/middleware/withAuth";
import {
  createZarinpalPayment,
  getDevMockPaymentUrl,
  getPaymentCallbackUrl,
} from "@/lib/zarinpal-gateway";

export const POST = withAuth(async (req: NextRequest, user: any) => {
  try {
    const { appointmentId, amount, description, mobile, email } =
      await req.json();

    if (!appointmentId) {
      return NextResponse.json(
        { success: false, message: "شناسه نوبت الزامی است" },
        { status: 400 }
      );
    }

    let userId: ObjectId;
    try {
      userId = new ObjectId(user.sub);
    } catch {
      return NextResponse.json(
        { success: false, message: "شناسه کاربر نامعتبر است" },
        { status: 400 }
      );
    }

    const db = (await clientPromise).db("janaram-db");
    const appointments = db.collection("appointments");
    const payments = db.collection("payments");

    const appointment = await appointments.findOne({
      _id: new ObjectId(appointmentId),
      userId: user.sub,
    });

    if (!appointment) {
      return NextResponse.json(
        { success: false, message: "نوبت یافت نشد" },
        { status: 404 }
      );
    }

    if (appointment.status !== "pending_payment") {
      return NextResponse.json(
        { success: false, message: "این نوبت قابل پرداخت نیست" },
        { status: 400 }
      );
    }

    const amountToman =
      amount && amount >= 1000 ? amount : appointment.sessionPrice;

    if (!amountToman || amountToman < 1000) {
      return NextResponse.json(
        { success: false, message: "اطلاعات پرداخت نامعتبر است" },
        { status: 400 }
      );
    }

    const amountInRial = amountToman * 10;

    const paymentResult = await payments.insertOne({
      userId,
      appointmentId,
      amount: amountInRial,
      amountToman,
      description: description || "پرداخت هزینه جلسه مشاوره",
      status: "PENDING",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const paymentId = paymentResult.insertedId.toString();
    const callbackUrl = getPaymentCallbackUrl();

    const gateway = await createZarinpalPayment({
      amountInRial,
      callbackUrl,
      description: description || "پرداخت هزینه جلسه مشاوره",
      mobile,
      email,
    });

    if (gateway.ok) {
      await payments.updateOne(
        { _id: paymentResult.insertedId },
        { $set: { authority: gateway.authority, updatedAt: new Date() } }
      );

      return NextResponse.json({
        success: true,
        authority: gateway.authority,
        paymentUrl: gateway.paymentUrl,
        paymentId,
      });
    }

    // Sandbox rate-limited: local dev mock (same flow as booking test)
    if (
      gateway.code === -12 &&
      process.env.NODE_ENV !== "production"
    ) {
      const authority = `DEV-${paymentId}`;
      await payments.updateOne(
        { _id: paymentResult.insertedId },
        {
          $set: {
            authority,
            devMock: true,
            updatedAt: new Date(),
          },
        }
      );

      return NextResponse.json({
        success: true,
        authority,
        paymentUrl: getDevMockPaymentUrl(paymentId),
        paymentId,
        devMock: true,
      });
    }

    await payments.updateOne(
      { _id: paymentResult.insertedId },
      {
        $set: {
          status: "FAILED",
          errorMessage: gateway.message,
          updatedAt: new Date(),
        },
      }
    );

    return NextResponse.json(
      { success: false, message: gateway.message },
      { status: gateway.code === -12 ? 429 : 400 }
    );
  } catch (err: any) {
    console.error("Error in payment request:", err?.response?.data ?? err);
    return NextResponse.json(
      { success: false, message: "خطای سرور در ایجاد درخواست پرداخت" },
      { status: 500 }
    );
  }
});
