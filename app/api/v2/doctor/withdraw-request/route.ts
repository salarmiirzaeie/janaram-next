import { NextRequest, NextResponse } from "next/server";
import { withDoctorAuth } from "@/lib/doctor/lib/middleware/withDoctorAuth";

/** تسویه فقط توسط مدیریت (پنل ادمین) انجام می‌شود */
export const GET = withDoctorAuth(async () => {
  return NextResponse.json({
    success: true,
    data: {
      requests: [],
      pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
      message:
        "تسویه حساب توسط مدیریت جانارام در پایان هر روز به حساب بانکی شما واریز می‌شود.",
    },
  });
});

export const POST = withDoctorAuth(async () => {
  return NextResponse.json(
    {
      success: false,
      message:
        "درخواست تسویه از طریق اپ امکان‌پذیر نیست. مدیریت در پایان روز مبلغ سهم شما (۸۰٪) را به حساب بانکی واریز می‌کند.",
    },
    { status: 400 }
  );
});
