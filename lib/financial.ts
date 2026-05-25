import type { Db, Document } from "mongodb";
import { ObjectId } from "mongodb";
import { getTodayTehran } from "@/lib/booking";
import {
  getPlatformCommissionRate,
  getCommissionPercentLabel,
  getDoctorSharePercentLabel,
} from "@/lib/platform-settings";

/** @deprecated use getPlatformCommissionRate(db) — default 0 until admin changes */
export const PLATFORM_COMMISSION_RATE = 0;

export function calculateCommission(
  amountToman: number,
  commissionRate: number
): {
  commission: number;
  net: number;
  platformShare: number;
  doctorShare: number;
} {
  const rate = Math.min(1, Math.max(0, commissionRate));
  const commission = Math.floor(amountToman * rate);
  const net = amountToman - commission;
  return {
    commission,
    net,
    platformShare: commission,
    doctorShare: net,
  };
}

export async function getCommissionContext(db: Db) {
  const rate = await getPlatformCommissionRate(db);
  return {
    commissionRate: rate,
    commissionPercentLabel: getCommissionPercentLabel(rate),
    doctorSharePercentLabel: getDoctorSharePercentLabel(rate),
  };
}

export function rialToToman(amountRial: number): number {
  return Math.floor(amountRial / 10);
}

export function formatMonthLabel(year: number, month: number): string {
  return new Intl.DateTimeFormat("fa-IR", {
    month: "long",
    year: "numeric",
    calendar: "persian",
  }).format(new Date(year, month - 1, 15));
}

/** Start/end of a calendar day in Tehran as UTC Date range for MongoDB */
export function getTehranDayBounds(dateStr: string): {
  start: Date;
  end: Date;
} {
  return {
    start: new Date(`${dateStr}T00:00:00+03:30`),
    end: new Date(`${dateStr}T23:59:59.999+03:30`),
  };
}

export type DoctorFinancialSummary = {
  totalGross: number;
  totalPlatformFee: number;
  totalDoctorShare: number;
  totalSettled: number;
  pendingPayout: number;
  sessionCount: number;
};

export async function getDoctorFinancialSummary(
  db: Db,
  doctorId: string,
  options?: { date?: string },
): Promise<DoctorFinancialSummary> {
  const transactions = db.collection("transactions");
  const date = options?.date;

  const depositMatch: Record<string, unknown> = {
    doctorId,
    type: "deposit",
    status: "success",
  };

  if (date) {
    const { start, end } = getTehranDayBounds(date);
    depositMatch.createdAt = { $gte: start, $lte: end };
  }

  const settlementMatch: Record<string, unknown> = {
    doctorId,
    type: "settlement",
    status: "success",
  };

  if (date) {
    settlementMatch.settlementDate = date;
  }

  const [deposits, settlements] = await Promise.all([
    transactions
      .aggregate([
        { $match: depositMatch },
        {
          $group: {
            _id: null,
            gross: { $sum: "$amount" },
            platformFee: { $sum: "$commission" },
            doctorShare: { $sum: "$net" },
            count: { $sum: 1 },
          },
        },
      ])
      .toArray(),
    transactions
      .aggregate([{ $match: settlementMatch }, { $group: { _id: null, total: { $sum: "$amount" } } }])
      .toArray(),
  ]);

  const totalGross = deposits[0]?.gross || 0;
  const totalPlatformFee = deposits[0]?.platformFee || 0;
  const totalDoctorShare = deposits[0]?.doctorShare || 0;
  const sessionCount = deposits[0]?.count || 0;
  const settledInPeriod = settlements[0]?.total || 0;

  let totalSettled: number;
  let pendingPayout: number;

  if (date) {
    totalSettled = settledInPeriod;
    pendingPayout = Math.max(0, totalDoctorShare - settledInPeriod);
  } else {
    const allTimeSettled = await transactions
      .aggregate([
        {
          $match: {
            doctorId,
            type: "settlement",
            status: "success",
          },
        },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ])
      .toArray();
    totalSettled = allTimeSettled[0]?.total || 0;
    pendingPayout = Math.max(0, totalDoctorShare - totalSettled);
  }

  return {
    totalGross,
    totalPlatformFee,
    totalDoctorShare,
    totalSettled,
    pendingPayout,
    sessionCount,
  };
}

