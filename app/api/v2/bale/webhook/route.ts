import { NextRequest, NextResponse } from "next/server";
import { handleBaleUpdate } from "@/lib/bale/webhook-handler";

export async function POST(req: NextRequest) {
  try {
    const update = await req.json();
    await handleBaleUpdate(update);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
