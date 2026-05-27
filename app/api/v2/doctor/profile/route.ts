import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { withDoctorAuth } from "@/lib/doctor/lib/middleware/withDoctorAuth";
import { avatarApiUrl } from "@/lib/storage-url";

// GET : دریافت اطلاعات پروفایل
export const GET = withDoctorAuth(async (req: NextRequest, doctor: any) => {
  try {
    const db = (await clientPromise).db("janaram-db");
    const psychologists = db.collection("psychologists");

    const doctorDoc = await psychologists.findOne(
      { _id: new ObjectId(doctor.sub) },
      {
        projection: {
          name: 1,
          phone: 1,
          specialty: 1,
          specialties: 1,
          bio: 1,
          experience: 1,
          sessionPrice: 1,
          avatar: 1,
          categoryId: 1,
          isActive: 1,
          createdAt: 1,
          updatedAt: 1,
          medicalLicenseNumber: 1,
          successfulConsultations: 1,
          status: 1,
          rejectionReason: 1,
          baleId: 1, // اضافه شد
        },
      }
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
        id: doctorDoc._id.toString(),
        name: doctorDoc.name,
        phone: doctorDoc.phone,
        specialty: doctorDoc.specialty,
        specialties: doctorDoc.specialties || [],
        bio: doctorDoc.bio || "",
        experience: doctorDoc.experience || 0,
        sessionPrice: doctorDoc.sessionPrice || 0,
        avatar: avatarApiUrl(doctorDoc.avatar as string | null),
        categoryId: doctorDoc.categoryId || "individual",
        isActive: doctorDoc.isActive ?? true,
        createdAt: doctorDoc.createdAt,
        updatedAt: doctorDoc.updatedAt,
        medicalLicenseNumber: doctorDoc.medicalLicenseNumber || "",
        successfulConsultations: doctorDoc.successfulConsultations || 0,
        status: doctorDoc.status || "pending",
        rejectionReason: doctorDoc.rejectionReason || null,
        baleId: doctorDoc.baleId || null, // اضافه شد
      },
    });
  } catch (err: any) {
    console.error("Error fetching doctor profile:", err);
    return NextResponse.json(
      { success: false, message: "خطای سرور" },
      { status: 500 }
    );
  }
});

// PUT : بروزرسانی اطلاعات پروفایل
export const PUT = withDoctorAuth(async (req: NextRequest, doctor: any) => {
  try {
    const body = await req.json();
    const {
      name,
      specialty,
      specialties,
      bio,
      experience,
      sessionPrice,
      avatar,
      categoryId,
      baleId, // اضافه شد
    } = body;

    const db = (await clientPromise).db("janaram-db");
    const psychologists = db.collection("psychologists");

    // دریافت اطلاعات فعلی روانشناس
    const currentDoctor = await psychologists.findOne({
      _id: new ObjectId(doctor.sub),
    });
    if (!currentDoctor) {
      return NextResponse.json(
        { success: false, message: "روانشناس یافت نشد" },
        { status: 404 }
      );
    }

    // تمیز کردن baleId (حذف @ اگر در ابتدا باشد)
    let cleanedBaleId = baleId;
    if (cleanedBaleId && cleanedBaleId.startsWith("@")) {
      cleanedBaleId = cleanedBaleId.substring(1);
    }

    // ساخت شیء برای بروزرسانی (فقط فیلدهایی که ارسال شده‌اند)
    const updateFields: any = {
      updatedAt: new Date(),
    };

    if (name !== undefined) updateFields.name = name;
    if (specialty !== undefined) updateFields.specialty = specialty;
    if (specialties !== undefined) updateFields.specialties = specialties;
    if (bio !== undefined) updateFields.bio = bio;
    if (experience !== undefined) updateFields.experience = experience;
    if (sessionPrice !== undefined) updateFields.sessionPrice = sessionPrice;
    if (avatar !== undefined) updateFields.avatar = avatar;
    if (categoryId !== undefined) updateFields.categoryId = categoryId;
    if (cleanedBaleId !== undefined)
      updateFields.baleId = cleanedBaleId || null; // اضافه شد

    // اعتبارسنجی ساده
    if (
      sessionPrice !== undefined &&
      (sessionPrice < 0 || sessionPrice > 10000000)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "قیمت جلسه باید بین 0 تا 10,000,000 تومان باشد",
        },
        { status: 400 }
      );
    }

    if (experience !== undefined && (experience < 0 || experience > 100)) {
      return NextResponse.json(
        { success: false, message: "سال تجربه باید بین 0 تا 100 باشد" },
        { status: 400 }
      );
    }

    // اگر تخصص‌ها تغییر کرده، وضعیت را به pending برگردان تا ادمین دوباره بررسی کند
    if (
      specialties !== undefined &&
      JSON.stringify(currentDoctor.specialties) !== JSON.stringify(specialties)
    ) {
      updateFields.status = "pending";
      updateFields.rejectionReason = null;
    }

    const result = await psychologists.updateOne(
      { _id: new ObjectId(doctor.sub) },
      { $set: updateFields }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, message: "روانشناس یافت نشد" },
        { status: 404 }
      );
    }

    // دریافت اطلاعات بروز شده برای بازگشت
    const updatedDoctor = await psychologists.findOne(
      { _id: new ObjectId(doctor.sub) },
      {
        projection: {
          name: 1,
          phone: 1,
          specialty: 1,
          specialties: 1,
          bio: 1,
          experience: 1,
          sessionPrice: 1,
          avatar: 1,
          categoryId: 1,
          status: 1,
          baleId: 1, // اضافه شد
        },
      }
    );

    let message = "پروفایل با موفقیت به‌روزرسانی شد";
    if (updateFields.status === "pending") {
      message =
        "پروفایل با موفقیت به‌روزرسانی شد. پس از تأیید ادمین تغییرات اعمال می‌شود.";
    }

    return NextResponse.json({
      success: true,
      message: message,
      data: {
        name: updatedDoctor?.name,
        phone: updatedDoctor?.phone,
        specialty: updatedDoctor?.specialty,
        specialties: updatedDoctor?.specialties || [],
        bio: updatedDoctor?.bio || "",
        experience: updatedDoctor?.experience || 0,
        sessionPrice: updatedDoctor?.sessionPrice || 0,
        avatar: avatarApiUrl(updatedDoctor?.avatar as string | null),
        categoryId: updatedDoctor?.categoryId || "individual",
        status: updatedDoctor?.status || "pending",
        baleId: updatedDoctor?.baleId || null, // اضافه شد
      },
    });
  } catch (err: any) {
    console.error("Error updating doctor profile:", err);
    return NextResponse.json(
      { success: false, message: "خطای سرور" },
      { status: 500 }
    );
  }
});
