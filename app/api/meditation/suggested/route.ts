import { withAuth } from "@/lib/middleware/withAuth";
import clientPromise from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";

export const GET = withAuth(async function (req: NextRequest) {
  console.log("object");
  try {
    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db("janaram-db");
    const collection = db.collection("meditations");

    // Fetch meditations where isSuggested is true
    const meditations = await collection.find({ isSuggested: true }).toArray();

    // Return response
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
