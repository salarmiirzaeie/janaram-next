import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { withAuth } from "@/lib/middleware/withAuth";

export const POST = withAuth(async (req: NextRequest, user: any) => {
  try {
    const { doctorId, date, time } = await req.json();
    if (!doctorId || !date || !time) {
      return NextResponse.json(
        { success: false, message: "اطلاعات ناقص" },
        { status: 400 }
      );
    }

    const db = (await clientPromise).db("janaram-db");
    const appointments = db.collection("appointments");
    const psychologists = db.collection("psychologists");

    // 1. Check doctor exists
    const doctor = await psychologists.findOne({ _id: new ObjectId(doctorId) });
    if (!doctor) {
      return NextResponse.json(
        { success: false, message: "روانشناس نامعتبر" },
        { status: 404 }
      );
    }

    // 2. Check double booking
    const existing = await appointments.findOne({
      doctorId,
      date,
      time,
      status: { $ne: "cancelled" },
    });
    if (existing) {
      return NextResponse.json(
        { success: false, message: "این زمان قبلاً رزرو شده است" },
        { status: 409 }
      );
    }

    // 3. Create appointment (بدون بررسی اشتراک و جلسات باقی‌مانده)
    const appointment = {
      doctorId,
      userId: user.sub,
      date,
      time,
      status: "pending_payment", // وضعیت: منتظر پرداخت
      createdAt: new Date(),
    };
    const result = await appointments.insertOne(appointment);

    return NextResponse.json({
      success: true,
      message:
        "نوبت با موفقیت ایجاد شد. لطفاً برای تأیید نهایی، هزینه جلسه را پرداخت کنید.",
      data: {
        appointmentId: result.insertedId.toString(),
        doctorName: doctor.name,
        date,
        time,
        status: "pending_payment",
        sessionPrice: doctor.sessionPrice, // قیمت جلسه برای پرداخت
      },
    });
  } catch (err: any) {
    console.error("Error creating appointment:", err);
    return NextResponse.json(
      { success: false, message: err.message || "خطای سرور" },
      { status: 500 }
    );
  }
});
