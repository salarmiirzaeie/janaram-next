import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { withAuth } from "@/lib/middleware/withAuth";
import moment from "moment-timezone";

// GET handler to retrieve last 28 days activity (active/inactive)
export const GET = withAuth(async (req: NextRequest, user: any) => {
  try {
    // Validate userId
    let userId: ObjectId;
    try {
      userId = new ObjectId(user.sub);
    } catch (err) {
      console.error("Invalid user.sub format:", user.sub, err);
      return NextResponse.json({ success: false, message: "شناسه کاربر نامعتبر است" }, { status: 400 });
    }

    const db = (await clientPromise).db("janaram-db");
    const moodHistory = db.collection("mood-history");

    // Define date range (last 28 days including today)
    const today = moment.tz("Asia/Tehran").startOf("day");
    const startDate = today.clone().subtract(27, "days");

    // Fetch mood records for this period
    const moods = await moodHistory
      .find({
        userId,
        date: {
          $gte: startDate.format("YYYY-MM-DD"),
          $lte: today.format("YYYY-MM-DD"),
        },
      })
      .project({ date: 1 }) // only fetch date
      .toArray();

    const moodDates = new Set(moods.map((m) => m.date));

    // Build 28-day activity array
    const days: any[] = [];
    for (let i = 0; i < 28; i++) {
      const date = startDate.clone().add(i, "days").format("YYYY-MM-DD");
      days.push({
        date,
        active: moodDates.has(date),
      });
    }

    // Split into weeks (7 days each), reverse so newest week comes first
    const weeks: any[] = [];
    for (let i = 0; i < 4; i++) {
      const week = days.slice(i * 7, (i + 1) * 7);
      weeks.unshift(week); // put latest week at the beginning
    }

    return NextResponse.json({
      success: true,
      message: "فعالیت ۲۸ روز اخیر با موفقیت دریافت شد",
      data: weeks,
    });
  } catch (err: any) {
    console.error("Error retrieving 28-day activity:", {
      error: err.message,
      stack: err.stack,
    });
    return NextResponse.json({ success: false, message: "خطای سرور" }, { status: 500 });
  }
});
