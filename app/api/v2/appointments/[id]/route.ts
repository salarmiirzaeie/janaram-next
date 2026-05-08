// app/api/appointments/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { withAuth } from "@/lib/middleware/withAuth";

export const DELETE = withAuth(async (req: NextRequest, user: any) => {
  try {
    // Extract the appointment ID from the URL path
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/");
    const id = pathParts[pathParts.length - 1]; // last segment

    if (!id) {
      return NextResponse.json(
        { success: false, message: "شناسه نوبت نامعتبر است" },
        { status: 400 }
      );
    }

    const db = (await clientPromise).db("janaram-db");
    const appointments = db.collection("appointments");

    const appointment = await appointments.findOne({ _id: new ObjectId(id) });
    if (!appointment) {
      return NextResponse.json(
        { success: false, message: "نوبت یافت نشد" },
        { status: 404 }
      );
    }

    if (appointment.userId !== user.sub) {
      return NextResponse.json(
        { success: false, message: "شما مجاز به لغو این نوبت نیستید" },
        { status: 403 }
      );
    }

    if (appointment.status === "cancelled") {
      return NextResponse.json(
        { success: false, message: "این نوبت قبلاً لغو شده است" },
        { status: 400 }
      );
    }
    if (appointment.status === "completed") {
      return NextResponse.json(
        { success: false, message: "نوبت‌های انجام شده قابل لغو نیستند" },
        { status: 400 }
      );
    }

    await appointments.updateOne(
      { _id: new ObjectId(id) },
      { $set: { status: "cancelled", cancelledAt: new Date() } }
    );

    return NextResponse.json({
      success: true,
      message: "نوبت با موفقیت لغو شد",
    });
  } catch (err: any) {
    console.error("Error cancelling appointment:", err);
    return NextResponse.json(
      { success: false, message: err.message || "خطای سرور" },
      { status: 500 }
    );
  }
});
