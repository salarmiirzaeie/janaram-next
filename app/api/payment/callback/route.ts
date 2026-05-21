import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { getZarinpal } from "@/lib/zarinpal";
import {
  completeSuccessfulPayment,
  isDevPaymentAuthority,
} from "@/lib/complete-payment";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const authority = searchParams.get("Authority");
  const status = searchParams.get("Status");

  const htmlResponse = (message: string, redirectUrl: string) => `
    <!DOCTYPE html>
    <html dir="rtl">
      <head>
        <meta charset="UTF-8">
        <title>در حال هدایت...</title>
        <style>
          body { font-family: 'Vazir', Tahoma, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
          .container { text-align: center; padding: 30px; background: white; border-radius: 20px; box-shadow: 0 10px 40px rgba(0,0,0,0.2); }
          .spinner { border: 4px solid #f3f3f3; border-top: 4px solid #4CAF50; border-radius: 50%; width: 50px; height: 50px; animation: spin 1s linear infinite; margin: 20px auto; }
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          .success { color: #4CAF50; }
          .error { color: #f44336; }
        </style>
        <script>
          setTimeout(() => { window.location.href = "${redirectUrl}"; }, 2000);
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

    if (payment.status === "SUCCESS" && payment.refId) {
      return new NextResponse(
        htmlResponse(
          "✅ پرداخت با موفقیت انجام شد. نوبت شما تأیید شد.",
          `${appRedirectBase}?status=success&ref_id=${payment.refId}&type=appointment`
        ),
        { headers: { "Content-Type": "text/html" } }
      );
    }

    if (
      isDevPaymentAuthority(authority) &&
      process.env.NODE_ENV !== "production"
    ) {
      const refId = `DEV-${Date.now()}`;
      await completeSuccessfulPayment(db, payment, refId);

      return new NextResponse(
        htmlResponse(
          "✅ پرداخت آزمایشی با موفقیت انجام شد. نوبت شما تأیید شد.",
          `${appRedirectBase}?status=success&ref_id=${refId}&type=appointment`
        ),
        { headers: { "Content-Type": "text/html" } }
      );
    }

    const zarinpal = getZarinpal();
    const verification = await zarinpal.verifications.verify({
      amount: payment.amount,
      authority: authority,
    });

    if (verification.data?.code === 100) {
      await payments.updateOne(
        { _id: payment._id },
        {
          $set: {
            cardPan: verification.data.card_pan,
            fee: verification.data.fee,
            feeType: verification.data.fee_type,
          },
        }
      );

      await completeSuccessfulPayment(
        db,
        payment,
        String(verification.data.ref_id)
      );

      return new NextResponse(
        htmlResponse(
          "✅ پرداخت با موفقیت انجام شد. نوبت شما تأیید شد.",
          `${appRedirectBase}?status=success&ref_id=${verification.data.ref_id}&type=appointment`
        ),
        { headers: { "Content-Type": "text/html" } }
      );
    } else {
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
