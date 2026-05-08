import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { withDoctorAuth } from "@/lib/doctor/lib/middleware/withDoctorAuth";

export const PUT = withDoctorAuth(
  async (req: NextRequest, doctor: any, context?: { params?: any }) => {
    try {
      const { id } = context?.params || {};
      const { status } = await req.json();

      if (!id || !status) {
        return NextResponse.json(
          { success: false, message: "شناسه نوبت و وضعیت الزامی است" },
          { status: 400 }
        );
      }

      const validStatuses = ["confirmed", "completed", "cancelled", "no-show"];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { success: false, message: "وضعیت نامعتبر است" },
          { status: 400 }
        );
      }

      const db = (await clientPromise).db("janaram-db");
      const appointments = db.collection("appointments");

      const appointment = await appointments.findOne({
        _id: new ObjectId(id),
        doctorId: doctor.sub,
      });

      if (!appointment) {
        return NextResponse.json(
          { success: false, message: "نوبت یافت نشد یا متعلق به شما نیست" },
          { status: 404 }
        );
      }

      await appointments.updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            status,
            updatedAt: new Date(),
            ...(status === "completed" && { completedAt: new Date() }),
          },
        }
      );

      return NextResponse.json({
        success: true,
        message: `وضعیت نوبت با موفقیت به ${status} تغییر یافت`,
      });
    } catch (err: any) {
      console.error("Error updating appointment status:", err);
      return NextResponse.json(
        { success: false, message: "خطای سرور" },
        { status: 500 }
      );
    }
  }
);
