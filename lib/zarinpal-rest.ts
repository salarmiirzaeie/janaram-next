import { getPaymentRedirectUrl } from "@/lib/zarinpal";

const REQUEST_TIMEOUT_MS = 12_000;
const MAX_ATTEMPTS = 2;

function isSandbox(): boolean {
  return process.env.NODE_ENV !== "production";
}

function getRequestUrl(): string {
  return isSandbox()
    ? "https://sandbox.zarinpal.com/pg/v4/payment/request.json"
    : "https://api.zarinpal.com/pg/v4/payment/request.json";
}

function getVerifyUrl(): string {
  return isSandbox()
    ? "https://sandbox.zarinpal.com/pg/v4/payment/verify.json"
    : "https://api.zarinpal.com/pg/v4/payment/verify.json";
}

type ZarinpalEnvelope<T> = {
  data?: T;
  errors?: { code?: number; message?: string; validations?: unknown };
};

async function postJson<T>(
  url: string,
  body: Record<string, unknown>
): Promise<ZarinpalEnvelope<T>> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    const json = (await res.json()) as ZarinpalEnvelope<T>;
    return json;
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error("ZARINPAL_TIMEOUT");
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

export async function requestZarinpalPayment(params: {
  amountInRial: number;
  callbackUrl: string;
  description: string;
  mobile?: string;
  email?: string;
}): Promise<
  | { ok: true; authority: string; paymentUrl: string }
  | { ok: false; message: string; code?: number }
> {
  const merchantId = process.env.ZARINPAL_MERCHANT_ID;
  if (!merchantId) {
    return { ok: false, message: "پیکربندی درگاه پرداخت ناقص است" };
  }

  const metadata: Record<string, string> = {};
  if (params.mobile) metadata.mobile = params.mobile;
  if (params.email) metadata.email = params.email;

  const payload = {
    merchant_id: merchantId,
    amount: params.amountInRial,
    callback_url: params.callbackUrl,
    description: params.description.slice(0, 255),
    ...(Object.keys(metadata).length > 0 ? { metadata } : {}),
  };

  let lastMessage = "خطا در اتصال به درگاه پرداخت";
  let lastCode: number | undefined;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const result = await postJson<{
        code: number;
        message: string;
        authority: string;
        fee_type?: string;
        fee?: number;
      }>(getRequestUrl(), payload);

      const code = result.data?.code ?? result.errors?.code;
      const authority = result.data?.authority;

      if (code === 100 && authority) {
        return {
          ok: true,
          authority,
          paymentUrl: getPaymentRedirectUrl(authority),
        };
      }

      lastCode = code;
      lastMessage =
        result.data?.message ||
        result.errors?.message ||
        "خطا در ایجاد درخواست پرداخت";

      if (code === -12) break;
      if (attempt < MAX_ATTEMPTS) {
        await new Promise((r) => setTimeout(r, 400));
      }
    } catch (err) {
      const isTimeout =
        err instanceof Error && err.message === "ZARINPAL_TIMEOUT";
      lastMessage = isTimeout
        ? "درگاه پرداخت پاسخ نداد. لطفاً دوباره تلاش کنید."
        : "خطا در اتصال به درگاه پرداخت";
      if (attempt < MAX_ATTEMPTS && !isTimeout) {
        await new Promise((r) => setTimeout(r, 400));
        continue;
      }
      if (isTimeout) break;
    }
  }

  return { ok: false, message: lastMessage, code: lastCode };
}

export async function verifyZarinpalPayment(params: {
  amountInRial: number;
  authority: string;
}): Promise<{
  ok: boolean;
  code?: number;
  message?: string;
  refId?: string;
  cardPan?: string;
  fee?: number;
  feeType?: string;
}> {
  const merchantId = process.env.ZARINPAL_MERCHANT_ID;
  if (!merchantId) {
    return { ok: false, message: "پیکربندی درگاه ناقص است" };
  }

  try {
    const result = await postJson<{
      code: number;
      message: string;
      ref_id: number;
      card_pan?: string;
      fee?: number;
      fee_type?: string;
    }>(getVerifyUrl(), {
      merchant_id: merchantId,
      amount: params.amountInRial,
      authority: params.authority,
    });

    const code = result.data?.code ?? result.errors?.code;
    if (code === 100 && result.data?.ref_id) {
      return {
        ok: true,
        code,
        message: result.data.message,
        refId: String(result.data.ref_id),
        cardPan: result.data.card_pan,
        fee: result.data.fee,
        feeType: result.data.fee_type,
      };
    }

    return {
      ok: false,
      code,
      message:
        result.data?.message ||
        result.errors?.message ||
        "خطا در تایید پرداخت",
    };
  } catch (err) {
    const isTimeout =
      err instanceof Error && err.message === "ZARINPAL_TIMEOUT";
    return {
      ok: false,
      message: isTimeout
        ? "تایید پرداخت زمان‌بر شد. وضعیت را از لیست نوبت‌ها بررسی کنید."
        : "خطا در تایید پرداخت",
    };
  }
}
