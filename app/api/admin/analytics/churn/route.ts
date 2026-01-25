import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { withAuth } from "@/lib/middleware/withAuth";
import moment from "moment-timezone";

export const GET = withAuth(async (req: NextRequest, user: any) => {
  try {
    const db = (await clientPromise).db("janaram-db");
    const userId = new ObjectId(user.sub);

    const params = new URL(req.url).searchParams;
    const days = parseInt(params.get("days") || "30", 10);

    const today = moment.tz("Asia/Tehran").startOf("day");
    const startDate = today.clone().subtract(days - 1, "days");

    const moodHistory = db.collection("mood-history");
    const userExercises = db.collection("user-exercises");

    // کل کاربران (فقط برای admin میشه همه کاربران یا برای simplicity user-specific)
    const allUsers = await db.collection("users").find({}).toArray();

    const churnData = [];

    for (let i = 0; i < days; i++) {
      const date = startDate.clone().add(i, "days").format("YYYY-MM-DD");

      // کاربرانی که مود یا تمرین ثبت نکردند
      const activeUserIdsFromMood = await moodHistory.distinct("userId", {
        date,
      });
      const activeUserIdsFromExercises = await userExercises.distinct(
        "userId",
        { date }
      );

      const activeUserSet = new Set([
        ...activeUserIdsFromMood.map((id) => id.toString()),
        ...activeUserIdsFromExercises.map((id) => id.toString()),
      ]);

      const inactiveUsersCount = allUsers.filter(
        (u) => !activeUserSet.has(u._id.toString())
      ).length;

      churnData.push({
        date,
        inactiveUsers: inactiveUsersCount,
      });
    }

    return NextResponse.json({
      success: true,
      message: `فعالیت ${days} روز گذشته با موفقیت دریافت شد`,
      data: churnData,
    });
  } catch (err) {
    console.error("Error fetching churn data:", err);
    return NextResponse.json(
      { success: false, message: "خطای سرور" },
      { status: 500 }
    );
  }
});
