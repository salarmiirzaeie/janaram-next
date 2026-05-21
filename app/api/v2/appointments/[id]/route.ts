import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { withAuth } from "@/lib/middleware/withAuth";
import {
  applyPatientCancellation,
  getPatientCancelPolicyMessage,
} from "@/lib/appointment-lifecycle";

export const DELETE = withAuth(async (req: NextRequest, user: any) => {
  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/");
    const id = pathParts[pathParts.length - 1];

    if (!id) {
      return NextResponse.json(
        { success: false, message: "شناسه نوبت نامعتبر است" },
        { status: 400 }
      );
    }

    const db = (await clientPromise).db("janaram-db");
    const appointments = db.collection("appointments");

    const appointment = await appointments.findOne({ _id: new ObjectId(id) });
    if (!appointment) {
      return NextResponse.json(
        { success: false, message: "نوبت یافت نشد" },
        { status: 404 }
      );
    }

    if (appointment.userId !== user.sub) {
      return NextResponse.json(
        { success: false, message: "شما مجاز به لغو این نوبت نیستید" },
        { status: 403 }
      );
    }

    if (appointment.status === "cancelled") {
      return NextResponse.json(
        { success: false, message: "این نوبت قبلاً لغو شده است" },
        { status: 400 }
      );
    }

    if (appointment.status === "completed" || appointment.status === "no-show") {
      return NextResponse.json(
        { success: false, message: "این نوبت قابل لغو نیست" },
        { status: 400 }
      );
    }

    if (appointment.status === "pending_payment") {
      await appointments.updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            status: "cancelled",
            cancelledAt: new Date(),
            cancelledBy: "patient",
            cancelReason: "patient_cancelled_unpaid",
            updatedAt: new Date(),
          },
        }
      );
      return NextResponse.json({
        success: true,
        message: "نوبت لغو شد",
        refundPending: false,
      });
    }

    if (appointment.status === "confirmed") {
      const result = await applyPatientCancellation(db, appointment as any);
      if (!result.ok) {
        return NextResponse.json(
          { success: false, message: result.message },
          { status: result.status }
        );
      }

      return NextResponse.json({
        success: true,
        message: getPatientCancelPolicyMessage(result.refundPending),
        refundPending: result.refundPending,
        doctorKeepsPayment: result.doctorKeepsPayment,
      });
    }

    return NextResponse.json(
      { success: false, message: "وضعیت نوبت قابل لغو نیست" },
      { status: 400 }
    );
  } catch (err: any) {
    console.error("Error cancelling appointment:", err);
    return NextResponse.json(
      { success: false, message: err.message || "خطای سرور" },
      { status: 500 }
    );
  }
});