/** @deprecated use getDoctorFinancialSummary */
export async function getDoctorBalance(db: Db, doctorId: string) {
  const s = await getDoctorFinancialSummary(db, doctorId);
  return {
    totalEarnings: s.totalDoctorShare,
    totalWithdrawn: s.totalSettled,
    pendingWithdrawals: 0,
    availableBalance: s.pendingPayout,
  };
}

function appointmentEligibleForDoctorPayout(appointment: Document): boolean {
  if (appointment.payoutStatus === "released") return false;
  if (appointment.status === "completed" || appointment.status === "no-show") {
    return true;
  }
  if (
    appointment.status === "cancelled" &&
    appointment.cancelReason === "patient_cancelled_late"
  ) {
    return true;
  }
  return false;
}

/** Credit doctor ledger after outcome: completed, no-show, or late patient cancel */
export async function releaseDoctorEarningsFromAppointment(
  db: Db,
  appointmentId: string,
): Promise<{ created: boolean; transactionId?: string }> {
  const appointments = db.collection("appointments");
  const payments = db.collection("payments");

  const appointment = await appointments.findOne({
    _id: new ObjectId(appointmentId),
  });
  if (!appointment || !appointmentEligibleForDoctorPayout(appointment)) {
    return { created: false };
  }

  const payment = await payments.findOne({
    appointmentId,
    status: "SUCCESS",
  });
  if (!payment) {
    return { created: false };
  }

  const result = await createDoctorDepositFromPayment(db, payment);
  if (result.created) {
    await appointments.updateOne(
      { _id: appointment._id },
      {
        $set: {
          payoutStatus: "released",
          payoutReleasedAt: new Date(),
          updatedAt: new Date(),
        },
      },
    );
  }
  return result;
}

export async function forfeitHeldPayout(
  db: Db,
  appointmentId: string,
  options: {
    refundStatus: "pending" | "none";
    cancelReason?: string;
  },
): Promise<void> {
  const appointments = db.collection("appointments");
  await appointments.updateOne(
    { _id: new ObjectId(appointmentId) },
    {
      $set: {
        payoutStatus: "forfeited",
        refundStatus: options.refundStatus,
        cancelReason: options.cancelReason,
        payoutForfeitedAt: new Date(),
        updatedAt: new Date(),
      },
    },
  );
}

