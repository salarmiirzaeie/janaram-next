import { withAuth } from "@/lib/middleware/withAuth";
import clientPromise from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";

export const GET = withAuth(async function (req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = req.nextUrl.pathname.split("/").pop(); // Extract ID from URL

    // Validate ID
    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: "Invalid breathing ID" }, { status: 400 });
    }

    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db("janaram-db");
    const collection = db.collection("breathing");

    // Fetch meditation by ID
    const meditation = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $inc: { listenCount: 1 } }, // Only increment listenCount
      { returnDocument: "after" } // Return the updated document
    );

    if (!meditation) {
      return NextResponse.json({ success: false, message: "Meditation not found" }, { status: 404 });
    }

    // Return response
    return NextResponse.json(
      {
        success: true,
        meditation: {
          id: meditation._id.toString(),
          title: meditation.title,
          type: meditation.type,
          file: meditation.url,
          image: meditation.imageUrl,
          description: meditation.description,
          duration: meditation.duration,
          exhaleDuration: meditation.exhaleDuration,
          inhaleDuration: meditation.inhaleDuration,
          holdDuration: meditation.holdDuration,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching meditation:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
});
