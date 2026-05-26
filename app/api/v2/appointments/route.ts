import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { withAuth } from "@/lib/middleware/withAuth";
import {
  APPROVED_DOCTOR_FILTER,
  ensureBookingIndexes,
  expireStalePendingPayments,
  PENDING_PAYMENT_EXPIRY_MINUTES,
  validateBookableSlot,
} from "@/lib/booking";
import { initiateAppointmentPayment } from "@/lib/initiate-appointment-payment";

export const POST = withAuth(async (req: NextRequest, user: any) => {
  try {
    const { doctorId, date, time, initiatePayment, mobile, email } =
      await req.json();
    if (!doctorId || !date || !time) {
      return NextResponse.json(
        { success: false, message: "اطلاعات ناقص" },
        { status: 400 }
      );
    }

    const db = (await clientPromise).db("janaram-db");
    await ensureBookingIndexes(db);
    void expireStalePendingPayments(db);

    const appointments = db.collection("appointments");
    const psychologists = db.collection("psychologists");

    const doctor = await psychologists.findOne({
      _id: new ObjectId(doctorId),
      ...APPROVED_DOCTOR_FILTER,
    });
    if (!doctor) {
      return NextResponse.json(
        { success: false, message: "روانشناس نامعتبر یا غیرفعال" },
        { status: 404 }
      );
    }

    const slotCheck = validateBookableSlot(doctor, date, time);
    if (!slotCheck.ok) {
      return NextResponse.json(
        { success: false, message: slotCheck.message },
        { status: slotCheck.status }
      );
    }

    const existing = await appointments.findOne({
      doctorId,
      date,
      time,
      status: { $in: ["pending_payment", "confirmed", "completed"] },
    });
    if (existing) {
      return NextResponse.json(
        { success: false, message: "این زمان قبلاً رزرو شده است" },
        { status: 409 }
      );
    }

    const sessionPrice = doctor.sessionPrice || 0;
    const paymentExpiresAt = new Date(
      Date.now() + PENDING_PAYMENT_EXPIRY_MINUTES * 60 * 1000
    );

    const appointment = {
      doctorId,
      userId: user.sub,
      date,
      time,
      status: "pending_payment",
      sessionPrice,
      createdAt: new Date(),
      paymentExpiresAt,
    };

    const result = await appointments.insertOne(appointment);
    const appointmentId = result.insertedId.toString();

    const responseData: Record<string, unknown> = {
      appointmentId,
      doctorName: doctor.name,
      date,
      time,
      status: "pending_payment",
      sessionPrice,
      paymentExpiresAt: paymentExpiresAt.toISOString(),
      paymentExpiresInMinutes: PENDING_PAYMENT_EXPIRY_MINUTES,
    };

    if (initiatePayment === true) {
      const payment = await initiateAppointmentPayment(db, {
        userId: user.sub,
        appointmentId,
        description: `پرداخت هزینه جلسه مشاوره با ${doctor.name}`,
        mobile,
        email,
      });

      if (payment.ok) {
        Object.assign(responseData, {
          paymentUrl: payment.paymentUrl,
          authority: payment.authority,
          paymentId: payment.paymentId,
          amountToman: payment.amountToman,
          devMock: payment.devMock,
        });
      } else {
        Object.assign(responseData, {
          paymentError: payment.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message:
        "نوبت با موفقیت ایجاد شد. لطفاً برای تأیید نهایی، هزینه جلسه را پرداخت کنید.",
      data: responseData,
    });
  } catch (err: any) {
    if (err?.code === 11000) {
      return NextResponse.json(
        { success: false, message: "این زمان قبلاً رزرو شده است" },
        { status: 409 }
      );
    }
    console.error("Error creating appointment:", err);
    return NextResponse.json(
      { success: false, message: err.message || "خطای سرور" },
      { status: 500 }
    );
  }
});
