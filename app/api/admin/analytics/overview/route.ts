import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { withAdminAuth } from "@/lib/middleware/withAdmin";

export const GET = withAdminAuth(async function (req: NextRequest) {
  try {
    const db = (await clientPromise).db("janaram-db");

    const usersCol = db.collection("users");
    const chatCol = db.collection("chat-history");

    const today = new Date().toISOString().split("T")[0];
    const startOfToday = new Date(today);
    const endOfToday = new Date(today);
    endOfToday.setDate(endOfToday.getDate() + 1);

    // 1️⃣ total users
    const totalUsers = await usersCol.countDocuments();

    // 2️⃣ active users today
    const activeUsersToday = await usersCol.countDocuments({
      "conversationCount.date": today,
      "conversationCount.count": { $gt: 0 },
    });

    // 3️⃣ paid users (valid subscription)
    const paidUsers = await usersCol.countDocuments({
      plan: { $ne: "free" },
      subscriptionEndDate: { $gt: new Date() },
    });

    // 4️⃣ conversations today
    const totalConversationsToday = await chatCol.countDocuments({
      timestamp: {
        $gte: startOfToday,
        $lt: endOfToday,
      },
    });

    // 5️⃣ conversion rate
    const conversionRate =
      totalUsers === 0
        ? 0
        : Number(((paidUsers / totalUsers) * 100).toFixed(2));

    return NextResponse.json(
      {
        success: true,
        data: {
          totalUsers,
          activeUsersToday,
          paidUsers,
          conversionRate,
          totalConversationsToday,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Admin overview analytics error:", error);
    return NextResponse.json(
      { success: false, message: "خطا در دریافت آمار داشبورد" },
      { status: 500 }
    );
  }
});
