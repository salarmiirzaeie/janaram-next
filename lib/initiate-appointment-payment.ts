import type { Db } from "mongodb";
import { ObjectId } from "mongodb";
import {
  createZarinpalPayment,
  getDevMockPaymentUrl,
  getPaymentCallbackUrl,
} from "@/lib/zarinpal-gateway";
import { getPaymentRedirectUrl } from "@/lib/zarinpal";

export type InitiatePaymentResult =
  | {
      ok: true;
      authority: string;
      paymentUrl: string;
      paymentId: string;
      amountToman: number;
      amountInRial: number;
      devMock?: boolean;
      reused?: boolean;
    }
  | { ok: false; message: string; code?: number; status: number };

export async function initiateAppointmentPayment(
  db: Db,
  params: {
    userId: string;
    appointmentId: string;
    description?: string;
    mobile?: string;
    email?: string;
    amountTomanOverride?: number;
  }
): Promise<InitiatePaymentResult> {
  const appointments = db.collection("appointments");
  const payments = db.collection("payments");

  let userObjectId: ObjectId;
  let appointmentObjectId: ObjectId;
  try {
    userObjectId = new ObjectId(params.userId);
    appointmentObjectId = new ObjectId(params.appointmentId);
  } catch {
    return { ok: false, message: "شناسه نامعتبر است", status: 400 };
  }

  const appointment = await appointments.findOne({
    _id: appointmentObjectId,
    userId: params.userId,
  });

  if (!appointment) {
    return { ok: false, message: "نوبت یافت نشد", status: 404 };
  }

  if (appointment.status === "confirmed") {
    return {
      ok: false,
      message: "این نوبت قبلاً پرداخت و تأیید شده است",
      status: 400,
    };
  }

  if (appointment.status !== "pending_payment") {
    return { ok: false, message: "این نوبت قابل پرداخت نیست", status: 400 };
  }

  if (
    appointment.paymentExpiresAt &&
    new Date(appointment.paymentExpiresAt) <= new Date()
  ) {
    return {
      ok: false,
      message: "مهلت پرداخت این نوبت به پایان رسیده است",
      status: 400,
    };
  }

  const amountToman =
    params.amountTomanOverride && params.amountTomanOverride >= 1000
      ? params.amountTomanOverride
      : (appointment.sessionPrice as number);

  if (!amountToman || amountToman < 1000) {
    return {
      ok: false,
      message: "مبلغ پرداخت نامعتبر است",
      status: 400,
    };
  }

  const amountInRial = amountToman * 10;
  const description =
    params.description || "پرداخت هزینه جلسه مشاوره";

  const existingPending = await payments.findOne(
    {
      appointmentId: params.appointmentId,
      userId: userObjectId,
      status: "PENDING",
    },
    { sort: { createdAt: -1 } }
  );

  if (existingPending?.authority) {
    const authority = existingPending.authority as string;
    const isDevMock =
      existingPending.devMock === true || authority.startsWith("DEV-");

    return {
      ok: true,
      authority,
      paymentUrl: isDevMock
        ? getDevMockPaymentUrl(existingPending._id.toString())
        : getPaymentRedirectUrl(authority),
      paymentId: existingPending._id.toString(),
      amountToman,
      amountInRial,
      devMock: isDevMock,
      reused: true,
    };
  }

  let paymentId: string;
  if (existingPending) {
    paymentId = existingPending._id.toString();
    await payments.updateOne(
      { _id: existingPending._id },
      {
        $set: {
          amount: amountInRial,
          amountToman,
          description,
          updatedAt: new Date(),
        },
      }
    );
  } else {
    const inserted = await payments.insertOne({
      userId: userObjectId,
      appointmentId: params.appointmentId,
      amount: amountInRial,
      amountToman,
      description,
      status: "PENDING",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    paymentId = inserted.insertedId.toString();
  }

  const callbackUrl = getPaymentCallbackUrl();
  const gateway = await createZarinpalPayment({
    amountInRial,
    callbackUrl,
    description,
    mobile: params.mobile,
    email: params.email,
  });

  if (gateway.ok) {
    await payments.updateOne(
      { _id: new ObjectId(paymentId) },
      {
        $set: {
          authority: gateway.authority,
          devMock: gateway.devMock ?? false,
          updatedAt: new Date(),
        },
      }
    );

    return {
      ok: true,
      authority: gateway.authority,
      paymentUrl: gateway.paymentUrl,
      paymentId,
      amountToman,
      amountInRial,
      devMock: gateway.devMock,
    };
  }

  if (
    gateway.code === -12 &&
    process.env.NODE_ENV !== "production"
  ) {
    const authority = `DEV-${paymentId}`;
    await payments.updateOne(
      { _id: new ObjectId(paymentId) },
      {
        $set: {
          authority,
          devMock: true,
          updatedAt: new Date(),
        },
      }
    );

    return {
      ok: true,
      authority,
      paymentUrl: getDevMockPaymentUrl(paymentId),
      paymentId,
      amountToman,
      amountInRial,
      devMock: true,
    };
  }

  await payments.updateOne(
    { _id: new ObjectId(paymentId) },
    {
      $set: {
        status: "FAILED",
        errorMessage: gateway.message,
        updatedAt: new Date(),
      },
    }
  );

  return {
    ok: false,
    message: gateway.message,
    code: gateway.code,
    status: gateway.code === -12 ? 429 : 400,
  };
}
