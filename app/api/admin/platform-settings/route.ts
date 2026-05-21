import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { withAdminAuth } from "@/lib/middleware/withAdmin";
import {
  getPlatformFinancialSettings,
  setPlatformCommissionRate,
  getCommissionPercentLabel,
  getDoctorSharePercentLabel,
} from "@/lib/platform-settings";

export const GET = withAdminAuth(async () => {
  try {
    const db = (await clientPromise).db("janaram-db");
    const settings = await getPlatformFinancialSettings(db);
    return NextResponse.json({
      success: true,
      data: {
        ...settings,
        commissionPercentLabel: getCommissionPercentLabel(
          settings.commissionRate
        ),
        doctorSharePercentLabel: getDoctorSharePercentLabel(
          settings.commissionRate
        ),
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "خطای سرور" },
      { status: 500 }
    );
  }
});

export const PUT = withAdminAuth(async (req: NextRequest, admin: any) => {
  try {
    const body = await req.json();
    const rate = Number(body.commissionRate);
    if (Number.isNaN(rate) || rate < 0 || rate > 1) {
      return NextResponse.json(
        {
          success: false,
          message: "کارمزد باید عددی بین ۰ و ۱ باشد (مثلاً ۰.۲ برای ۲۰٪)",
        },
        { status: 400 }
      );
    }

    const db = (await clientPromise).db("janaram-db");
    const settings = await setPlatformCommissionRate(
      db,
      rate,
      admin?.sub
    );

    return NextResponse.json({
      success: true,
      message: "تنظیمات ذخیره شد",
      data: {
        ...settings,
        commissionPercentLabel: getCommissionPercentLabel(
          settings.commissionRate
        ),
        doctorSharePercentLabel: getDoctorSharePercentLabel(
          settings.commissionRate
        ),
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "خطای سرور" },
      { status: 500 }
    );
  }
});
