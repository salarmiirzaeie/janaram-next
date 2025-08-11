import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { User } from "@/lib/types/user";
import { withAuth } from "@/lib/middleware/withAuth";

interface Plan {
  name: "free" | "unlimited" | "unlimited_plus";
  description: string;
  features: string[];
  isActive: boolean;
  price: number;
  id: string;
}

export const GET = withAuth(async (req: NextRequest, user: any) => {
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

    // دریافت اطلاعات کاربر
    const userDoc = await users.findOne({ _id: userId });
    if (!userDoc) {
      console.error("کاربر یافت نشد برای _id:", userId.toString());
      return NextResponse.json({ success: false, message: "کاربر یافت نشد" }, { status: 404 });
    }

    // تعریف طرح‌ها با توضیحات به فارسی
    const plans: Plan[] = [
      {
        name: "free",
        description: "طرح رایگان با امکانات پایه",
        features: [
          "حداکثر 10 گفت‌وگوی روزانه",
          "دسترسی به تاریخچه 10 گفت‌وگوی اخیر",
          "پاسخ‌های همدلانه مبتنی بر روانشناسی",
        ],
        isActive: userDoc.plan === "free",
        id: "0",
        price: 0,
      },
      {
        name: "unlimited",
        description: "طرح نامحدود با امکانات پیشرفته",
        features: [
          "گفت‌وگوهای نامحدود روزانه",
          "دسترسی به تاریخچه کامل گفت‌وگوها",
          "پاسخ‌های شخصی‌سازی‌شده با نام کاربر",
        ],
        isActive: userDoc.plan === "unlimited",
        id: "123456",
        price: 29,
      },
    ];

    return NextResponse.json({
      success: true,
      data: { plans },
    });
  } catch (err: any) {
    console.error("خطا در دریافت طرح‌ها:", err);
    return NextResponse.json({ success: false, message: "خطای سرور در دریافت طرح‌ها" }, { status: 500 });
  }
});
