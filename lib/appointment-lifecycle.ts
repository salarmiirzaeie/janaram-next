import type { Db, Document } from "mongodb";
import { ObjectId } from "mongodb";
import {
  canDoctorMarkCompleted,
  canDoctorMarkNoShow,
  canPatientCancelWithRefund,
  formatSessionDateTimeFa,
  getReviewEligibleUntil,
  NO_SHOW_GRACE_MINUTES,
  PATIENT_REFUND_MIN_HOURS,
} from "@/lib/booking-lifecycle";
import {
  forfeitHeldPayout,
  releaseDoctorEarningsFromAppointment,
} from "@/lib/financial";
import {
  smsAppointmentCancelled,
  smsNoShowPatient,
  smsSessionCompleted,
} from "@/lib/sms";

type AppointmentDoc = Document & {
  _id: ObjectId;
  userId: string;
  doctorId: string;
  date: string;
  time: string;
  status: string;
  payoutStatus?: string;
};

export async function applyDoctorStatusChange(
  db: Db,
  appointment: AppointmentDoc,
  newStatus: "completed" | "no-show",
  options?: { note?: string }
): Promise<{ ok: true } | { ok: false; message: string; status: number }> {
  const appointments = db.collection("appointments");
  const users = db.collection("users");
  const psychologists = db.collection("psychologists");

  const sessionWhen = formatSessionDateTimeFa(
    appointment.date,
    appointment.time
  );

  if (newStatus === "completed") {
    if (!canDoctorMarkCompleted(appointment)) {
      return {
        ok: false,
        status: 400,
        message:
          "فقط پس از شروع زمان جلسه می‌توانید جلسه را «انجام‌شده» ثبت کنید.",
      };
    }

    const completedAt = new Date();
    await appointments.updateOne(
      { _id: appointment._id },
      {
        $set: {
          status: "completed",
          completedAt,
          completedBy: "doctor",
          completionNote: options?.note || null,
          reviewEligibleUntil: getReviewEligibleUntil(completedAt),
          updatedAt: new Date(),
        },
      }
    );

    await releaseDoctorEarningsFromAppointment(
      db,
      appointment._id.toString()
    );

    try {
      const patient = await users.findOne({
        _id: new ObjectId(appointment.userId),
      });
      const doctor = await psychologists.findOne({
        _id: new ObjectId(appointment.doctorId),
      });
      if (patient?.phone) {
        await smsSessionCompleted({
          phone: patient.phone,
          doctorName: doctor?.name || "روانشناس",
        });
      }
    } catch (e) {
      console.error("[lifecycle] completed SMS:", e);
    }

    return { ok: true };
  }

  if (newStatus === "no-show") {
    if (!canDoctorMarkNoShow(appointment)) {
      return {
        ok: false,
        status: 400,
        message: `حداقل ${NO_SHOW_GRACE_MINUTES} دقیقه پس از شروع جلسه می‌توانید «حضور نیافت» را ثبت کنید. پیشنهاد می‌شود ابتدا با مراجع تماس بگیرید.`,
      };
    }

    await appointments.updateOne(
      { _id: appointment._id },
      {
        $set: {
          status: "no-show",
          noShowReportedAt: new Date(),
          noShowReportedBy: "doctor",
          completionNote: options?.note || null,
          refundStatus: "none",
          updatedAt: new Date(),
        },
      }
    );

    if (appointment.payoutStatus === "held") {
      await releaseDoctorEarningsFromAppointment(
        db,
        appointment._id.toString()
      );
    }

    try {
      const patient = await users.findOne({
        _id: new ObjectId(appointment.userId),
      });
      if (patient?.phone) {
        await smsNoShowPatient({
          phone: patient.phone,
          sessionWhen,
        });
      }
    } catch (e) {
      console.error("[lifecycle] no-show SMS:", e);
    }

    return { ok: true };
  }

  return { ok: false, status: 400, message: "وضعیت نامعتبر" };
}

export async function applyPatientCancellation(
  db: Db,
  appointment: AppointmentDoc
): Promise<
  | { ok: true; refundPending: boolean; doctorKeepsPayment: boolean }
  | { ok: false; message: string; status: number }
> {
  const users = db.collection("users");

  const refundPending =
    appointment.status === "confirmed" &&
    appointment.payoutStatus === "held" &&
    canPatientCancelWithRefund(appointment);

  const doctorKeepsPayment =
    appointment.status === "confirmed" &&
    appointment.payoutStatus === "held" &&
    !refundPending;

  const sessionWhen = formatSessionDateTimeFa(
    appointment.date,
    appointment.time
  );

  const appointments = db.collection("appointments");

  await appointments.updateOne(
    { _id: appointment._id },
    {
      $set: {
        status: "cancelled",
        cancelledAt: new Date(),
        cancelledBy: "patient",
        cancelReason: refundPending
          ? "patient_cancelled_refund"
          : "patient_cancelled_late",
        refundStatus: refundPending ? "pending" : "none",
        updatedAt: new Date(),
      },
    }
  );

  if (appointment.payoutStatus === "held") {
    if (refundPending) {
      await forfeitHeldPayout(db, appointment._id.toString(), {
        refundStatus: "pending",
        cancelReason: "patient_cancelled_refund",
      });
    } else if (doctorKeepsPayment) {
      await releaseDoctorEarningsFromAppointment(
        db,
        appointment._id.toString()
      );
    }
  }

  try {
    const patient = await users.findOne({
      _id: new ObjectId(appointment.userId),
    });
    if (patient?.phone && appointment.status === "confirmed") {
      await smsAppointmentCancelled({
        phone: patient.phone,
        sessionWhen,
        refundPending,
      });
    }
  } catch (e) {
    console.error("[lifecycle] patient cancel SMS:", e);
  }

  return { ok: true, refundPending, doctorKeepsPayment };
}

export function getPatientCancelPolicyMessage(refundPending: boolean): string {
  if (refundPending) {
    return `نوبت لغو شد. چون بیش از ${PATIENT_REFUND_MIN_HOURS} ساعت تا شروع جلسه مانده بود، مبلغ شما در صف بازپرداخت قرار گرفت.`;
  }
  return `نوبت لغو شد. کمتر از ${PATIENT_REFUND_MIN_HOURS} ساعت به زمان جلسه مانده بود؛ طبق قوانین مبلغ به روانشناس تعلق می‌گیرد و بازپرداختی انجام نمی‌شود.`;
}
