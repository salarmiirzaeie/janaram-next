import { NextResponse } from "next/server";

export async function GET() {
  const webhookUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/bale/webhook`;
  const token = process.env.BALE_BOT_TOKEN;

  const response = await fetch(
    `https://tapi.bale.ai/bot${token}/setWebhook?url=${webhookUrl}`
  );
  const data = await response.json();

  return NextResponse.json({
    success: data.ok,
    message: data.ok ? "Webhook تنظیم شد" : "خطا در تنظیم Webhook",
    data,
  });
}
