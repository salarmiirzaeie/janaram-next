import { withAuth } from "@/lib/middleware/withAuth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { NextRequest, NextResponse } from "next/server";

const goalToMeditationType: Record<string, string[]> = {
  calm: ["calm", "love", "instrumental"],
  stress: ["calm", "love", "instrumental"],
  sleep: ["sleep", "sleep music", "story"],
  focus: ["instrumental"],
  confidence: ["love", "story"],
  control: ["calm", "instrumental"],
};

export const GET = withAuth(async (req: NextRequest, user: any) => {
  try {
    const client = await clientPromise;
    const db = client.db("janaram-db");
    const collection = db.collection("meditations");

    let userId: ObjectId;
    try {
      userId = new ObjectId(user.sub);
    } catch {
      return NextResponse.json({ success: false, message: "شناسه کاربر نامعتبر است" }, { status: 400 });
    }

    // گرفتن goals کاربر (ممکنه وجود نداشته باشه)
    const userDoc = await db.collection("users").findOne({ _id: userId });
    if (!userDoc) {
      return NextResponse.json({ success: false, message: "کاربر یافت نشد" }, { status: 404 });
    }
    const userGoals: string[] = userDoc?.goals || [];

    let matchQuery: any;

    if (userGoals.length > 0) {
      // اگر goals داشت
      const types = userGoals.flatMap((goal) => goalToMeditationType[goal] || []);
      matchQuery = { type: { $in: types } };
    } else {
      // اگر goals نداشت → از مدیتیشن‌های پیشنهادی عمومی
      matchQuery = { isSuggested: true };
    }

    // گرفتن فقط ۵ تا رندوم
    const meditations = await collection.aggregate([{ $match: matchQuery }, { $sample: { size: 5 } }]).toArray();

    return NextResponse.json(
      {
        success: true,
        meditations: meditations.map((med) => ({
          id: med._id.toString(),
          title: med.title,
          type: med.type,
          file: med.fileUrl,
          image: med.imageUrl,
          description: med.description,
          duration: med.duration,
          isSuggested: med.isSuggested || false,
        })),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching suggested meditations:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
});
