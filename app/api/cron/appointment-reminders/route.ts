import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import {
  formatSessionDateTimeFa,
  getAppointmentStartUtc,
} from "@/lib/booking-lifecycle";
import { smsAppointmentReminder } from "@/lib/sms";

const CRON_SECRET = process.env.CRON_SECRET;

/** Call periodically (e.g. every 15 min): POST with Authorization: Bearer CRON_SECRET */
export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!CRON_SECRET || auth !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const db = (await clientPromise).db("janaram-db");
  const appointments = db.collection("appointments");
  const users = db.collection("users");
  const psychologists = db.collection("psychologists");

  const now = Date.now();
  const in25h = now + 25 * 60 * 60 * 1000;
  const in2h = now + 2 * 60 * 60 * 1000;

  const confirmed = await appointments
    .find({ status: "confirmed" })
    .toArray();

  let sent24 = 0;
  let sent1 = 0;

  for (const app of confirmed) {
    const start = getAppointmentStartUtc(app.date, app.time).getTime();
    const sessionWhen = formatSessionDateTimeFa(app.date, app.time);

    const patient = await users.findOne({
      _id: new ObjectId(app.userId),
    });
    if (!patient?.phone) continue;

    const doctor = await psychologists.findOne({
      _id: new ObjectId(app.doctorId),
    });
    const doctorName = doctor?.name || "روانشناس";

    if (
      !app.smsReminder24hSent &&
      start > now &&
      start <= in25h &&
      start - now >= 23 * 60 * 60 * 1000
    ) {
      await smsAppointmentReminder({
        phone: patient.phone,
        doctorName,
        sessionWhen,
        hoursBefore: 24,
      });
      await appointments.updateOne(
        { _id: app._id },
        { $set: { smsReminder24hSent: true, updatedAt: new Date() } }
      );
      sent24++;
    }

    if (
      !app.smsReminder1hSent &&
      start > now &&
      start <= in2h &&
      start - now >= 50 * 60 * 1000
    ) {
      await smsAppointmentReminder({
        phone: patient.phone,
        doctorName,
        sessionWhen,
        hoursBefore: 1,
      });
      await appointments.updateOne(
        { _id: app._id },
        { $set: { smsReminder1hSent: true, updatedAt: new Date() } }
      );
      sent1++;
    }
  }

  return NextResponse.json({
    success: true,
    sent24h: sent24,
    sent1h: sent1,
  });
}
