// import https from "https";
// const MELI_HOST = "console.melipayamak.com";
// const MELI_PATH =
//   process.env.SMS_MELIPAYAMAK_PATH ||
//   "/api/send/shared/6be212aadaea410b97e5ba4e98171dca";

/** SMS temporarily disabled — re-enable by restoring the https.request block below */
export function sendSms(
  phone: string,
  bodyId: number,
  args: string[]
): Promise<void> {
  console.log("[sms] disabled — skip send", {
    phone,
    bodyId,
    argsCount: args.length,
  });
  return Promise.resolve();

  /*
  return new Promise((resolve) => {
    const normalized = phone.replace(/\s/g, "");
    if (!/^(\+98|0)?9\d{9}$/.test(normalized)) {
      console.warn("[sms] invalid phone skipped:", phone);
      resolve();
      return;
    }

    const data = JSON.stringify({ bodyId, to: normalized, args });

    const req = https.request(
      {
        hostname: MELI_HOST,
        port: 443,
        path: MELI_PATH,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(data),
        },
      },
      (res) => {
        res.on("data", () => {});
        res.on("end", () => resolve());
      }
    );

    req.on("error", (err) => {
      console.error("[sms] send error:", err.message);
      resolve();
    });

    req.write(data);
    req.end();
  });
  */
}

function bodyId(envKey: string, fallback: number): number {
  const v = process.env[envKey];
  if (!v) return fallback;
  const n = parseInt(v, 10);
  return Number.isNaN(n) ? fallback : n;
}

/** Configure Melipayamak template bodyIds in .env */
export async function smsAppointmentPaid(params: {
  phone: string;
  doctorName: string;
  sessionWhen: string;
}) {
  const id = bodyId("SMS_BODY_APPOINTMENT_PAID", 0);
  if (!id) {
    console.log("[sms] skip appointment paid (set SMS_BODY_APPOINTMENT_PAID)");
    return;
  }
  await sendSms(params.phone, id, [
    params.doctorName,
    params.sessionWhen,
  ]);
}

export async function smsAppointmentReminder(params: {
  phone: string;
  doctorName: string;
  sessionWhen: string;
  hoursBefore: number;
}) {
  const key =
    params.hoursBefore <= 1
      ? "SMS_BODY_REMINDER_1H"
      : "SMS_BODY_REMINDER_24H";
  const id = bodyId(key, 0);
  if (!id) {
    console.log(`[sms] skip reminder (set ${key})`);
    return;
  }
  await sendSms(params.phone, id, [params.doctorName, params.sessionWhen]);
}

export async function smsSessionCompleted(params: {
  phone: string;
  doctorName: string;
}) {
  const id = bodyId("SMS_BODY_SESSION_COMPLETED", 0);
  if (!id) return;
  await sendSms(params.phone, id, [params.doctorName]);
}

export async function smsNoShowPatient(params: {
  phone: string;
  sessionWhen: string;
}) {
  const id = bodyId("SMS_BODY_NO_SHOW", 0);
  if (!id) return;
  await sendSms(params.phone, id, [params.sessionWhen]);
}

export async function smsAppointmentCancelled(params: {
  phone: string;
  sessionWhen: string;
  refundPending: boolean;
}) {
  const id = bodyId("SMS_BODY_CANCELLED", 0);
  if (!id) return;
  await sendSms(params.phone, id, [
    params.sessionWhen,
    params.refundPending ? "بازپرداخت در حال بررسی" : "بدون بازپرداخت",
  ]);
}

/** After admin marks refund processed (set SMS_BODY_REFUND_PROCESSED in .env) */
export async function smsRefundProcessed(params: {
  phone: string;
  amountToman: number;
}) {
  const id = bodyId("SMS_BODY_REFUND_PROCESSED", 0);
  if (!id) return;
  await sendSms(params.phone, id, [
    params.amountToman.toLocaleString("fa-IR"),
  ]);
}

export async function smsDoctorNewBooking(params: {
  phone: string;
  patientName: string;
  sessionWhen: string;
}) {
  const id = bodyId("SMS_BODY_DOCTOR_NEW_BOOKING", 0);
  if (!id) return;
  await sendSms(params.phone, id, [params.patientName, params.sessionWhen]);
}
