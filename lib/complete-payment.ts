import { Db, ObjectId } from "mongodb";
import { formatSessionDateTimeFa } from "@/lib/booking-lifecycle";
import {
  smsAppointmentPaid,
  smsDoctorNewBooking,
} from "@/lib/sms";

export function isDevPaymentAuthority(authority: string): boolean {
  return authority.startsWith("DEV-");
}

export async function completeSuccessfulPayment(
  db: Db,
  payment: {
    _id: ObjectId;
    appointmentId?: string;
    amount?: number;
  },
  refId: string
) {
  const payments = db.collection("payments");
  const appointments = db.collection("appointments");
  const users = db.collection("users");
  const psychologists = db.collection("psychologists");

  await payments.updateOne(
    { _id: payment._id },
    {
      $set: {
        status: "SUCCESS",
        refId,
        verifiedAt: new Date(),
        updatedAt: new Date(),
      },
    }
  );

  if (!payment.appointmentId) return;

  const appointment = await appointments.findOne({
    _id: new ObjectId(payment.appointmentId),
  });
  if (!appointment) return;

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

  const sessionWhen = formatSessionDateTimeFa(
    appointment.date as string,
    appointment.time as string
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
