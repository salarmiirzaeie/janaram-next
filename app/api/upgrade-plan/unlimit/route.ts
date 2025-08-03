import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { User } from "@/lib/types/user";
import { withAuth } from "@/lib/middleware/withAuth";

export const POST = withAuth(async (req: NextRequest, user: any) => {
  try {
    // تبدیل user.sub به ObjectId
    let userId: ObjectId;
    try {
      userId = new ObjectId(user.sub);
    } catch (err) {
      console.error("فرمت user.sub نامعتبر است:", user.sub, err);
      return NextResponse.json({ success: false, message: "شناسه کاربر نامعتبر است" }, { status: 400 });
    }

    const db = (await clientPromise).db("janaram-db");
    const users = db.collection<User>("users");

    // بررسی کاربر
    const userDoc = await users.findOne({ _id: userId });
    if (!userDoc) {
      console.error("کاربر یافت نشد برای _id:", userId.toString());
      return NextResponse.json({ success: false, message: "کاربر یافت نشد" }, { status: 404 });
    }

    // جلوگیری از ارتقا اگر کاربر قبلاً در طرح unlimited یا unlimited_plus است
    if (userDoc.plan === "unlimited" || userDoc.plan === "unlimited_plus") {
      return NextResponse.json({ success: false, message: "شما قبلاً در طرح پرمیوم هستید" }, { status: 400 });
    }

    // به‌روزرسانی طرح کاربر به unlimited
    await users.updateOne(
      { _id: userId },
      {
        $set: {
          plan: "unlimited",
          updatedAt: new Date(),
          // ریست تعداد گفت‌وگوهای روزانه (اختیاری)
          conversationCount: { date: new Date().toISOString().split("T")[0], count: 0 },
        },
      }
    );

    return NextResponse.json({
      success: true,
      message: "طرح شما با موفقیت به نامحدود ارتقا یافت",
    });
  } catch (err: any) {
    console.error("خطا در ارتقای طرح:", err);
    return NextResponse.json({ success: false, message: "خطای سرور در ارتقای طرح" }, { status: 500 });
  }
});
