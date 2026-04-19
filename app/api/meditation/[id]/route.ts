import { withAuth } from "@/lib/middleware/withAuth";
import clientPromise from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { User } from "@/lib/types/user";

export const GET = withAuth(async function (req: NextRequest, user: any) {
  try {
    const id = req.nextUrl.pathname.split("/").pop();

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
      return NextResponse.json(
        { success: false, message: "شناسه کاربر نامعتبر است" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("janaram-db");

    // Parallel execution for faster response
    const [meditation, userPlan] = await Promise.all([
      db.collection("meditations").findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $inc: { listenCount: 1 } },
        {
          returnDocument: "after",
          projection: {
            _id: 1,
            title: 1,
            type: 1,
            fileUrl: 1,
            imageUrl: 1,
            description: 1,
            duration: 1,
            isSuggested: 1,
            accessLevel: 1,
          },
        }
      ),
      db
        .collection("users")
        .findOne({ _id: userId }, { projection: { plan: 1 } }),
    ]);

    if (!meditation) {
      return NextResponse.json(
        { success: false, message: "Meditation not found" },
        { status: 404 }
      );
    }

    if (!userPlan) {
      return NextResponse.json(
        { success: false, message: "کاربر یافت نشد" },
        { status: 404 }
      );
    }

    const isPro = meditation.accessLevel === "unlimited";
    const isUserUnlimited = userPlan.plan === "unlimited";

    // Use conditional response without code duplication
    const response = {
      success: true,
      meditation: {
        id: meditation._id.toString(),
        title: meditation.title,
        type: meditation.type,
        file:
          isPro && !isUserUnlimited
            ? "/meditations/silent_1s.mp3"
            : meditation.fileUrl,
        image: meditation.imageUrl,
        description:
          isPro && !isUserUnlimited
            ? "🌙 این مدیتیشن مخصوص کاربران پرو است. اشتراک پرو رو فعال کن و از تمرین‌های حرفه‌ای و آرامش‌بخش و چت بات روانسناسی نامحدود و تخصصی استفاده کن"
            : meditation.description,
        duration: meditation.duration,
        isSuggested: meditation.isSuggested || false,
        isPro: isPro,
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Error fetching meditation:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
});
