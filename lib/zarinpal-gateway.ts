import { requestZarinpalPayment } from "@/lib/zarinpal-rest";

export function getDevCallbackBase(): string {
  return (
    process.env.DEV_PAYMENT_CALLBACK_BASE || "http://10.34.190.162:3000"
  ).replace(/\/$/, "");
}

export function getPaymentCallbackUrl(): string {
  const isSandbox = process.env.NODE_ENV !== "production";
  const base = isSandbox
    ? getDevCallbackBase()
    : (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(
        /\/$/,
        ""
      );
  return `${base}/api/payment/callback`;
}

export function getDevMockPaymentUrl(paymentId: string): string {
  return `${getDevCallbackBase()}/api/payment/dev-mock?paymentId=${paymentId}`;
}

export async function createZarinpalPayment(params: {
  amountInRial: number;
  callbackUrl: string;
  description: string;
  mobile?: string;
  email?: string;
}): Promise<
  | { ok: true; authority: string; paymentUrl: string; devMock: boolean }
  | { ok: false; message: string; code?: number }
> {
  const result = await requestZarinpalPayment(params);

  if (result.ok) {
    return {
      ok: true,
      authority: result.authority,
      paymentUrl: result.paymentUrl,
      devMock: false,
    };
  }

  if (result.code === -12 && process.env.NODE_ENV !== "production") {
    return { ok: false, message: "SANDBOX_RATE_LIMITED", code: -12 };
  }

  return {
    ok: false,
    message: result.message,
    code: result.code,
  };
}
