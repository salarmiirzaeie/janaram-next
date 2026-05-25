import { BASE_URL_IMAGES } from "@/lib/constants";
import { withAuth } from "@/lib/middleware/withAuth";
import clientPromise from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";

export const GET = withAuth(async function (req: NextRequest) {
  try {
    // Get the 'type' query parameter
    const type = req.nextUrl.searchParams.get("category")?.toString();

    // Validate input
    if (
      type &&
      ![
        "instrumental",
        "nature",
        "love",
        "calm",
        "sleep",
        "sleep-music",
        "story",
        "self",
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

    // Build query
    let query = {};

    if (type === "sleep") {
      // When category is sleep, fetch sleep, sleep-music, and story together
      query = { type: { $in: ["sleep", "sleep-music", "story"] } };
    } else if (type) {
      query = { type };
    }

    // Fetch meditations
    const meditations = await collection
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

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
          file2: BASE_URL_IMAGES + med.fileUrl,
          image2: BASE_URL_IMAGES + med.imageUrl,
          description: med.description,
          duration: med.duration,
          isPro: med.accessLevel === "unlimited",
          createdAt: med.createdAt,
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
