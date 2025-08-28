import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { withAuth } from "@/lib/middleware/withAuth";
import moment from "moment-timezone"; // For Gregorian date handling with time zone

interface IMood {
  mood: number | null;
  note?: string;
}

// Helper function to get today's Gregorian date in Asia/Tehran time zone
const getTodayGregorianDate = (): string => {
  return moment.tz("Asia/Tehran").format("YYYY-MM-DD"); // e.g., 2025-08-27
};
const getTommorrowGregorianDate = (): string => {
  return moment.tz("Asia/Tehran").add(1, "day").format("YYYY-MM-DD"); // e.g., 2025-08-28
};

// POST handler to set or edit today's mood
export const POST = withAuth(async (req: NextRequest, user: any) => {
  try {
    const body = await req.json();
    const { mood, note } = body;

    // Validate mood
    if (mood !== null && (typeof mood !== "number" || mood < 0 || mood > 10)) {
      return NextResponse.json(
        { success: false, message: "مقدار mood باید بین 0 تا 10 یا null باشد" },
        { status: 400 }
      );
    }

    // Validate userId
    let userId: ObjectId;
    try {
      userId = new ObjectId(user.sub);
    } catch (err) {
      console.error("Invalid user.sub format:", user.sub, err);
      return NextResponse.json({ success: false, message: "شناسه کاربر نامعتبر است" }, { status: 400 });
    }

    // Sanitize note
    const sanitizedNote = note;

    // Connect to MongoDB
    const db = (await clientPromise).db("janaram-db");
    const moodHistory = db.collection("mood-history");

    // Get today's date
    const today = getTodayGregorianDate();

    // Check if mood entry exists for today
    const existingMood = await moodHistory.findOne({ userId, date: today });

    if (existingMood) {
      // Update existing mood
      const result = await moodHistory.updateOne(
        { userId, date: today },
        {
          $set: {
            mood,
            note: sanitizedNote,
            updatedAt: new Date(),
          },
        }
      );

      if (result.modifiedCount === 0) {
        return NextResponse.json({ success: false, message: "به‌روزرسانی انجام نشد" }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        message: "حالت امروز به‌روزرسانی شد",
        data: {
          _id: existingMood._id,
          date: today,
          mood,
          note: sanitizedNote,
          updatedAt: new Date(),
        },
      });
    } else {
      // Create new mood entry
      const moodEntry = {
        userId,
        date: today,
        mood,
        note: sanitizedNote,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await moodHistory.insertOne(moodEntry);

      return NextResponse.json({
        success: true,
        message: "حالت امروز ثبت شد",
        data: {
          _id: result.insertedId,
          date: today,
          mood,
          note: sanitizedNote,
          createdAt: moodEntry.createdAt,
          updatedAt: moodEntry.updatedAt,
        },
      });
    }
  } catch (err: any) {
    console.error("Error processing mood:", {
      error: err.message,
      stack: err.stack,
    });
    return NextResponse.json({ success: false, message: "خطای سرور" }, { status: 500 });
  }
});

// GET handler to retrieve user's mood history with pagination
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

    // Get query parameters for pagination
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    // Validate pagination parameters
    if (isNaN(page) || page < 1) {
      return NextResponse.json({ success: false, message: "شماره صفحه باید یک عدد مثبت باشد" }, { status: 400 });
    }
    if (isNaN(limit) || limit < 1) {
      return NextResponse.json({ success: false, message: "حداکثر تعداد باید یک عدد مثبت باشد" }, { status: 400 });
    }

    // Connect to MongoDB
    const db = (await clientPromise).db("janaram-db");
    const moodHistory = db.collection("mood-history");

    // Build query
    const query = { userId };

    // Get total count for pagination
    const totalRecords = await moodHistory.countDocuments(query);

    // Calculate pagination
    const totalPages = Math.ceil(totalRecords / limit);
    const skip = (page - 1) * limit;

    // Fetch paginated mood records, sorted by date descending
    const moods = await moodHistory.find(query).sort({ date: -1 }).skip(skip).limit(limit).toArray();

    // Sanitize notes in response
    const sanitizedMoods = moods.map((mood) => ({
      _id: mood._id,
      date: mood.date,
      mood: mood.mood,
      note: mood.note,
    }));

    return NextResponse.json({
      success: true,
      message: "سوابق حالت با موفقیت دریافت شد",
      data: sanitizedMoods,
      pagination: {
        totalRecords,
        currentPage: page,
        totalPages,
        limit,
      },
    });
  } catch (err: any) {
    console.error("Error retrieving moods:", {
      error: err.message,
      stack: err.stack,
    });
    return NextResponse.json({ success: false, message: "خطای سرور" }, { status: 500 });
  }
});
