import type { Db } from "mongodb";

/** Minutes before unpaid bookings are auto-cancelled */
export const PENDING_PAYMENT_EXPIRY_MINUTES = 30;

export const APPROVED_DOCTOR_FILTER = {
  status: "approved",
  isActive: { $ne: false },
} as const;

/** Today in Asia/Tehran as YYYY-MM-DD */
export function getTodayTehran(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tehran",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** Current time in Tehran as HH:MM (24h) */
export function getNowTimeTehran(): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Tehran",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const hour = parts.find((p) => p.type === "hour")?.value ?? "00";
  const minute = parts.find((p) => p.type === "minute")?.value ?? "00";
  return `${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`;
}

/** Persian week: 0 = شنبه … 6 = جمعه */
export function getPersianWeekdayNumber(dateStr: string): number {
  const formatter = new Intl.DateTimeFormat("fa-IR", {
    timeZone: "Asia/Tehran",
    weekday: "long",
  });
  const dayName = formatter.format(new Date(`${dateStr}T12:00:00`));
  const weekdayMap: Record<string, number> = {
    شنبه: 0,
    یکشنبه: 1,
    دوشنبه: 2,
    "سه‌شنبه": 3,
    چهارشنبه: 4,
    پنجشنبه: 5,
    جمعه: 6,
  };
  return weekdayMap[dayName] ?? 0;
}

export function isValidDateString(dateStr: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
}

export function isValidTimeString(timeStr: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(timeStr);
}

export function isDateBeforeToday(dateStr: string): boolean {
  return dateStr < getTodayTehran();
}

export function isTimePassedInTehran(dateStr: string, timeStr: string): boolean {
  const today = getTodayTehran();
  if (dateStr < today) return true;
  if (dateStr > today) return false;
  return timeStr <= getNowTimeTehran();
}

export function isOffDay(offDays: string[] | undefined, dateStr: string): boolean {
  return Array.isArray(offDays) && offDays.includes(dateStr);
}

export function isSlotInSchedule(
  schedule: Record<string | number, string[]> | undefined,
  dateStr: string,
  timeStr: string
): boolean {
  const weekday = getPersianWeekdayNumber(dateStr);
  const slots = schedule?.[weekday] ?? schedule?.[String(weekday)] ?? [];
  return Array.isArray(slots) && slots.includes(timeStr);
}

export type BookableDoctor = {
  status?: string;
  isActive?: boolean;
  schedule?: Record<string | number, string[]>;
  offDays?: string[];
  sessionPrice?: number;
  [key: string]: unknown;
};

export function validateBookableSlot(
  doctor: BookableDoctor,
  dateStr: string,
  timeStr: string
): { ok: true } | { ok: false; message: string; status: number } {
  if (!isValidDateString(dateStr) || !isValidTimeString(timeStr)) {
    return { ok: false, message: "فرمت تاریخ یا ساعت نامعتبر است", status: 400 };
  }

  if (doctor.status !== "approved" || doctor.isActive === false) {
    return {
      ok: false,
      message: "این روانشناس در حال حاضر قابل رزرو نیست",
      status: 403,
    };
  }

  if (isOffDay(doctor.offDays, dateStr)) {
    return { ok: false, message: "این روز تعطیل است", status: 400 };
  }

  if (isDateBeforeToday(dateStr)) {
    return { ok: false, message: "امکان رزرو در گذشته وجود ندارد", status: 400 };
  }

  if (isTimePassedInTehran(dateStr, timeStr)) {
    return { ok: false, message: "این زمان گذشته است", status: 400 };
  }

  if (!isSlotInSchedule(doctor.schedule, dateStr, timeStr)) {
    return {
      ok: false,
      message: "این زمان در برنامه کاری روانشناس نیست",
      status: 400,
    };
  }

  return { ok: true };
}

/** Cancel stale pending_payment appointments so slots are released */
export async function expireStalePendingPayments(db: Db): Promise<number> {
  const appointments = db.collection("appointments");
  const cutoff = new Date(
    Date.now() - PENDING_PAYMENT_EXPIRY_MINUTES * 60 * 1000
  );
  const result = await appointments.updateMany(
    {
      status: "pending_payment",
      createdAt: { $lt: cutoff },
    },
    {
      $set: {
        status: "cancelled",
        cancelledAt: new Date(),
        cancelReason: "payment_timeout",
      },
    }
  );
  return result.modifiedCount;
}

let indexesEnsured = false;

export async function ensureBookingIndexes(db: Db): Promise<void> {
  if (indexesEnsured) return;
  const appointments = db.collection("appointments");
  try {
    await appointments.createIndex(
      { doctorId: 1, date: 1, time: 1 },
      {
        unique: true,
        partialFilterExpression: {
          status: { $in: ["pending_payment", "confirmed", "completed"] },
        },
        name: "unique_active_slot",
      }
    );
    await appointments.createIndex(
      { status: 1, createdAt: 1 },
      { name: "pending_payment_expiry" }
    );
    indexesEnsured = true;
  } catch (err) {
    console.warn("Booking index creation skipped or failed:", err);
  }
}
