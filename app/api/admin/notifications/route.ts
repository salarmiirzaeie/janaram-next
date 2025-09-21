// app/api/admin/notifications/send/route.ts
import { withAdminAuth } from "@/lib/middleware/withAdmin";
import { NextRequest, NextResponse } from "next/server";
import { sendToAll } from "@/lib/notifications";

export const POST = withAdminAuth(async (req: NextRequest) => {
  try {
    const body = await req.json();
    const title = body.title?.toString();
    const message = body.message?.toString();
    const data = body.data || {};

    // Validate input
    if (!title || !message) {
      return NextResponse.json({ success: false, message: "Title and message are required" }, { status: 400 });
    }

    // Send notification
    await sendToAll({
      title,
      body: message,
      data,
    });

    return NextResponse.json({ success: true, message: "Notification sent successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error sending notification:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
});
