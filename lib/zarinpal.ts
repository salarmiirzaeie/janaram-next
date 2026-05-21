// lib/zarinpal.ts
import ZarinPal from "zarinpal-node-sdk";

let zarinpalInstance: any = null;

export const getZarinpal = () => {
  if (!zarinpalInstance) {
    zarinpalInstance = new ZarinPal({
      merchantId: process.env.ZARINPAL_MERCHANT_ID!,
      sandbox: process.env.NODE_ENV !== "production",
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
