// pages/api/admin/analytics/dau-mau.ts
import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import moment from "moment-timezone";

export const GET = async (req: NextRequest) => {
  try {
    const db = (await clientPromise).db("janaram-db");
    const users = db.collection("users");
    const exercises = db.collection("user-exercises");

    const today = moment.tz("Asia/Tehran").startOf("day");
    const monthAgo = today.clone().subtract(30, "days");

    const dauData = [];
    for (let i = 0; i < 30; i++) {
      const date = monthAgo.clone().add(i, "days").format("YYYY-MM-DD");
      const activeUsers = await exercises.distinct("userId", { date });
      dauData.push({ date, activeUsers: activeUsers.length });
    }

    const mauUsers = await exercises.distinct("userId", {
      date: { $gte: monthAgo.format("YYYY-MM-DD") },
    });

    return NextResponse.json({
      success: true,
      data: {
        dau: dauData,
        mau: mauUsers.length,
        stickiness: Math.round(
          (dauData.reduce((sum, d) => sum + d.activeUsers, 0) /
            30 /
            mauUsers.length) *
            100
        ),
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { success: false, message: "خطای سرور" },
      { status: 500 }
    );
  }
};
