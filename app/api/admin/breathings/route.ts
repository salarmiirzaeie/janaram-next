import { withAdminAuth } from "@/lib/middleware/withAdmin";
import clientPromise from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";

export const GET = withAdminAuth(async function (req: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db("janaram-db");
    const collection = db.collection("breathing");
    const breathings = await collection.find({}).toArray();

    return NextResponse.json({
      success: true,
      breathings: breathings.map((med) => ({
        id: med._id.toString(),
        title: med.title,
        type: med.type,
        file: med.url,
        image: med.imageUrl,
        description: med.description,
        duration: med.duration,
        isPremium: med?.isPremium,

        inhaleDuration: med.inhaleDuration,
        holdDuration: med.holdDuration,
        exhaleDuration: med.exhaleDuration,
        listenCount: med.listenCount,
      })),
    });
  } catch (error) {
    console.error("Error fetching breathings:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
});
