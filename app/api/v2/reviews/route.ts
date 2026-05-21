import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { withAuth } from "@/lib/middleware/withAuth";
import { isReviewWindowOpen } from "@/lib/booking-lifecycle";

export const POST = withAuth(async (req: NextRequest, user: any) => {
  try {
    const { appointmentId, doctorId, rating, comment } = await req.json();
    console.log({ appointmentId, doctorId, rating, comment });
    // اعتبارسنجی
    if (!appointmentId || !doctorId || !rating) {
      return NextResponse.json(
        { success: false, message: "اطلاعات ناقص است" },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { success: false, message: "امتیاز باید بین 1 تا 5 باشد" },
        { status: 400 }
      );
    }

    const db = (await clientPromise).db("janaram-db");
    const reviews = db.collection("reviews");
    const appointments = db.collection("appointments");
    const psychologists = db.collection("psychologists");

    // بررسی وجود نوبت و تعلق آن به کاربر
    const appointment = await appointments.findOne({
      _id: new ObjectId(appointmentId),
      userId: user.sub,
      status: "completed",
    });

    if (!appointment) {
      return NextResponse.json(
        { success: false, message: "نوبت انجام شده یافت نشد" },
        { status: 404 }
      );
    }

    if (!isReviewWindowOpen(appointment)) {
      return NextResponse.json(
        {
          success: false,
          message: "مهلت ثبت نظر برای این جلسه به پایان رسیده است",
        },
        { status: 400 }
      );
    }

    // بررسی اینکه قبلاً نظر ثبت نشده باشد
    const existingReview = await reviews.findOne({ appointmentId });
    if (existingReview) {
      return NextResponse.json(
        { success: false, message: "شما قبلاً برای این نوبت نظر ثبت کرده‌اید" },
        { status: 409 }
      );
    }

    // ثبت نظر
    const review = {
      appointmentId,
      doctorId,
      userId: user.sub,
      rating,
      comment: comment || "",
      status: "approved", // یا pending برای نیاز به تأیید ادمین
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await reviews.insertOne(review);

    // به‌روزرسانی میانگین امتیاز روانشناس
    const allReviews = await reviews.find({ doctorId }).toArray();
    const avgRating =
      allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

    await psychologists.updateOne(
      { _id: new ObjectId(doctorId) },
      { $set: { rating: Math.round(avgRating * 10) / 10 } }
    );

    return NextResponse.json({
      success: true,
      message: "نظر شما با موفقیت ثبت شد",
      data: { id: result.insertedId.toString() },
    });
  } catch (err: any) {
    console.error("Error creating review:", err);
    return NextResponse.json(
      { success: false, message: "خطای سرور" },
      { status: 500 }
    );
  }
});
