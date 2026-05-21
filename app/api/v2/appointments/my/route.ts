import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { withAuth } from "@/lib/middleware/withAuth";
import { ObjectId } from "mongodb";
import { expireStalePendingPayments } from "@/lib/booking";
import {
  canPatientCancelWithRefund,
  isReviewWindowOpen,
  PATIENT_REFUND_MIN_HOURS,
} from "@/lib/booking-lifecycle";

export const GET = withAuth(async (req: NextRequest, user: any) => {
  try {
    const db = (await clientPromise).db("janaram-db");
    await expireStalePendingPayments(db);

    const appointments = db.collection("appointments");
    const psychologists = db.collection("psychologists");
    const reviews = db.collection("reviews");

    const myAppointments = await appointments
      .find({ userId: user.sub })
      .sort({ date: -1, time: -1 })
      .toArray();

    const appointmentIds = myAppointments.map((a) => a._id.toString());
    const existingReviews = await reviews
      .find({ appointmentId: { $in: appointmentIds } })
      .project({ appointmentId: 1 })
      .toArray();
    const reviewedSet = new Set(
      existingReviews.map((r) => r.appointmentId as string)
    );

    const doctorIds = [...new Set(myAppointments.map((a) => a.doctorId))];
    const doctors = await psychologists
      .find({ _id: { $in: doctorIds.map((id) => new ObjectId(id)) } })
      .toArray();

    const doctorMap = new Map<string, string>();
    const doctorPriceMap = new Map<string, number>();

    doctors.forEach((d) => {
      doctorMap.set(d._id.toString(), d.name);
      doctorPriceMap.set(d._id.toString(), d.sessionPrice || 0);
    });

    const enriched = myAppointments.map((a) => {
      const id = a._id.toString();
      const hasReview = reviewedSet.has(id);
      const canReview =
        a.status === "completed" && !hasReview && isReviewWindowOpen(a);

      const canCancelWithRefund =
        a.status === "confirmed" &&
        a.payoutStatus === "held" &&
        canPatientCancelWithRefund(a);

      return {
        id,
        doctorId: a.doctorId,
        doctorName: doctorMap.get(a.doctorId) || "نامشخص",
        sessionPrice: a.sessionPrice ?? doctorPriceMap.get(a.doctorId) ?? 0,
        date: a.date,
        time: a.time,
        status: a.status,
        createdAt: a.createdAt,
        paymentExpiresAt: a.paymentExpiresAt,
        paidAt: a.paidAt,
        cancelReason: a.cancelReason,
        refundStatus: a.refundStatus,
        refundResolvedAt: a.refundResolvedAt
          ? new Date(a.refundResolvedAt).toISOString()
          : undefined,
        payoutStatus: a.payoutStatus,
        completedAt: a.completedAt,
        reviewEligibleUntil: a.reviewEligibleUntil,
        hasReview,
        canReview,
        canCancelWithRefund,
        patientRefundMinHours: PATIENT_REFUND_MIN_HOURS,
      };
    });

    return NextResponse.json({
      success: true,
      data: enriched,
    });
  } catch (err: any) {
    console.error("Error fetching user appointments:", err);
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
});
