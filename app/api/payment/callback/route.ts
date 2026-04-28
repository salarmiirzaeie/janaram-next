// app/api/payment/callback/route.ts
import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { getZarinpal } from "@/lib/zarinpal";
const https = require("https");

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const authority = searchParams.get("Authority");
  const status = searchParams.get("Status");

  // صفحه HTML برای هدایت به اپلیکیشن
  const htmlResponse = (message: string, redirectUrl: string) => `
    <!DOCTYPE html>
    <html dir="rtl">
      <head>
        <meta charset="UTF-8">
        <title>در حال هدایت...</title>
        <style>
          body {
            font-family: 'Vazir', Tahoma, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          }
          .container {
            text-align: center;
            padding: 30px;
            background: white;
            border-radius: 20px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
          }
          .spinner {
            border: 4px solid #f3f3f3;
            border-top: 4px solid #4CAF50;
            border-radius: 50%;
            width: 50px;
            height: 50px;
            animation: spin 1s linear infinite;
            margin: 20px auto;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          .success { color: #4CAF50; }
          .error { color: #f44336; }
        </style>
        <script>
          setTimeout(() => {
            window.location.href = "${redirectUrl}";
          }, 2000);
        </script>
      </head>
      <body>
        <div class="container">
          <div class="spinner"></div>
          <h3>${message}</h3>
          <p>در حال هدایت به اپلیکیشن...</p>
        </div>
      </body>
    </html>
  `;

  const appRedirectBase = "janaram://";

  // بررسی Status مطابق مستندات
  if (status !== "OK" || !authority) {
    return new NextResponse(
      htmlResponse(
        "❌ پرداخت ناموفق",
        `${appRedirectBase}?status=failed&message=پرداخت%20لغو%20شد`
      ),
      { headers: { "Content-Type": "text/html" } }
    );
  }

  try {
    const db = (await clientPromise).db("janaram-db");
    const payments = db.collection("payments");
    const users = db.collection("users");

    // پیدا کردن پرداخت بر اساس authority
    const payment = await payments.findOne({ authority: authority });

    if (!payment) {
      return new NextResponse(
        htmlResponse(
          "❌ پرداخت یافت نشد",
          `${appRedirectBase}?status=failed&message=پرداخت%20یافت%20نشد`
        ),
        { headers: { "Content-Type": "text/html" } }
      );
    }

    // تایید پرداخت با زرین‌پال طبق مستندات
    const zarinpal = getZarinpal();

    const verification = await zarinpal.verifications.verify({
      amount: payment.amount,
      authority: authority,
    });

    console.log("Verification result:", verification);

    // بررسی کد وضعیت طبق مستندات
    // کد 100: موفق, کد 101: قبلاً تایید شده
    if (verification.data?.code === 100) {
      // محاسبه تاریخ انقضای اشتراک (30 روز)
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30);

      // به‌روزرسانی وضعیت پرداخت
      await payments.updateOne(
        { _id: payment._id },
        {
          $set: {
            status: "SUCCESS",
            refId: verification.data.ref_id,
            cardPan: verification.data.card_pan,
            fee: verification.data.fee,
            feeType: verification.data.fee_type,
            verifiedAt: new Date(),
            updatedAt: new Date(),
          },
        }
      );

      // فعال‌سازی اشتراک کاربر
      await users.updateOne(
        { _id: new ObjectId(payment.userId) },
        {
          $set: {
            plan: "unlimited",
            subscriptionDuration: 1,
            subscriptionEndDate: endDate,
            updatedAt: new Date(),
            conversationCount: {
              date: new Date().toISOString().split("T")[0],
              count: 0,
            },
          },
        }
      );
      const data = JSON.stringify({
        bodyId: 447300,
        to: "09381811680",
      });

      const options = {
        hostname: "console.melipayamak.com",
        port: 443,
        path: "/api/send/shared/6be212aadaea410b97e5ba4e98171dca",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": data.length,
        },
      };

      const req = https.request(options, (res: any) => {
        res.on("data", (d: any) => {
          process.stdout.write(d);
        });
      });

      req.on("error", (error: any) => {
        console.error(error);
      });

      req.write(data);
      req.end();

      return new NextResponse(
        htmlResponse(
          "✅ پرداخت با موفقیت انجام شد",
          `${appRedirectBase}?status=success&ref_id=${verification.data.ref_id}`
        ),
        { headers: { "Content-Type": "text/html" } }
      );
    } else if (verification.data?.code === 101) {
      // پرداخت قبلاً تایید شده (Duplicate verification)
      return new NextResponse(
        htmlResponse(
          "ℹ️ این پرداخت قبلاً تایید شده است",
          `${appRedirectBase}?status=already_verified&ref_id=${verification.data.ref_id}`
        ),
        { headers: { "Content-Type": "text/html" } }
      );
    } else {
      // پرداخت ناموفق
      await payments.updateOne(
        { _id: payment._id },
        {
          $set: {
            status: "FAILED",
            errorMessage: verification.data?.message || "خطا در تایید پرداخت",
            updatedAt: new Date(),
          },
        }
      );

      return new NextResponse(
        htmlResponse(
          "❌ پرداخت ناموفق بود",
          `${appRedirectBase}?status=failed&message=تایید%20پرداخت%20ناموفق`
        ),
        { headers: { "Content-Type": "text/html" } }
      );
    }
  } catch (err: any) {
    console.error("Error in payment callback:", err);
    return new NextResponse(
      htmlResponse(
        "⚠️ خطا در پردازش پرداخت",
        `${appRedirectBase}?status=error&message=خطا%20در%20سرور`
      ),
      { headers: { "Content-Type": "text/html" } }
    );
  }
}
