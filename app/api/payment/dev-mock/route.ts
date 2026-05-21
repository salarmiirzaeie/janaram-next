import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

/** Local-only fake Zarinpal page when sandbox API is rate-limited */
export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  const paymentId = req.nextUrl.searchParams.get("paymentId");
  if (!paymentId) {
    return NextResponse.json({ message: "paymentId required" }, { status: 400 });
  }

  const db = (await clientPromise).db("janaram-db");
  const payment = await db
    .collection("payments")
    .findOne({ _id: new ObjectId(paymentId) });

  if (!payment?.authority) {
    return NextResponse.json({ message: "Payment not found" }, { status: 404 });
  }

  const authority = payment.authority as string;
  const amountToman =
    payment.amountToman ?? Math.round((payment.amount as number) / 10);
  const payUrl = `/api/payment/callback?Authority=${encodeURIComponent(authority)}&Status=OK`;

  const html = `<!DOCTYPE html>
<html dir="rtl" lang="fa">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>درگاه آزمایشی زرین‌پال</title>
  <style>
    body { font-family: Tahoma, sans-serif; margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #f4f6f8; }
    .card { background: #fff; padding: 28px; border-radius: 16px; box-shadow: 0 8px 30px rgba(0,0,0,.08); max-width: 360px; width: 90%; text-align: center; }
    .badge { display: inline-block; background: #fff3cd; color: #856404; padding: 6px 12px; border-radius: 8px; font-size: 13px; margin-bottom: 16px; }
    h1 { font-size: 20px; margin: 0 0 8px; }
    p { color: #555; font-size: 14px; line-height: 1.7; }
    .amount { font-size: 22px; font-weight: bold; color: #2e7d32; margin: 16px 0; }
    a { display: block; background: #00a693; color: #fff; text-decoration: none; padding: 14px; border-radius: 10px; font-size: 16px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">حالت توسعه — sandbox محدود شده</div>
    <h1>پرداخت آزمایشی</h1>
    <p>زرین‌پال sandbox موقتاً درخواست نمی‌پذیرد. برای تست رزرو، پرداخت را شبیه‌سازی کنید.</p>
    <div class="amount">${amountToman.toLocaleString("fa-IR")} تومان</div>
    <a href="${payUrl}">پرداخت آزمایشی موفق</a>
  </div>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
