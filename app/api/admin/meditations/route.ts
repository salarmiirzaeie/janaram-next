import { BASE_URL_IMAGES } from "@/lib/constants";
import { withAdminAuth } from "@/lib/middleware/withAdmin";
import clientPromise from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";

export const GET = withAdminAuth(async function (req: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db("janaram-db");
    const collection = db.collection("meditations");

    const meditations = await collection.find({}).toArray();
    return NextResponse.json({
      success: true,
      meditations: meditations.map((med) => ({
        id: med._id.toString(),
        title: med.title,
        type: med.type,
        file: med.fileUrl,
        image: med.imageUrl,
        description: med.description,
        duration: med.duration,
        isSuggested: med.isSuggested,
        accessLevel: med.accessLevel,
        listenCount: med.listenCount,
        file2: BASE_URL_IMAGES + med.fileUrl,
        image2: BASE_URL_IMAGES + med.imageUrl,
      })),
    });
  } catch (error) {
    console.error("Error fetching meditations:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
});
