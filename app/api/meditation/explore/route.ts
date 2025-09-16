import { withAuth } from "@/lib/middleware/withAuth";
import clientPromise from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";

export const GET = withAuth(async function (req: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db("janaram-db");
    const collection = db.collection("meditations");

    const meditationTypes = ["calm", "love", "instrumental", "sleep", "nature", "story", "sleep-music"];

    const result: { [key: string]: any[] } = {};
    for (const type of meditationTypes) {
      // Sort by _id descending (or createdAt if you have it) to get last 5
      const meditations = await collection
        .find({ type })
        .sort({ createdAt: -1 }) // -1 for descending, 1 for ascending
        .limit(5)
        .toArray();

      result[type === "sleep-music" ? "sleepMusic" : type] = meditations.map((med) => ({
        id: med._id.toString(),
        title: med.title,
        type: med.type,
        file: med.fileUrl,
        image: med.imageUrl,
        description: med.description,
        duration: med.duration,
        isSuggested: med.isSuggested || false,
      }));
    }

    return NextResponse.json({ success: true, meditations: result }, { status: 200 });
  } catch (error) {
    console.error("Error fetching explore meditations:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
});
