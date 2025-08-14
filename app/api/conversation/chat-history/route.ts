import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { User } from "@/lib/types/user";
import { withAuth } from "@/lib/middleware/withAuth";

// GET handler to fetch paginated user chat history
export const GET = withAuth(async (req: NextRequest, user: any) => {
  try {
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = parseInt(url.searchParams.get("limit") || "10", 10);

    if (page < 1 || limit < 1) {
      return NextResponse.json({ success: false, message: "پارامترهای صفحه‌بندی نامعتبر هستند" }, { status: 400 });
    }

    const db = (await clientPromise).db("janaram-db");
    const users = db.collection<User>("users");

    let userId: ObjectId;
    try {
      userId = new ObjectId(user.sub);
    } catch (err) {
      console.error("Invalid user.sub format:", user.sub, err);
      return NextResponse.json({ success: false, message: "شناسه کاربر نامعتبر است" }, { status: 400 });
    }

    const pipeline = [
      { $match: { _id: userId } },
      { $unwind: { path: "$messages", preserveNullAndEmptyArrays: true } }, // Handle empty messages array
      { $sort: { "messages.timestamp": -1 } }, // Sort newest first
      { $skip: (page - 1) * limit },
      { $limit: limit },
      {
        $group: {
          _id: "$_id",
          messages: { $push: "$messages" },
        },
      },
    ];

    const [userDoc] = await users.aggregate(pipeline).toArray();

    if (!userDoc) {
      console.error("User not found for _id:", userId.toString());
      return NextResponse.json({ success: false, message: "کاربر یافت نشد" }, { status: 404 });
    }

    const totalMessagesResult = await users
      .aggregate([
        { $match: { _id: userId } },
        { $project: { messageCount: { $size: { $ifNull: ["$messages", []] } } } },
      ])
      .toArray();
    const totalMessages = totalMessagesResult[0]?.messageCount || 0;
    const totalPages = Math.ceil(totalMessages / limit);

    return NextResponse.json({
      success: true,
      data: {
        messages: (userDoc.messages || []).filter((msg: any) => msg !== null), // Filter out null messages from unwind
        pagination: {
          page,
          limit,
          totalMessages,
          totalPages,
        },
      },
    });
  } catch (err: any) {
    console.error("Error fetching chat history:", {
      error: err.message,
      stack: err.stack,
    });
    return NextResponse.json({ success: false, message: "خطای سرور" }, { status: 500 });
  }
});
