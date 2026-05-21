/** Session lifecycle: pay at booking (held), doctor paid after completed session */

export const REVIEW_WINDOW_DAYS = 7;
/** Patient gets full refund if cancel at least this many hours before session */
export const PATIENT_REFUND_MIN_HOURS = 1;
/** Doctor can mark no-show after session start + this many minutes */
export const NO_SHOW_GRACE_MINUTES = 15;
/** Doctor can mark completed from session start time */
export const COMPLETE_ALLOWED_FROM_START = true;

export type AppointmentLike = {
  date: string;
  time: string;
  status: string;
  payoutStatus?: string;
  completedAt?: Date;
  reviewEligibleUntil?: Date;
};

export function getAppointmentStartUtc(date: string, time: string): Date {
  return new Date(`${date}T${time}:00+03:30`);
}

export function getSessionEndUtc(date: string, time: string): Date {
  const start = getAppointmentStartUtc(date, time);
  return new Date(start.getTime() + 50 * 60 * 1000);
}

export function getReviewEligibleUntil(completedAt: Date): Date {
  return new Date(
    completedAt.getTime() + REVIEW_WINDOW_DAYS * 24 * 60 * 60 * 1000
  );
}

export function hasSessionStarted(appointment: AppointmentLike): boolean {
  return Date.now() >= getAppointmentStartUtc(appointment.date, appointment.time).getTime();
}

export function canDoctorMarkCompleted(appointment: AppointmentLike): boolean {
  if (appointment.status !== "confirmed") return false;
  if (!COMPLETE_ALLOWED_FROM_START) {
    return Date.now() >= getSessionEndUtc(appointment.date, appointment.time).getTime();
  }
  return hasSessionStarted(appointment);
}

export function canDoctorMarkNoShow(appointment: AppointmentLike): boolean {
  if (appointment.status !== "confirmed") return false;
  const start = getAppointmentStartUtc(appointment.date, appointment.time).getTime();
  const graceMs = NO_SHOW_GRACE_MINUTES * 60 * 1000;
  return Date.now() >= start + graceMs;
}

export function canPatientCancelWithRefund(appointment: AppointmentLike): boolean {
  if (appointment.status !== "confirmed") return false;
  if (appointment.payoutStatus !== "held") return false;
  const start = getAppointmentStartUtc(appointment.date, appointment.time).getTime();
  const minMs = PATIENT_REFUND_MIN_HOURS * 60 * 60 * 1000;
  return start - Date.now() >= minMs;
}

export function isReviewWindowOpen(appointment: AppointmentLike): boolean {
  if (appointment.status !== "completed") return false;
  if (!appointment.reviewEligibleUntil) return true;
  return new Date(appointment.reviewEligibleUntil) > new Date();
}

export function formatSessionDateTimeFa(date: string, time: string): string {
  try {
    const d = new Date(`${date}T${time}:00+03:30`);
    return new Intl.DateTimeFormat("fa-IR", {
      timeZone: "Asia/Tehran",
      dateStyle: "long",
      timeStyle: "short",
    }).format(d);
  } catch {
    return `${date} ${time}`;
  }
}
