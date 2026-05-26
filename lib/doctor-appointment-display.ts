import { PATIENT_REFUND_MIN_HOURS } from "@/lib/booking-lifecycle";
import type { StoredAppointment } from "@/lib/appointment-doc";

/** Doctor-facing note for a cancelled appointment */
export function getDoctorCancelledAppointmentNote(
  cancelReason?: string,
  payoutStatus?: string
): string {
  switch (cancelReason) {
    case "patient_cancelled_late":
      if (payoutStatus === "released") {
        return `لغو توسط مراجع (کمتر از ${PATIENT_REFUND_MIN_HOURS} ساعت مانده به جلسه). سهم شما در گزارش مالی ثبت شده است.`;
      }
      return `لغو توسط مراجع (کمتر از ${PATIENT_REFUND_MIN_HOURS} ساعت مانده به جلسه). سهم شما در گزارش مالی ثبت می‌شود.`;
    case "patient_cancelled_refund":
      return `لغو توسط مراجع (بیش از ${PATIENT_REFUND_MIN_HOURS} ساعت مانده به جلسه). مبلغ به مراجع بازگردانده می‌شود و سهمی برای شما ثبت نمی‌شود.`;
    case "payment_timeout":
      return "لغو به‌دلیل پایان مهلت پرداخت.";
    case "patient_cancelled_unpaid":
      return "لغو توسط مراجع قبل از پرداخت.";
    default:
      return "این نوبت لغو شده است.";
  }
}

/** Whether doctor receives session share after patient cancel; null if not applicable */
export function doctorGetsPaidForCancellation(
  cancelReason?: string
): boolean | null {
  if (cancelReason === "patient_cancelled_late") return true;
  if (cancelReason === "patient_cancelled_refund") return false;
  return null;
}

export function serializeDoctorAppointment(
  app: StoredAppointment,
  user: { name: string; phone: string } | undefined
) {
  const cancelReason = app.cancelReason as string | undefined;
  const payoutStatus = app.payoutStatus as string | undefined;

  return {
    id: app._id.toString(),
    date: app.date,
    time: app.time,
    status: app.status,
    sessionPrice: app.sessionPrice,
    cancelReason,
    cancelledAt: app.cancelledAt
      ? new Date(app.cancelledAt).toISOString()
      : undefined,
    payoutStatus,
    doctorGetsPaid:
      app.status === "cancelled"
        ? doctorGetsPaidForCancellation(cancelReason)
        : undefined,
    cancelPayoutNote:
      app.status === "cancelled"
        ? getDoctorCancelledAppointmentNote(cancelReason, payoutStatus)
        : undefined,
    user: user || {
      name: "کاربر ناشناس",
      phone: "نامشخص",
    },
    createdAt: app.createdAt,
  };
}
