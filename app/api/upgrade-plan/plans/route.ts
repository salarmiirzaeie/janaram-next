// route.ts
import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { User } from "@/lib/types/user";
import { withAuth } from "@/lib/middleware/withAuth";

export interface Plan {
  name: "free" | "unlimited" | "premium" | "pro";
  description: string;
  features: string[];
  isActive?: boolean;
  price: number;
  id: string;
  duration?: number; // Duration in months for unlimited plans
  oldPrice?: number;
  isZarinPalEnabled?: boolean;
}

export const GET = withAuth(async (req: NextRequest, user: any) => {
  try {
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

    const db = (await clientPromise).db("janaram-db");
    const users = db.collection<User>("users");
    const plansConfig = db.collection("plans_config");

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
      userDoc.plan === "unlimited" &&
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

    // Fetch unlimited plan from database
    const unlimitedPlanFromDb = await plansConfig.findOne({
      name: "unlimited",
    });

    // Define plans with unlimited plan data from DB
    const plans: Plan[] = [
      {
        name: "free",
        description: "طرح رایگان با امکانات پایه",
        features: ["حداکثر 10 گفت‌وگوی روزانه"],
        isActive: userDoc.plan === "free",
        id: "0",
        price: 0,
      },
      {
        name: "unlimited",
        description:
          unlimitedPlanFromDb?.description || "طرح نامحدود برای ۱ ماه",
        features: unlimitedPlanFromDb?.features || [
          "Pro پیشنهاد روزانه تمرینات پیشرفته آگاه سازی و آرام سازی",
          "Pro دسترسی به تست های روانشناسی علمی و حرفه ای",
          "Pro دسترسی به مدیتیشن های نامحدود و حرفه ای",
          "گفت وگوی نامحدود با روانشناس هوش مصنوعی من",
          "دسترسی به گزارش‌ مخصوص حال روحی‌ تو",
          "دسترسی به تاریخچه کامل گفت‌وگوها",
          "پاسخ‌های شخصی‌سازی‌شده با تحلیل عمیق شخصیت من",
        ],
        isActive:
          userDoc.plan === "unlimited" &&
          (userDoc.subscriptionDuration === 1 || !userDoc.subscriptionDuration),
        id: unlimitedPlanFromDb?.id || "123456",
        price: unlimitedPlanFromDb?.price || 199,
        duration: unlimitedPlanFromDb?.duration || 1,
        oldPrice: unlimitedPlanFromDb?.oldPrice || 500,
        isZarinPalEnabled: unlimitedPlanFromDb?.isZarinPalEnabled || false,
      },
    ];

    return NextResponse.json({
      success: true,
      data: { plans },
    });
  } catch (err: any) {
    console.error("Error fetching plans:", err);
    return NextResponse.json(
      { success: false, message: "خطای سرور در دریافت طرح‌ها" },
      { status: 500 }
    );
  }
});
