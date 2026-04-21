import { withAuth } from "@/lib/middleware/withAuth";
import clientPromise from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";

export const GET = withAuth(async function (req: NextRequest, user: any) {
  try {
    // Get user ID from auth
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

    const client = await clientPromise;
    const db = client.db("janaram-db");
    const collection = db.collection("breathing");
    const users = db.collection("users");

    // Check if user exists
    const userDoc = await users.findOne({ _id: userId });
    if (!userDoc) {
      console.error("User not found for _id:", userId.toString());
      return NextResponse.json(
        { success: false, message: "کاربر یافت نشد" },
        { status: 404 }
      );
    }

    const isUserUnlimited = userDoc.plan === "unlimited";

    // Fetch all breathings (no filters)
    const breathings = await collection
      .find({})
      .sort({ createdAt: -1, listenCount: -1 }) // Sort by newest first, then most popular
      .project({
        _id: 1,
        title: 1,
        type: 1,
        url: 1,
        imageUrl: 1,
        description: 1,
        duration: 1,
        isPremium: 1,
        exhaleDuration: 1,
        inhaleDuration: 1,
        holdDuration: 1,
        listenCount: 1,
        createdAt: 1,
      })
      .toArray();

    // Transform breathings based on user's access level
    const transformedBreathings = breathings.map((breathing) => {
      const isPremium = breathing.isPremium === true;
      const hasAccess = !isPremium || isUserUnlimited;

      return {
        id: breathing._id.toString(),
        title: breathing.title,
        type: breathing.type,
        file: !hasAccess ? "/meditations/silent_1s.mp3" : breathing.url,
        image: breathing.imageUrl,
        description: !hasAccess
          ? "🌙 این تنفس مخصوص کاربران پرو است. اشتراک پرو رو فعال کن و از تمرین‌های حرفه‌ای و آرامش‌بخش و چت بات روانشناسی نامحدود و تخصصی استفاده کن"
          : breathing.description,
        duration: breathing.duration,
        exhaleDuration: breathing.exhaleDuration || 5000,
        inhaleDuration: breathing.inhaleDuration || 5000,
        holdDuration: breathing.holdDuration || 5000,
        isPremium: isPremium,
        hasAccess: hasAccess,
        listenCount: breathing.listenCount || 0,
        createdAt: breathing.createdAt,
      };
    });

    return NextResponse.json(
      {
        success: true,
        data: transformedBreathings,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching breathings:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
});
