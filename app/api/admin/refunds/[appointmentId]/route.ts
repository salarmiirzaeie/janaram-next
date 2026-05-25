import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { withAdminAuth } from "@/lib/middleware/withAdmin";
import { resolvePendingRefund } from "@/lib/refunds-admin";

export const PATCH = withAdminAuth(
  async (req: NextRequest, admin: { sub?: string }) => {
    try {
      const url = new URL(req.url);
      const pathParts = url.pathname.split("/").filter(Boolean);
      const appointmentId = pathParts[pathParts.length - 1];

      if (!appointmentId || appointmentId === "refunds") {
        return NextResponse.json(
          { success: false, message: "شناسه نوبت الزامی است" },
          { status: 400 }
        );
      }

      const body = await req.json();
      const action = body.action as string;
      const note = body.note as string | undefined;

      if (action !== "processed" && action !== "rejected") {
        return NextResponse.json(
          {
            success: false,
            message: "action باید processed یا rejected باشد",
          },
          { status: 400 }
        );
      }

      const db = (await clientPromise).db("janaram-db");
      const result = await resolvePendingRefund(db, appointmentId, {
        action,
        adminNote: note,
        adminSub: admin?.sub,
      });

      if (!result.ok) {
        return NextResponse.json(
          { success: false, message: result.message },
          { status: result.status }
        );
      }

      return NextResponse.json({
        success: true,
        message:
          action === "processed"
            ? "بازپرداخت به‌عنوان انجام‌شده ثبت شد"
            : "درخواست بازپرداخت رد شد",
      });
    } catch (err: any) {
      console.error("Error resolving refund:", err);
      return NextResponse.json(
        { success: false, message: err.message || "خطای سرور" },
        { status: 500 }
      );
    }
  }
);