export async function createDoctorDepositFromPayment(
  db: Db,
  payment: Document,
): Promise<{ created: boolean; transactionId?: string }> {
  if (!payment.appointmentId) {
    return { created: false };
  }

  const transactions = db.collection("transactions");
  const appointments = db.collection("appointments");
  const users = db.collection("users");
  const paymentId = payment._id.toString();

  const existing = await transactions.findOne({ paymentId });
  if (existing) {
    return { created: false, transactionId: existing._id.toString() };
  }

  const appointment = await appointments.findOne({
    _id: new ObjectId(payment.appointmentId),
  });
  if (!appointment?.doctorId) {
    return { created: false };
  }

  const amountToman = payment.amountToman ?? rialToToman(payment.amount as number);
  const commissionRate = await getPlatformCommissionRate(db);
  const { commission, net } = calculateCommission(amountToman, commissionRate);

  let patientName: string | null = null;
  try {
    const user = await users.findOne({
      _id: new ObjectId(appointment.userId),
    });
    patientName = user?.name || null;
  } catch {
    patientName = null;
  }

  const referenceId = `DEP-${paymentId.slice(-8)}-${Date.now()}`;

  const result = await transactions.insertOne({
    doctorId: appointment.doctorId,
    appointmentId: payment.appointmentId,
    paymentId,
    amount: amountToman,
    commission,
    net,
    platformShare: commission,
    doctorShare: net,
    type: "deposit",
    status: "success",
    description: `درآمد جلسه ${appointment.date} ${appointment.time}`,
    patientName,
    referenceId,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return { created: true, transactionId: result.insertedId.toString() };
}

export async function recordDoctorSettlement(
  db: Db,
  params: {
    doctorId: string;
    amount: number;
    note?: string;
    adminId?: string;
    settlementDate?: string;
  },
): Promise<{ settlementId: string; transactionId: string }> {
  const { doctorId, amount, note, adminId } = params;
  const settlementDate = params.settlementDate || getTodayTehran();

  if (!amount || amount < 1) {
    throw new Error("مبلغ تسویه نامعتبر است");
  }

  const summary = await getDoctorFinancialSummary(db, doctorId);
  if (amount > summary.pendingPayout) {
    throw new Error(`حداکثر مبلغ قابل تسویه ${summary.pendingPayout.toLocaleString()} تومان است`);
  }

  const settlements = db.collection("settlements");
  const transactions = db.collection("transactions");
  const psychologists = db.collection("psychologists");

  const doctor = await psychologists.findOne({ _id: new ObjectId(doctorId) });
  if (!doctor) {
    throw new Error("روانشناس یافت نشد");
  }

  const bankAccounts = db.collection("doctor_bank_accounts");
  const bank = await bankAccounts.findOne({ doctorId });

  const referenceId = `STL-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  const settlementDoc = {
    doctorId,
    doctorName: doctor.name,
    amount,
    settlementDate,
    note: note || "تسویه دستی توسط مدیریت",
    status: "paid",
    bankAccount: bank
      ? {
          accountName: bank.accountName,
          cardNumber: bank.cardNumber,
          sheba: bank.sheba,
        }
      : null,
    adminId: adminId || null,
    referenceId,
    createdAt: new Date(),
    paidAt: new Date(),
  };

  const settlementResult = await settlements.insertOne(settlementDoc);

  const txResult = await transactions.insertOne({
    doctorId,
    amount,
    commission: 0,
    net: amount,
    type: "settlement",
    status: "success",
    description: note || `تسویه حساب — ${settlementDate}`,
    referenceId,
    settlementId: settlementResult.insertedId,
    settlementDate,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  await settlements.updateOne({ _id: settlementResult.insertedId }, { $set: { transactionId: txResult.insertedId } });

  return {
    settlementId: settlementResult.insertedId.toString(),
    transactionId: txResult.insertedId.toString(),
  };
}

export type AdminDoctorPayoutRow = {
  doctorId: string;
  doctorName: string;
  phone?: string;
  sessionCount: number;
  totalGross: number;
  platformFee: number;
  doctorShare: number;
  settledToday: number;
  pendingPayout: number;
  bankAccount: {
    accountName?: string;
    cardNumber?: string;
    sheba?: string;
  } | null;
};

export async function getAdminDailyFinancialReport(
  db: Db,
  dateStr: string,
): Promise<{
  date: string;
  totals: {
    paymentCount: number;
    totalGross: number;
    platformFee: number;
    doctorShare: number;
    settled: number;
    pendingToDoctors: number;
  };
  doctors: AdminDoctorPayoutRow[];
  payments: Array<{
    paymentId: string;
    refId?: string;
    doctorId: string;
    doctorName: string;
    patientName?: string;
    appointmentDate: string;
    appointmentTime: string;
    gross: number;
    platformFee: number;
    doctorShare: number;
    paidAt: Date;
  }>;
}> {
  const { start, end } = getTehranDayBounds(dateStr);
  const paymentsCol = db.collection("payments");
  const appointments = db.collection("appointments");
  const psychologists = db.collection("psychologists");
  const transactions = db.collection("transactions");
  const settlementsCol = db.collection("settlements");

  const dayPayments = await paymentsCol
    .find({
      status: "SUCCESS",
      verifiedAt: { $gte: start, $lte: end },
    })
    .sort({ verifiedAt: -1 })
    .toArray();

  const doctorIds = new Set<string>();
  const paymentRows: Array<{
    paymentId: string;
    refId?: string;
    doctorId: string;
    doctorName: string;
    patientName?: string;
    appointmentDate: string;
    appointmentTime: string;
    gross: number;
    platformFee: number;
    doctorShare: number;
    paidAt: Date;
  }> = [];

  let totalGross = 0;
  let platformFee = 0;
  let doctorShare = 0;

  const users = db.collection("users");
  const commissionRate = await getPlatformCommissionRate(db);

  for (const p of dayPayments) {
    if (!p.appointmentId) continue;

    let appointment;
    try {
      appointment = await appointments.findOne({
        _id: new ObjectId(p.appointmentId),
      });
    } catch {
      continue;
    }
    if (!appointment?.doctorId) continue;

    doctorIds.add(appointment.doctorId);

    const gross = p.amountToman ?? rialToToman(p.amount as number);
    const split = calculateCommission(gross, commissionRate);
    totalGross += gross;
    platformFee += split.platformShare;
    doctorShare += split.doctorShare;

    const doctor = await psychologists.findOne({
      _id: new ObjectId(appointment.doctorId),
    });

    let patientName: string | undefined;
    try {
      const user = await users.findOne({
        _id: new ObjectId(appointment.userId),
      });
      patientName = user?.name;
    } catch {
      patientName = undefined;
    }

    paymentRows.push({
      paymentId: p._id.toString(),
      refId: p.refId?.toString(),
      doctorId: appointment.doctorId,
      doctorName: doctor?.name || "نامشخص",
      patientName,
      appointmentDate: appointment.date,
      appointmentTime: appointment.time,
      gross,
      platformFee: split.platformShare,
      doctorShare: split.doctorShare,
      paidAt: p.verifiedAt || p.updatedAt || new Date(),
    });
  }

  const doctors: AdminDoctorPayoutRow[] = [];

  for (const doctorId of doctorIds) {
    const summary = await getDoctorFinancialSummary(db, doctorId, {
      date: dateStr,
    });

    const settledTodayAgg = await settlementsCol
      .aggregate([
        {
          $match: {
            doctorId,
            settlementDate: dateStr,
            status: "paid",
          },
        },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ])
      .toArray();

    const settledToday = settledTodayAgg[0]?.total || 0;

    const doctor = await psychologists.findOne({
      _id: new ObjectId(doctorId),
    });
    const bankAccounts = db.collection("doctor_bank_accounts");
    const bank = await bankAccounts.findOne({ doctorId });

    doctors.push({
      doctorId,
      doctorName: doctor?.name || "نامشخص",
      phone: doctor?.phone,
      sessionCount: summary.sessionCount,
      totalGross: summary.totalGross,
      platformFee: summary.totalPlatformFee,
      doctorShare: summary.totalDoctorShare,
      settledToday,
      pendingPayout: Math.max(0, summary.totalDoctorShare - settledToday),
      bankAccount: bank
        ? {
            accountName: bank.accountName,
            cardNumber: bank.cardNumber,
            sheba: bank.sheba,
          }
        : null,
    });
  }

  doctors.sort((a, b) => b.pendingPayout - a.pendingPayout);

  const settledAgg = await settlementsCol
    .aggregate([
      { $match: { settlementDate: dateStr, status: "paid" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ])
    .toArray();

  const settled = settledAgg[0]?.total || 0;
  const pendingToDoctors = doctors.reduce((s, d) => s + d.pendingPayout, 0);

  return {
    date: dateStr,
    totals: {
      paymentCount: paymentRows.length,
      totalGross,
      platformFee,
      doctorShare,
      settled,
      pendingToDoctors,
    },
    doctors,
    payments: paymentRows,
  };
}
