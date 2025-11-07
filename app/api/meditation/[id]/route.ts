import { withAuth } from "@/lib/middleware/withAuth";
import clientPromise from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { User } from "@/lib/types/user";

export const GET = withAuth(async function (req: NextRequest, user: any) {
  try {
    const id = req.nextUrl.pathname.split("/").pop(); // Extract ID from URL
    // Validate ID
    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid meditation ID" },
        { status: 400 }
      );
    }
    let userId: ObjectId;
    try {
      userId = new ObjectId(user.sub);
    } catch (err) {
      console.error("Invalid user.sub format:", user.sub, err);
      return NextResponse.json(
        { success: false, message: "شناسه کاربر نامعتبر است" },
        { status: 400 }
      );
    }
    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db("janaram-db");
    const collection = db.collection("meditations");
    const users = db.collection<User>("users");

    // Check if user exists
    const userDoc = await users.findOne({ _id: userId });
    if (!userDoc) {
      console.error("User not found for _id:", userId.toString());
      return NextResponse.json(
        { success: false, message: "کاربر یافت نشد" },
        { status: 404 }
      );
    }

    // Fetch meditation by ID
    const meditation = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $inc: { listenCount: 1 } }, // Only increment listenCount
      { returnDocument: "after" } // Return the updated document
    );

    if (!meditation) {
      return NextResponse.json(
        { success: false, message: "Meditation not found" },
        { status: 404 }
      );
    }
    if (
      meditation?.accessLevel &&
      meditation.accessLevel === "unlimited" &&
      userDoc.plan !== "unlimited"
    ) {
      return NextResponse.json(
        {
          success: true,
          meditation: {
            id: meditation._id.toString(),
            title: meditation.title,
            type: meditation.type,
            file: "/meditations/silent_1s.mp3",
            image: meditation.imageUrl,
            description:
              "🌙 این مدیتیشن مخصوص کاربران پرو است.  اشتراک پرو رو فعال کن و از تمرین‌های حرفه‌ای و آرامش‌بخش و چت بات روانسناسی نامحدود و تخصصی استفاده کن",
            duration: meditation.duration,
            isSuggested: meditation.isSuggested || false,
            isPro: meditation.accessLevel === "unlimited",
          },
        },
        { status: 200 }
      );
    }
    // Return response
    return NextResponse.json(
      {
        success: true,
        meditation: {
          id: meditation._id.toString(),
          title: meditation.title,
          type: meditation.type,
          file: meditation.fileUrl,
          image: meditation.imageUrl,
          description: meditation.description,
          duration: meditation.duration,
          isSuggested: meditation.isSuggested || false,
          isPro: meditation.accessLevel === "unlimited",
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching meditation:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
});
