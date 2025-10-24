import { withAuth } from "@/lib/middleware/withAuth";
import clientPromise from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";

export const GET = withAuth(async function (req: NextRequest) {
  try {
    // Get the 'type' query parameter, if provided
    const type = req.nextUrl.searchParams.get("type")?.toString();

    // Validate type if provided
    if (
      type &&
      ![
        "calm",
        "love",
        "instrumental",
        "sleep",
        "nature",
        "story",
        "sleep-music",
      ].includes(type)
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid meditation type" },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db("janaram-db");
    const collection = db.collection("meditations");

    // Build query: empty for all meditations, or filter by type
    const query = type ? { type } : {};

    // Fetch meditations, sorted by createdAt in descending order (newer first)
    const meditations = await collection
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    // Return response
    return NextResponse.json(
      {
        success: true,
        meditations: meditations.reverse().map((med) => ({
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
    console.error("Error fetching meditations:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
});
