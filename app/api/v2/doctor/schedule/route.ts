import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { withDoctorAuth } from "@/lib/doctor/lib/middleware/withDoctorAuth";

// GET : دریافت ساعت‌های کاری فعلی
export const GET = withDoctorAuth(async (req: NextRequest, doctor: any) => {
  try {
    const db = (await clientPromise).db("janaram-db");
    const psychologists = db.collection("psychologists");

    const doctorDoc = await psychologists.findOne(
      { _id: new ObjectId(doctor.sub) },
      { projection: { schedule: 1, offDays: 1 } }
    );

    if (!doctorDoc) {
      return NextResponse.json(
        { success: false, message: "روانشناس یافت نشد" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        schedule: doctorDoc.schedule || {},
        offDays: doctorDoc.offDays || [],
      },
    });
  } catch (err: any) {
    console.error("Error fetching schedule:", err);
    return NextResponse.json(
      { success: false, message: "خطای سرور" },
      { status: 500 }
    );
  }
});

// PUT : بروزرسانی ساعت‌های کاری
export const PUT = withDoctorAuth(async (req: NextRequest, doctor: any) => {
  try {
    const { schedule, offDays } = await req.json();

    if (!schedule || typeof schedule !== "object") {
      return NextResponse.json(
        { success: false, message: "فرمت ساعت کاری نامعتبر است" },
        { status: 400 }
      );
    }

    // اعتبارسنجی ساده روزها (0=شنبه تا 6=جمعه)
    const validDays = [0, 1, 2, 3, 4, 5, 6];
    for (const day of Object.keys(schedule)) {
      const dayNum = parseInt(day);
      if (!validDays.includes(dayNum)) {
        return NextResponse.json(
          { success: false, message: `روز ${day} نامعتبر است (0-6)` },
          { status: 400 }
        );
      }
      if (!Array.isArray(schedule[day])) {
        return NextResponse.json(
          {
            success: false,
            message: `ساعت‌های روز ${day} باید به صورت آرایه باشد`,
          },
          { status: 400 }
        );
      }
    }

    const db = (await clientPromise).db("janaram-db");
    const psychologists = db.collection("psychologists");

    const updateData: any = {
      schedule: schedule,
      updatedAt: new Date(),
    };

    if (offDays && Array.isArray(offDays)) {
      updateData.offDays = offDays;
    }

    await psychologists.updateOne(
      { _id: new ObjectId(doctor.sub) },
      { $set: updateData }
    );

    return NextResponse.json({
      success: true,
      message: "ساعت کاری با موفقیت به‌روزرسانی شد",
      data: { schedule, offDays: offDays || [] },
    });
  } catch (err: any) {
    console.error("Error updating schedule:", err);
    return NextResponse.json(
      { success: false, message: "خطای سرور" },
      { status: 500 }
    );
  }
});
