// app/api/payment/inquiry/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getZarinpal } from "@/lib/zarinpal";
import { withAuth } from "@/lib/middleware/withAuth";

export const POST = withAuth(async (req: NextRequest, user: any) => {
  try {
    const { authority } = await req.json();

    if (!authority) {
      return NextResponse.json(
        { success: false, message: "Authority الزامی است" },
        { status: 400 }
      );
    }

    const zarinpal = getZarinpal();

    // استعلام تراکنش طبق مستندات
    const inquiryResult = await zarinpal.inquiries.inquire({
      authority: authority,
    });

    console.log("Inquiry result:", inquiryResult);

    return NextResponse.json({
      success: true,
      data: {
        code: inquiryResult.data?.code,
        message: inquiryResult.data?.message,
        status: inquiryResult.data?.status,
      },
    });
  } catch (err: any) {
    console.error("Error in inquiry:", err);
    return NextResponse.json(
      { success: false, message: "خطا در استعلام تراکنش" },
      { status: 500 }
    );
  }
});
