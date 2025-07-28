import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { User } from "@/lib/types/user";
import { ChatHistory } from "@/lib/types/chatHistory";
import { withAuth } from "@/lib/middleware/withAuth";

export const GET = withAuth(async (req: NextRequest, user: any) => {
  try {
    // تبدیل user.sub به ObjectId
    let userId: ObjectId;
    try {
      userId = new ObjectId(user.sub);
    } catch (err) {
      console.error("فرمت user.sub نامعتبر است:", user.sub, err);
      return NextResponse.json({ success: false, message: "شناسه کاربر نامعتبر است" }, { status: 400 });
    }

    const db = (await clientPromise).db("janaram-db");
    const users = db.collection<User>("users");
    const chatHistory = db.collection<ChatHistory>("chat_history");

    // دریافت اطلاعات کاربر
    const userDoc = await users.findOne({ _id: userId });
    if (!userDoc) {
      console.error("کاربر یافت نشد برای _id:", userId.toString());
      return NextResponse.json({ success: false, message: "کاربر یافت نشد" }, { status: 404 });
    }

    // بررسی دسترسی به تاریخچه (فقط برای unlimited و unlimited_plus)
    if (userDoc.plan === "free") {
      return NextResponse.json(
        { success: false, message: "دسترسی به تاریخچه گفت‌وگو برای طرح رایگان امکان‌پذیر نیست" },
        { status: 403 }
      );
    }

    // دریافت پارامترهای صفحه‌بندی
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = parseInt(url.searchParams.get("limit") || "10", 10);
    const skip = (page - 1) * limit;

    // بازیابی تاریخچه گفت‌وگوها
    const conversations = await chatHistory
      .find({ userId })
      .sort({ updatedAt: -1 }) // مرتب‌سازی بر اساس آخرین به‌روزرسانی
      .skip(skip)
      .limit(limit)
      .toArray();

    // شمارش کل گفت‌وگوها برای صفحه‌بندی
    const totalConversations = await chatHistory.countDocuments({ userId });

    return NextResponse.json({
      success: true,
      data: {
        conversations: conversations.map((conv) => ({
          conversationId: conv.conversationId,
          createdAt: conv.createdAt,
          updatedAt: conv.updatedAt,
          messages: conv.messages,
        })),
        totalConversations,
        page,
        limit,
        totalPages: Math.ceil(totalConversations / limit),
      },
    });
  } catch (err: any) {
    console.error("خطا در دریافت تاریخچه گفت‌وگو:", err);
    return NextResponse.json({ success: false, message: "خطای سرور در دریافت تاریخچه گفت‌وگو" }, { status: 500 });
  }
});
