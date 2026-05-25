import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import {
  PATIENT_REFUND_MIN_HOURS,
  NO_SHOW_GRACE_MINUTES,
  REVIEW_WINDOW_DAYS,
} from "@/lib/booking-lifecycle";
import { getPlatformFinancialSettings } from "@/lib/platform-settings";

/** Public booking/payment rules for app and web */
export async function GET() {
  try {
    const db = (await clientPromise).db("janaram-db");
    const financial = await getPlatformFinancialSettings(db);
    const doctorPct = Math.round((1 - financial.commissionRate) * 100);

    return NextResponse.json({
      success: true,
      data: {
        commissionRate: financial.commissionRate,
        doctorSharePercent: doctorPct,
        platformSharePercent: Math.round(financial.commissionRate * 100),
        patientRefundMinHours: PATIENT_REFUND_MIN_HOURS,
        noShowGraceMinutes: NO_SHOW_GRACE_MINUTES,
        reviewWindowDays: REVIEW_WINDOW_DAYS,
        doctorCanCancel: false,
        patientCancelRefundRule: `لغو بیش از ${PATIENT_REFUND_MIN_HOURS} ساعت قبل از جلسه: بازپرداخت کامل. کمتر از آن: مبلغ به روانشناس.`,
        doctorPayoutRule:
          "مبلغ پس از مشخص شدن وضعیت جلسه (انجام‌شده، عدم پاسخ، یا لغو دیرهنگام مراجع) در گزارش مالی روانشناس ثبت می‌شود.",
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}
