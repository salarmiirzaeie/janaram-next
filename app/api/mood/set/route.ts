import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { withAuth } from "@/lib/middleware/withAuth";

interface IMood {
  date: string; // YYYY-MM-DD
  mood: number | null;
  note?: string;
}

// POST handler to store a user's mood
export const POST = withAuth(async (req: NextRequest, user: any) => {
  try {
    const body = await req.json();
    const { date, mood, note } = body;

    // Validate input
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ success: false, message: "فرمت تاریخ نامعتبر است" }, { status: 400 });
    }
    if (mood !== null && (typeof mood !== "number" || mood < 0 || mood > 10)) {
      return NextResponse.json(
        { success: false, message: "مقدار mood باید بین 0 تا 10 یا null باشد" },
        { status: 400 }
      );
    }

    let userId: ObjectId;
    try {
      userId = new ObjectId(user.sub);
    } catch (err) {
      console.error("Invalid user.sub format:", user.sub, err);
      return NextResponse.json({ success: false, message: "شناسه کاربر نامعتبر است" }, { status: 400 });
    }

    const db = (await clientPromise).db("janaram-db");
    const moodHistory = db.collection("mood-history");

    // Check if mood entry for this date already exists
    const existingMood = await moodHistory.findOne({ userId, date });
    if (existingMood) {
      return NextResponse.json({ success: false, message: "برای این تاریخ قبلاً حالتی ثبت شده است" }, { status: 400 });
    }

    // Insert new mood entry
    const result = await moodHistory.insertOne({
      userId,
      date,
      mood,
      note: note || "",
      timestamp: new Date(),
    });

    return NextResponse.json({
      success: true,
      data: {
        _id: result.insertedId,
        date,
        mood,
        note,
      },
    });
  } catch (err: any) {
    console.error("Error storing mood:", {
      error: err.message,
      stack: err.stack,
    });
    return NextResponse.json({ success: false, message: "خطای سرور" }, { status: 500 });
  }
});

// PUT handler to edit an existing mood entry by date
export const PUT = withAuth(async (req: NextRequest, user: any) => {
  try {
    const body = await req.json();
    const { date, mood, note } = body;

    // Validate input
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ success: false, message: "فرمت تاریخ نامعتبر است" }, { status: 400 });
    }
    if (mood !== null && (typeof mood !== "number" || mood < 0 || mood > 10)) {
      return NextResponse.json(
        { success: false, message: "مقدار mood باید بین 0 تا 10 یا null باشد" },
        { status: 400 }
      );
    }

    let userId: ObjectId;
    try {
      userId = new ObjectId(user.sub);
    } catch (err) {
      console.error("Invalid user.sub format:", user.sub, err);
      return NextResponse.json({ success: false, message: "شناسه کاربر نامعتبر است" }, { status: 400 });
    }

    const db = (await clientPromise).db("janaram-db");
    const moodHistory = db.collection("mood-history");

    // Check if the mood entry exists for the given date and user
    const existingMood = await moodHistory.findOne({ userId, date });
    if (!existingMood) {
      return NextResponse.json({ success: false, message: "حالت برای تاریخ مشخص شده یافت نشد" }, { status: 404 });
    }

    // Update mood entry
    const result = await moodHistory.updateOne(
      { userId, date },
      {
        $set: {
          mood,
          note: note || "",
          updatedAt: new Date(),
        },
      }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json({ success: false, message: "به‌روزرسانی انجام نشد" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: {
        _id: existingMood._id,
        date,
        mood,
        note,
      },
    });
  } catch (err: any) {
    console.error("Error updating mood:", {
      error: err.message,
      stack: err.stack,
    });
    return NextResponse.json({ success: false, message: "خطای سرور" }, { status: 500 });
  }
});
