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
    const chatHistory = db.collection("chat-history");

    let userId: ObjectId;
    try {
      userId = new ObjectId(user.sub);
    } catch (err) {
      console.error("Invalid user.sub format:", user.sub, err);
      return NextResponse.json({ success: false, message: "شناسه کاربر نامعتبر است" }, { status: 400 });
    }

    // Check user's plan
    const userDoc = await users.findOne({ _id: userId }, { projection: { plan: 1 } });
    if (!userDoc) {
      console.error("User not found for _id:", userId.toString());
      return NextResponse.json({ success: false, message: "کاربر یافت نشد" }, { status: 404 });
    }

    // Return empty array if user does not have pro or premium plan
    if (!["pro", "premium", "unlimited"].includes(userDoc.plan)) {
      return NextResponse.json({
        success: true,
        data: {
          messages: [],
          pagination: {
            page,
            limit,
            totalMessages: 0,
            totalPages: 0,
          },
        },
      });
    }

    // Fetch chat history from chat-history collection
    const messages = await chatHistory
      .find({ userId: userId })
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();

    const totalMessages = await chatHistory.countDocuments({ userId: userId });
    const totalPages = Math.ceil(totalMessages / limit);

    return NextResponse.json({
      success: true,
      data: {
        messages: messages.filter((msg) => msg !== null),
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
