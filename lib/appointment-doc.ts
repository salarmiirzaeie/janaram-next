import type { Document, WithId } from "mongodb";
import type { AppointmentLike } from "@/lib/booking-lifecycle";

/** Appointment document shape stored in MongoDB */
export type StoredAppointment = AppointmentLike & {
  _id: { toString(): string };
  userId?: string;
  doctorId?: string;
  sessionPrice?: number;
  createdAt?: Date;
  cancelReason?: string;
  cancelledAt?: Date;
  payoutStatus?: string;
  refundStatus?: string;
  refundResolvedAt?: Date;
  paymentExpiresAt?: Date;
  paidAt?: Date;
  reviewEligibleUntil?: Date;
};

export function asStoredAppointment(doc: WithId<Document>): StoredAppointment {
  return doc as unknown as StoredAppointment;
}

export function asAppointmentLike(
  doc: WithId<Document> | Document | null | undefined
): AppointmentLike {
  return doc as unknown as AppointmentLike;
}
