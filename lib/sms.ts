import https from "https";

const MELI_HOST = "console.melipayamak.com";
const MELI_PATH =
  process.env.SMS_MELIPAYAMAK_PATH ||
  "/api/send/shared/6be212aadaea410b97e5ba4e98171dca";

/** Melipayamak shared send — same API as OTP route */
export function sendSms(
  bodyId: number,
  phoneNumber: string,
  args: string[]
): Promise<void> {
  return new Promise((resolve, reject) => {
    const normalized = phoneNumber.replace(/\s/g, "");
    if (!/^(\+98|0)?9\d{9}$/.test(normalized)) {
      reject(new Error(`invalid phone: ${phoneNumber}`));
      return;
    }

    const payload = JSON.stringify({
      bodyId,
      to: normalized,
      args,
    });

    const req = https.request(
      {
        hostname: MELI_HOST,
        port: 443,
        path: MELI_PATH,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(payload),
        },
      },
      (res) => {
        let body = "";
        res.on("data", (chunk: Buffer) => {
          body += chunk.toString();
        });
        res.on("end", () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            resolve();
            return;
          }
          console.error("[sms] API error:", res.statusCode, body);
          reject(new Error(`SMS API returned status ${res.statusCode}`));
        });
      }
    );

    req.on("error", (err) => {
      console.error("[sms] send error:", err.message);
      reject(err);
    });

    req.write(payload);
    req.end();
  });
}

function bodyId(envKey: string, fallback: number): number {
  const v = process.env[envKey];
  if (!v) return fallback;
  const n = parseInt(v, 10);
  return Number.isNaN(n) ? fallback : n;
}

/** OTP login code — default bodyId 420054 */
export async function smsOtpCode(phoneNumber: string, otp: string): Promise<void> {
  const id = bodyId("SMS_BODY_OTP", 420054);
  await sendSms(id, phoneNumber, [otp]);
}

export async function smsAppointmentPaid(params: {
  phone: string;
  doctorName: string;
  sessionWhen: string;
}) {
  const id = bodyId("SMS_BODY_APPOINTMENT_PAID", 0);
  if (!id) return;
  await sendSms(id, params.phone, [params.doctorName, params.sessionWhen]);
}

export async function smsAppointmentReminder(params: {
  phone: string;
  doctorName: string;
  sessionWhen: string;
  hoursBefore: number;
}) {
  const key =
    params.hoursBefore <= 1 ? "SMS_BODY_REMINDER_1H" : "SMS_BODY_REMINDER_24H";
  const id = bodyId(key, 0);
  if (!id) return;
  await sendSms(id, params.phone, [params.doctorName, params.sessionWhen]);
}

export async function smsSessionCompleted(params: {
  phone: string;
  doctorName: string;
}) {
  const id = bodyId("SMS_BODY_SESSION_COMPLETED", 0);
  if (!id) return;
  await sendSms(id, params.phone, [params.doctorName]);
}

export async function smsNoShowPatient(params: {
  phone: string;
  sessionWhen: string;
}) {
  const id = bodyId("SMS_BODY_NO_SHOW", 0);
  if (!id) return;
  await sendSms(id, params.phone, [params.sessionWhen]);
}

export async function smsAppointmentCancelled(params: {
  phone: string;
  sessionWhen: string;
  refundPending: boolean;
}) {
  const id = bodyId("SMS_BODY_CANCELLED", 0);
  if (!id) return;
  await sendSms(id, params.phone, [
    params.sessionWhen,
    params.refundPending ? "بازپرداخت در حال بررسی" : "بدون بازپرداخت",
  ]);
}

export async function smsRefundProcessed(params: {
  phone: string;
  amountToman: number;
}) {
  const id = bodyId("SMS_BODY_REFUND_PROCESSED", 0);
  if (!id) return;
  await sendSms(id, params.phone, [params.amountToman.toLocaleString("fa-IR")]);
}

/** Notify doctor of a new paid booking — template arg: Persian date + time */
export async function smsDoctorNewBooking(params: {
  phone: string;
  sessionWhen: string;
}) {
  const id = bodyId("SMS_BODY_DOCTOR_NEW_BOOKING", 463578);
  await sendSms(id, params.phone, [params.sessionWhen]);
}
