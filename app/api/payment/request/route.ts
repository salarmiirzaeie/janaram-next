// app/api/payment/request/route.ts
import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { withAuth } from "@/lib/middleware/withAuth";
import { getZarinpal, getPaymentRedirectUrl } from "@/lib/zarinpal";

export const POST = withAuth(async (req: NextRequest, user: any) => {
  try {
    const { planId, amount, description, mobile, email } = await req.json();
    let amouuntInRial = amount * 10;
    // اعتبارسنجی
    if (!planId || !amouuntInRial || amouuntInRial < 10000) {
      return NextResponse.json(
        { success: false, message: "مبلغ نامعتبر است (حداقل 10,000 ریال)" },
        { status: 400 }
      );
    }

    // تبدیل userId
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
    const users = db.collection("users");
    const payments = db.collection("payments");

    // بررسی وضعیت اشتراک فعلی کاربر
    const userDoc = await users.findOne({ _id: userId });
    const now = new Date();

    if (
      userDoc?.plan !== "free" &&
      userDoc?.subscriptionEndDate &&
      userDoc.subscriptionEndDate > now
    ) {
      return NextResponse.json(
        { success: false, message: "شما در حال حاضر اشتراک فعال دارید" },
        { status: 400 }
      );
    }

    // ایجاد رکورد پرداخت در دیتابیس
    const paymentResult = await payments.insertOne({
      userId: userId,
      planId: planId,
      amount: amouuntInRial,
      description: description,
      status: "PENDING",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const isSandbox = process.env.NODE_ENV !== "production";
    const paymentId = paymentResult.insertedId;
    const callbackUrl = `${
      isSandbox
        ? "http://10.213.178.162:3000"
        : process.env.NEXT_PUBLIC_SITE_URL
    }/api/payment/callback`;

    // درخواست به زرین‌پال با استفاده از SDK (طبق مستندات)
    const zarinpal = getZarinpal();

    const response = await zarinpal.payments.create({
      amount: amouuntInRial,
      callback_url: callbackUrl,
      description: description,
      mobile: mobile || undefined,
      email: email || undefined,
      // currency: 'IRR', // پیش‌فرض IRR است
    });

    console.log("Zarinpal payment response:", response);

    // بررسی پاسخ بر اساس مستندات
    if (response.data?.code === 100 && response.data?.authority) {
      const authority = response.data.authority;

      // به‌روزرسانی رکورد پرداخت با authority
      await payments.updateOne(
        { _id: paymentId },
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
        paymentId: paymentId.toString(),
      });
    } else {
      // خطا در درخواست به زرین‌پال
      await payments.updateOne(
        { _id: paymentId },
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
