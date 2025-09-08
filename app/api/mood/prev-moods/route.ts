import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { withAuth } from "@/lib/middleware/withAuth";

interface IMood {
  date: string; // YYYY-MM-DD
  mood: number | null;
  note?: string;
}

export const POST = withAuth(async (req: NextRequest, user: any) => {
  try {
    const body: IMood[] = await req.json();
    const moodArray = body;

    if (!Array.isArray(moodArray) || moodArray.length === 0) {
      return NextResponse.json({ success: false, message: "آرایه moods الزامی است" }, { status: 400 });
    }

    let userId: ObjectId;
    try {
      userId = new ObjectId(user.sub);
    } catch {
      return NextResponse.json({ success: false, message: "شناسه کاربر نامعتبر است" }, { status: 400 });
    }

    const db = (await clientPromise).db("janaram-db");
    const moodHistory = db.collection("mood-history");
    const userDoc = await db.collection("users").findOne({ _id: userId });

    if (!userDoc) {
      return NextResponse.json({ success: false, message: "کاربر یافت نشد" }, { status: 404 });
    }

    let insertedCount = 0;
    let updatedCount = 0;

    for (const item of moodArray) {
      const { date, mood, note } = item;

      // validation
      if (!date || typeof date !== "string") continue;
      if (mood !== null && (typeof mood !== "number" || mood < 0 || mood > 10)) continue;

      const existingMood = await moodHistory.findOne({ userId, date });

      if (existingMood) {
        await moodHistory.updateOne({ userId, date }, { $set: { mood, note, updatedAt: new Date() } });
        updatedCount++;
      } else {
        await moodHistory.insertOne({
          userId,
          date,
          mood,
          note,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        insertedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: "محرک‌های کاربر با موفقیت ذخیره شدند",
      data: { insertedCount, updatedCount },
    });
  } catch (err: any) {
    console.error("Error syncing moods:", err);
    return NextResponse.json({ success: false, message: "خطای سرور" }, { status: 500 });
  }
});
