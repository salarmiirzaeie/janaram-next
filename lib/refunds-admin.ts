import type { Db } from "mongodb";
import { ObjectId } from "mongodb";
import { rialToToman } from "@/lib/financial";
import { formatSessionDateTimeFa } from "@/lib/booking-lifecycle";
import { smsRefundProcessed } from "@/lib/sms";

export type PendingRefundRow = {
  appointmentId: string;
  date: string;
  time: string;
  sessionWhenFa: string;
  sessionPriceToman: number;
  cancelReason?: string;
  cancelledAt?: string;
  patient: { id: string; name?: string; phone?: string };
  doctor: { id: string; name?: string; phone?: string };
  payment: {
    paymentId: string;
    refId?: string;
    amountToman: number;
    amountRial: number;
  } | null;
};

function cancelReasonLabel(reason?: string): string {
  if (reason === "doctor_cancelled") return "لغو توسط روانشناس";
  if (reason === "patient_cancelled_refund") return "لغو توسط مراجع (مشمول بازپرداخت)";
  return reason || "نامشخص";
}

export async function listPendingRefunds(db: Db): Promise<PendingRefundRow[]> {
  const appointments = db.collection("appointments");
  const users = db.collection("users");
  const psychologists = db.collection("psychologists");
  const payments = db.collection("payments");

  const pending = await appointments
    .find({ refundStatus: "pending", status: "cancelled" })
    .sort({ cancelledAt: -1, updatedAt: -1 })
    .toArray();

  const rows: PendingRefundRow[] = [];

  for (const a of pending) {
    const appointmentId = a._id.toString();
    const payment = await payments.findOne({
      appointmentId,
      status: "SUCCESS",
    });

    let patient = { id: a.userId as string, name: undefined as string | undefined, phone: undefined as string | undefined };
    try {
      const u = await users.findOne({ _id: new ObjectId(a.userId) });
      if (u) {
        patient = {
          id: a.userId,
          name: u.name,
          phone: u.phone,
        };
      }
    } catch {
      /* ignore */
    }

    let doctor = { id: a.doctorId as string, name: undefined as string | undefined, phone: undefined as string | undefined };
    try {
      const d = await psychologists.findOne({ _id: new ObjectId(a.doctorId) });
      if (d) {
        doctor = {
          id: a.doctorId,
          name: d.name,
          phone: d.phone,
        };
      }
    } catch {
      /* ignore */
    }

    const amountRial = (payment?.amount as number) || 0;
    const amountToman =
      payment?.amountToman ??
      (amountRial ? rialToToman(amountRial) : (a.sessionPrice as number) || 0);

    rows.push({
      appointmentId,
      date: a.date as string,
      time: a.time as string,
      sessionWhenFa: formatSessionDateTimeFa(
        a.date as string,
        a.time as string
      ),
      sessionPriceToman: (a.sessionPrice as number) || amountToman,
      cancelReason: cancelReasonLabel(a.cancelReason as string | undefined),
      cancelledAt: a.cancelledAt
        ? new Date(a.cancelledAt).toISOString()
        : undefined,
      patient,
      doctor,
      payment: payment
        ? {
            paymentId: payment._id.toString(),
            refId: payment.refId?.toString(),
            amountToman,
            amountRial,
          }
        : null,
    });
  }

  return rows;
}

export async function resolvePendingRefund(
  db: Db,
  appointmentId: string,
  params: {
    action: "processed" | "rejected";
    adminNote?: string;
    adminSub?: string;
  }
): Promise<{ ok: true } | { ok: false; message: string; status: number }> {
  const appointments = db.collection("appointments");
  const users = db.collection("users");

  let oid: ObjectId;
  try {
    oid = new ObjectId(appointmentId);
  } catch {
    return { ok: false, message: "شناسه نوبت نامعتبر است", status: 400 };
  }

  const appointment = await appointments.findOne({
    _id: oid,
    refundStatus: "pending",
    status: "cancelled",
  });

  if (!appointment) {
    return {
      ok: false,
      message: "نوبت در صف بازپرداخت یافت نشد یا قبلاً رسیدگی شده است",
      status: 404,
    };
  }

  const newRefundStatus =
    params.action === "processed" ? "processed" : "rejected";

  await appointments.updateOne(
    { _id: oid },
    {
      $set: {
        refundStatus: newRefundStatus,
        refundResolvedAt: new Date(),
        refundAdminNote: params.adminNote?.trim() || null,
        refundResolvedBy: params.adminSub || null,
        updatedAt: new Date(),
      },
    }
  );

  if (params.action === "processed") {
    try {
      const paymentsCol = db.collection("payments");
      const pay = await paymentsCol.findOne({
        appointmentId,
        status: "SUCCESS",
      });
      const payToman = pay?.amount ? rialToToman(pay.amount as number) : 0;
      const amountToman =
        (typeof appointment.sessionPrice === "number" &&
        appointment.sessionPrice > 0
          ? appointment.sessionPrice
          : payToman) || 0;

      const patient = await users.findOne({
        _id: new ObjectId(appointment.userId),
      });
      if (patient?.phone) {
        await smsRefundProcessed({
          phone: patient.phone,
          amountToman,
        });
      }
    } catch (e) {
      console.error("[refunds-admin] SMS after processed:", e);
    }
  }

  return { ok: true };
}
