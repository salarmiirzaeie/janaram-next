import { Db, ObjectId } from "mongodb";
import { formatSessionDateTimeFa } from "@/lib/booking-lifecycle";
import {
  smsAppointmentPaid,
  smsDoctorNewBooking,
} from "@/lib/sms";

export function isDevPaymentAuthority(authority: string): boolean {
  return authority.startsWith("DEV-");
}

async function sendPaymentNotifications(
  db: Db,
  appointment: {
    date: string;
    time: string;
    userId: string;
    doctorId: string;
  }
) {
  const users = db.collection("users");
  const psychologists = db.collection("psychologists");
  const sessionWhen = formatSessionDateTimeFa(
    appointment.date,
    appointment.time
  );

  try {
    const patient = await users.findOne({
      _id: new ObjectId(appointment.userId),
    });
    if (patient?.phone) {
      const doctor = await psychologists.findOne({
        _id: new ObjectId(appointment.doctorId),
      });
      await smsAppointmentPaid({
        phone: patient.phone,
        doctorName: doctor?.name || "روانشناس",
        sessionWhen,
      });
    }
  } catch (e) {
    console.error("[complete-payment] patient SMS:", e);
  }

  try {
    const doctor = await psychologists.findOne({
      _id: new ObjectId(appointment.doctorId),
    });
    const patient = await users.findOne({
      _id: new ObjectId(appointment.userId),
    });
    if (doctor?.phone) {
      await smsDoctorNewBooking({
        phone: doctor.phone,
        patientName: patient?.name || "مراجع",
        sessionWhen,
      });
    }
  } catch (e) {
    console.error("[complete-payment] doctor SMS:", e);
  }
}

export async function completeSuccessfulPayment(
  db: Db,
  payment: {
    _id: ObjectId;
    appointmentId?: string;
    amount?: number;
  },
  refId: string,
  options?: { cardPan?: string; fee?: number; feeType?: string }
) {
  const payments = db.collection("payments");
  const appointments = db.collection("appointments");

  await payments.updateOne(
    { _id: payment._id },
    {
      $set: {
        status: "SUCCESS",
        refId,
        verifiedAt: new Date(),
        updatedAt: new Date(),
        ...(options?.cardPan ? { cardPan: options.cardPan } : {}),
        ...(options?.fee != null ? { fee: options.fee } : {}),
        ...(options?.feeType ? { feeType: options.feeType } : {}),
      },
    }
  );

  if (!payment.appointmentId) return;

  const appointment = await appointments.findOne({
    _id: new ObjectId(payment.appointmentId),
  });
  if (!appointment) return;

  if (appointment.status === "confirmed") return;

  await appointments.updateOne(
    { _id: appointment._id },
    {
      $set: {
        status: "confirmed",
        paidAt: new Date(),
        paymentRefId: refId,
        payoutStatus: "held",
        refundStatus: "none",
        updatedAt: new Date(),
      },
    }
  );

  void sendPaymentNotifications(db, {
    date: appointment.date as string,
    time: appointment.time as string,
    userId: appointment.userId as string,
    doctorId: appointment.doctorId as string,
  });
}
