// app/api/admin/analytics/paid-users/route.ts
import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { withAdminAuth } from "@/lib/middleware/withAdmin";
import { addDays, format } from "date-fns";

export const GET = withAdminAuth(async (req: NextRequest) => {
  try {
    const daysParam = req.nextUrl.searchParams.get("days") || "30";
    const days = parseInt(daysParam);

    const client = await clientPromise;
    const db = client.db("janaram-db");
    const users = db.collection("users");

    const today = new Date();
    const startDate = addDays(today, -days + 1);

    // Aggregate paid users per day
    const pipeline = [
      {
        $match: {
          plan: "unlimited",
          subscriptionDate: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$subscriptionDate" },
          },
          count: { $sum: 1 },
          revenue: { $sum: "$subscriptionPrice" }, // فرض: subscriptionPrice در سند کاربر
        },
      },
      { $sort: { _id: 1 } },
    ];

    const results = await users.aggregate(pipeline).toArray();

    // Fill missing dates with 0
    const data: { date: string; count: number; revenue: number }[] = [];
    for (let i = 0; i < days; i++) {
      const date = format(addDays(startDate, i), "yyyy-MM-dd");
      const record = results.find((r) => r._id === date);
      data.push({
        date,
        count: record?.count || 0,
        revenue: record?.revenue || 0,
      });
    }

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (err) {
    console.error("Error fetching paid users:", err);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
});
