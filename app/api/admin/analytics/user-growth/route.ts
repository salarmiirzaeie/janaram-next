import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { withAdminAuth } from "@/lib/middleware/withAdmin";
import { subDays, formatISO } from "date-fns";

// GET /api/admin/analytics/user-growth
export const GET = withAdminAuth(async (req) => {
  try {
    const db = (await clientPromise).db("janaram-db");
    const users = db.collection("users");

    // Optional: get days query param, default 7
    const daysParam = req.nextUrl.searchParams.get("days");
    const days = daysParam ? parseInt(daysParam) : 7;

    const today = new Date();
    const startDate = subDays(today, days - 1); // last N days

    // Aggregate users by day
    const pipeline = [
      {
        $match: {
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ];

    const aggResult = await users.aggregate(pipeline).toArray();

    // Fill missing days with 0
    const result: { date: string; count: number }[] = [];
    for (let i = 0; i < days; i++) {
      const d = subDays(today, days - 1 - i);
      const dayStr = formatISO(d, { representation: "date" });
      const found = aggResult.find((r) => r._id === dayStr);
      result.push({ date: dayStr, count: found ? found.count : 0 });
    }

    return NextResponse.json({ success: true, data: result }, { status: 200 });
  } catch (err) {
    console.error("User growth API error:", err);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
});
