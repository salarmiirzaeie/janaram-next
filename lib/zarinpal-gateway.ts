import { isAxiosError } from "axios";
import { getZarinpal, getPaymentRedirectUrl } from "@/lib/zarinpal";

export function getZarinpalErrorCode(err: unknown): number | undefined {
  if (!isAxiosError(err)) return undefined;
  const body = err.response?.data as {
    errors?: { code?: number };
    data?: { code?: number };
  };
  return body?.errors?.code ?? body?.data?.code;
}

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
  const isSandbox = process.env.NODE_ENV !== "production";

  try {
    const zarinpal = getZarinpal();
    const response = await zarinpal.payments.create({
      amount: params.amountInRial,
      callback_url: params.callbackUrl,
      description: params.description,
      mobile: params.mobile,
      email: params.email,
    });

    if (response.data?.code === 100 && response.data?.authority) {
      return {
        ok: true,
        authority: response.data.authority,
        paymentUrl: getPaymentRedirectUrl(response.data.authority),
        devMock: false,
      };
    }

    return {
      ok: false,
      message: response.data?.message || "خطا در ایجاد درخواست پرداخت",
    };
  } catch (err) {
    const code = getZarinpalErrorCode(err);

    // Sandbox rate limit — use local mock so dev booking flow still works
    if (isSandbox && code === -12) {
      return { ok: false, message: "SANDBOX_RATE_LIMITED", code: -12 };
    }

    if (code === -12) {
      return {
        ok: false,
        message:
          "درگاه زرین‌پال موقتاً محدود شده است. چند دقیقه دیگر دوباره تلاش کنید.",
        code,
      };
    }

    if (isAxiosError(err)) {
      const body = err.response?.data as { errors?: { message?: string } };
      return {
        ok: false,
        message: body?.errors?.message || "خطا در اتصال به درگاه پرداخت",
        code,
      };
    }

    return { ok: false, message: "خطا در اتصال به درگاه پرداخت" };
  }
}
