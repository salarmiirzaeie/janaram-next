// lib/zarinpal.ts
import ZarinPal from "zarinpal-node-sdk";

let zarinpalInstance: any = null;

export const getZarinpal = () => {
  if (!zarinpalInstance) {
    zarinpalInstance = new ZarinPal({
      merchantId: process.env.ZARINPAL_MERCHANT_ID!,
      sandbox: process.env.NODE_ENV !== "production", // در development از sandbox استفاده کن
      // accessToken: process.env.ZARINPAL_ACCESS_TOKEN, // فقط برای عملیات خاص مثل refund
    });
  }
  return zarinpalInstance;
};

export const getPaymentRedirectUrl = (authority: string) => {
  const isSandbox = process.env.NODE_ENV !== "production";
  return isSandbox
    ? `https://sandbox.zarinpal.com/pg/StartPay/${authority}`
    : `https://www.zarinpal.com/pg/StartPay/${authority}`;
};
