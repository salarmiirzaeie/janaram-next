// app/api/admin/analytics/conversations/route.ts
import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { withAdminAuth } from "@/lib/middleware/withAdmin";

export const GET = withAdminAuth(async (req: Request) => {
  try {
    const url = new URL(req.url);
    const days = parseInt(url.searchParams.get("days") || "7", 10); // تعداد روزها
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const client = await clientPromise;
    const db = client.db("janaram-db");
    const moodsCollection = db.collection("mood-history");

    const data: { date: string; conversations: number }[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const start = new Date(date);
      const end = new Date(date);
      end.setDate(end.getDate() + 1);

      const count = await moodsCollection.countDocuments({
        timestamp: { $gte: start, $lt: end },
      });

      data.push({
        date: date.toISOString().split("T")[0],
        conversations: count,
      });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error fetching Moods usage", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
});
