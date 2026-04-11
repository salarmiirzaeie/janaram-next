// route.ts
import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { User } from "@/lib/types/user";
import { withAuth } from "@/lib/middleware/withAuth";
import { Plan } from "../plans/route";
const plans: Plan[] = [
  {
    name: "free",
    description: "طرح رایگان با امکانات پایه",
    features: ["حداکثر 10 گفت‌وگوی روزانه"],
    id: "0",
    price: 0,
  },
  {
    name: "unlimited",
    description: "طرح نامحدود با امکانات پیشرفته برای ۱ ماه",
    features: [
      " پیشنهاد تمرینات پیشرفته آگاه سازی و آرام سازی",
      "دسترسی به مدیتیشن های نامحدود و حرفه ای",
      "گفت وکوی نامحدود روزانه با روانشناس من",
      "دسترسی به گزارش‌های تحلیلی حال روحی‌",
      "دسترسی به تاریخچه کامل گفت‌وگوها",
      "پاسخ‌های شخصی‌سازی‌شده با تحلیل عمیق",
    ],
    id: "123456",
    price: 199,
    duration: 1,
  },

  // {
  //   name: "premium",
  //   description: "طرح نامحدود با امکانات پیشرفته برای ۳ ماه",
  //   features: ["گفت‌وگوهای نامحدود روزانه", "دسترسی به تاریخچه کامل گفت‌وگوها", "پاسخ‌های شخصی‌سازی‌شده "],
  //   id: "1234567",
  //   price: 79,
  //   duration: 1,
  // },
  // {
  //   name: "pro",
  //   description: "طرح نامحدود با امکانات پیشرفته برای ۶ ماه",
  //   features: ["گفت‌وگوهای نامحدود روزانه", "دسترسی به تاریخچه کامل گفت‌وگوها", "پاسخ‌های شخصی‌سازی‌شده با تحلیل عمیق"],
  //   id: "12345678",
  //   price: 149,
  //   duration: 1,
  // },
];
export const POST = withAuth(async (req: NextRequest, user: any) => {
  try {
    const { id } = await req.json();
    // Convert user.sub to ObjectId
    let userId: ObjectId;
    try {
      userId = new ObjectId(user.sub);
    } catch (err) {
      console.error("Invalid user.sub format:", user.sub, err);
      return NextResponse.json(
        { success: false, message: "شناسه کاربر نامعتبر است" },
        { status: 400 }
      );
    }
    console.log(id, "paid", userId);

    const db = (await clientPromise).db("janaram-db");
    const users = db.collection<User>("users");

    // Fetch user data
    let userDoc = await users.findOne({ _id: userId });
    if (!userDoc || !userDoc._id) {
      console.error("User not found or missing _id for user.sub:", user.sub);
      return NextResponse.json(
        { success: false, message: "کاربر یافت نشد یا شناسه معتبر نیست" },
        { status: 404 }
      );
    }

    // Check if unlimited plan has expired
    const now = new Date();
    if (
      userDoc.plan !== "free" &&
      userDoc.subscriptionEndDate &&
      userDoc.subscriptionEndDate < now
    ) {
      await users.updateOne(
        { _id: userId },
        {
          $set: { plan: "free", updatedAt: now },
          $unset: { subscriptionEndDate: "", subscriptionDuration: "" },
        }
      );
      if (!userDoc || !userDoc._id) {
        console.error(
          "User not found after update for _id:",
          userId.toString()
        );
        return NextResponse.json(
          { success: false, message: "کاربر یافت نشد" },
          { status: 404 }
        );
      }
    }
    let plan = plans.find((plan) => plan.id === id)?.name || "free";

    // Prevent upgrade if already on active unlimited plan
    if (
      userDoc.plan === plan &&
      userDoc.subscriptionEndDate &&
      userDoc.subscriptionEndDate > now
    ) {
      return NextResponse.json(
        { success: false, message: `شما از قبل در طرح ${plan} هستید` },
        { status: 400 }
      );
    }

    let duration = plans.find((plan) => plan.id === id)?.duration || 1;
    // Calculate expiration date
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + duration);

    // Upgrade to unlimited plan
    await users.updateOne(
      { _id: userId },
      {
        $set: {
          plan: plan,
          subscriptionDuration: duration,
          subscriptionEndDate: endDate,
          updatedAt: new Date(),
          conversationCount: {
            date: new Date().toISOString().split("T")[0],
            count: 0,
          },
        },
      }
    );

    return NextResponse.json({
      success: true,
      message: `طرح شما با موفقیت به Pro برای ${duration} ماه ارتقا یافت`,
    });
  } catch (err: any) {
    console.error("Error upgrading plan:", err);
    return NextResponse.json(
      { success: false, message: "خطای سرور در ارتقای طرح" },
      { status: 500 }
    );
  }
});
