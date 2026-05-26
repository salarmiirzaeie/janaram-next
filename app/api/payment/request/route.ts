import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { withAuth } from "@/lib/middleware/withAuth";
import { initiateAppointmentPayment } from "@/lib/initiate-appointment-payment";

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

    const db = (await clientPromise).db("janaram-db");

    const result = await initiateAppointmentPayment(db, {
      userId: user.sub,
      appointmentId,
      description,
      mobile,
      email,
      amountTomanOverride: amount,
    });

    if (!result.ok) {
      return NextResponse.json(
        { success: false, message: result.message, code: result.code },
        { status: result.status }
      );
    }

    return NextResponse.json({
      success: true,
      authority: result.authority,
      paymentUrl: result.paymentUrl,
      paymentId: result.paymentId,
      amountToman: result.amountToman,
      amountInRial: result.amountInRial,
      devMock: result.devMock,
      reused: result.reused,
    });
  } catch (err: unknown) {
    console.error("Error in payment request:", err);
    return NextResponse.json(
      { success: false, message: "خطا در ایجاد درخواست پرداخت" },
      { status: 500 }
    );
  }
});
