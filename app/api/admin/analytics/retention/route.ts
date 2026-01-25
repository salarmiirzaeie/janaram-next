// pages/api/admin/analytics/retention.ts
import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import moment from "moment-timezone";

export const GET = async (req: NextRequest) => {
  try {
    const db = (await clientPromise).db("janaram-db");
    const usersCollection = db.collection("users");
    const today = moment.tz("Asia/Tehran").startOf("day");

    // بازه 7 روز اخیر
    const days = 7;
    const retentionData = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = today.clone().subtract(i, "days");
      const dayUsers = await usersCollection
        .find({ createdAt: { $lte: date.toDate() } })
        .toArray();

      const retainedUsers = dayUsers.filter((user) => {
        return (
          user.lastActiveAt && moment(user.lastActiveAt).isSameOrAfter(date)
        );
      }).length;

      retentionData.push({
        date: date.format("YYYY-MM-DD"),
        retainedUsers,
        totalUsers: dayUsers.length,
      });
    }

    return NextResponse.json({ success: true, data: retentionData });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { success: false, message: "خطای سرور" },
      { status: 500 }
    );
  }
};
