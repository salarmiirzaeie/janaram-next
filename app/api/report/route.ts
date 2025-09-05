import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { withAuth } from "@/lib/middleware/withAuth";
interface MoodHistoryItem {
  _id: string;
  date: string;
  mood: number | null;
  note?: string;
}

interface MoodHistoryResponse {
  success: boolean;
  data: MoodHistoryItem[];
  pagination: {
    totalRecords: number;
    totalPages: number;
    currentPage: number;
    limit: number;
  };
}

export const GET = withAuth(async (req: NextRequest, user: any) => {
  try {
    const db = (await clientPromise).db("janaram-db");
    const moodHistoryCollection = db.collection("mood-history");

    const userId = new ObjectId(user.sub);

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    if (isNaN(page) || page < 1)
      return NextResponse.json({ success: false, message: "شماره صفحه باید مثبت باشد" }, { status: 400 });
    if (isNaN(limit) || limit < 1)
      return NextResponse.json({ success: false, message: "حداکثر تعداد باید مثبت باشد" }, { status: 400 });

    const totalRecords = await moodHistoryCollection.countDocuments({ userId });
    const totalPages = Math.ceil(totalRecords / limit);
    const skip = (page - 1) * limit;

    const moods = await moodHistoryCollection.find({ userId }).sort({ date: -1 }).skip(skip).limit(limit).toArray();

    const sanitizedMoods = moods.map((m) => ({
      _id: m._id.toString(),
      date: m.date,
      mood: m.mood,
      note: m.note,
    }));

    return NextResponse.json({
      success: true,
      data: sanitizedMoods,
      pagination: {
        totalRecords,
        totalPages,
        currentPage: page,
        limit,
      },
    });
  } catch (err) {
    console.error("Error retrieving moods:", err);
    return NextResponse.json({ success: false, message: "خطای سرور" }, { status: 500 });
  }
});
