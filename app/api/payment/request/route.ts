import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { withAuth } from "@/lib/middleware/withAuth";
import { getZarinpal, getPaymentRedirectUrl } from "@/lib/zarinpal";

export const POST = withAuth(async (req: NextRequest, user: any) => {
  try {
    const { appointmentId, amount, description, mobile, email } =
      await req.json();
    console.log({ appointmentId, amount, description, mobile, email });
    if (!appointmentId || !amount || amount < 1000) {
      return NextResponse.json(
        { success: false, message: "اطلاعات پرداخت نامعتبر است" },
        { status: 400 }
      );
    }

    const amountInRial = amount * 10;

    let userId: ObjectId;
    try {
      userId = new ObjectId(user.sub);
    } catch (err) {
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

    // ✅ ذخیره appointmentId در رکورد پرداخت
    const paymentResult = await payments.insertOne({
      userId: userId,
      appointmentId: appointmentId, // ← این مهم است
      amount: amountInRial,
      description: description || `پرداخت هزینه جلسه مشاوره`,
      status: "PENDING",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const isSandbox = process.env.NODE_ENV !== "production";
    const callbackUrl = `${
      isSandbox ? "http://10.209.40.162:3000" : process.env.NEXT_PUBLIC_SITE_URL
    }/api/payment/callback`;
    const zarinpal = getZarinpal();

    const response = await zarinpal.payments.create({
      amount: amountInRial,
      callback_url: callbackUrl,
      description: description || `پرداخت هزینه جلسه مشاوره`,
      mobile: mobile || undefined,
      email: email || undefined,
    });

    if (response.data?.code === 100 && response.data?.authority) {
      const authority = response.data.authority;

      await payments.updateOne(
        { _id: paymentResult.insertedId },
        {
          $set: {
            authority: authority,
            updatedAt: new Date(),
          },
        }
      );

      const paymentUrl = getPaymentRedirectUrl(authority);

      return NextResponse.json({
        success: true,
        authority: authority,
        paymentUrl: paymentUrl,
        paymentId: paymentResult.insertedId.toString(),
      });
    } else {
      await payments.updateOne(
        { _id: paymentResult.insertedId },
        {
          $set: {
            status: "FAILED",
            errorMessage: response.data?.message || "خطا در اتصال به درگاه",
            updatedAt: new Date(),
          },
        }
      );

      return NextResponse.json(
        {
          success: false,
          message: response.data?.message || "خطا در ایجاد درخواست پرداخت",
        },
        { status: 400 }
      );
    }
  } catch (err: any) {
    console.error("Error in payment request:", err);
    return NextResponse.json(
      { success: false, message: "خطای سرور در ایجاد درخواست پرداخت" },
      { status: 500 }
    );
  }
});
