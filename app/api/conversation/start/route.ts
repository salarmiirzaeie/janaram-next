import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { OpenAI } from "openai";
import { randomBytes } from "crypto";
import { ObjectId } from "mongodb";
import { User } from "@/lib/types/user";
import { ChatHistory } from "@/lib/types/chatHistory";
import { withAuth } from "@/lib/middleware/withAuth";

// Environment variable validation
const OPENROUTER_API_KEY = process.env.EXPO_PUBLIC_CHATBOT_KEY_NEW || "";
if (!OPENROUTER_API_KEY) throw new Error("OPENROUTER_API_KEY is not defined");

const client = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: OPENROUTER_API_KEY,
});

export const POST = withAuth(async (req: NextRequest, user: any) => {
  try {
    const { message, conversationId } = await req.json();
    if (!message || typeof message !== "string") {
      return NextResponse.json({ success: false, message: "پیام نامعتبر است" }, { status: 400 });
    }

    const db = (await clientPromise).db("janaram-db");
    const users = db.collection<User>("users");
    const chatHistory = db.collection<ChatHistory>("chat_history");
    const today = new Date().toISOString().split("T")[0];

    // تبدیل user.sub به ObjectId
    let userId: ObjectId;
    try {
      userId = new ObjectId(user.sub);
    } catch (err) {
      console.error("فرمت user.sub نامعتبر است:", user.sub, err);
      return NextResponse.json({ success: false, message: "شناسه کاربر نامعتبر است" }, { status: 400 });
    }

    // دریافت اطلاعات کاربر
    const userDoc = await users.findOne({ _id: userId });
    if (!userDoc) {
      console.error("کاربر یافت نشد برای _id:", userId.toString());
      return NextResponse.json({ success: false, message: "کاربر یافت نشد" }, { status: 404 });
    }

    // بررسی محدودیت گفت‌وگو برای طرح رایگان
    if (userDoc.plan === "free") {
      const conversationCount = userDoc.conversationCount?.date === today ? userDoc.conversationCount.count : 0;

      if (conversationCount >= 10) {
        return NextResponse.json(
          { success: false, message: "حداکثر تعداد گفت‌وگوهای روزانه برای طرح رایگان به پایان رسیده است" },
          { status: 429 }
        );
      }

      // افزایش تعداد گفت‌وگو
      await users.updateOne(
        { _id: userId },
        {
          $set: {
            conversationCount: { date: today, count: conversationCount + 1 },
            updatedAt: new Date(),
          },
        }
      );
    }

    // آماده‌سازی پیام‌ها برای OpenRouter
    let messages: { role: "system" | "user" | "assistant"; content: string }[] = [];

    // پرامپت سیستمی (کوتاه و بهینه)
    const systemPrompt =
      userDoc.plan === "free"
        ? "شما یک روانشناس حرفه‌ای هستید که در روش‌های مبتنی بر شواهد مانند درمان شناختی-رفتاری و درمان فردمحور آموزش دیده‌اید. با لحنی همدلانه و متناسب با فرهنگ ایرانی، در دو جمله پاسخ دهید که احساسات کاربر را تأیید کند و پیشنهادی سازنده ارائه دهد."
        : `شما یک روانشناس حرفه‌ای هستید که در روش‌های مبتنی بر شواهد مانند درمان شناختی-رفتاری و درمان فردمحور آموزش دیده‌اید. با توجه به اطلاعات کاربر (نام: ${
            userDoc.name || "کاربر"
          }، طرح: ${
            userDoc.plan
          })، با لحنی همدلانه و متناسب با فرهنگ ایرانی، در دو جمله پاسخ دهید که احساسات کاربر را تأیید کند و پیشنهادی سازنده ارائه دهد.`;

    messages.push({ role: "system", content: systemPrompt });

    // بازیابی تاریخچه گفت‌وگو برای همه طرح‌ها
    let newConversationId = conversationId || randomBytes(16).toString("hex");
    if (conversationId) {
      const existingConversation = await chatHistory.findOne({
        userId,
        conversationId,
      });
      if (existingConversation) {
        // فقط 3 پیام آخر را اضافه کن برای صرفه‌جویی در توکن‌ها
        const recentMessages = existingConversation.messages.slice(-3);
        messages.push(
          ...recentMessages.map((msg) => ({
            role: msg.role,
            content: msg.content,
          }))
        );
      }
    }

    // افزودن پیام جدید کاربر
    messages.push({ role: "user", content: message });

    // فراخوانی API DeepSeek
    const completion = await client.chat.completions.create({
      model: "deepseek/deepseek-chat-v3-0324",
      messages,
    });

    const aiResponse = completion.choices[0]?.message?.content;
    if (!aiResponse) {
      return NextResponse.json({ success: false, message: "پاسخی از هوش مصنوعی دریافت نشد" }, { status: 500 });
    }

    // ذخیره گفت‌وگو برای همه طرح‌ها
    const newMessage: { role: "user" | "assistant"; content: string; timestamp: Date }[] = [
      { role: "user", content: message, timestamp: new Date() },
      { role: "assistant", content: aiResponse, timestamp: new Date() },
    ];

    await chatHistory.updateOne(
      { userId, conversationId: newConversationId },
      {
        $push: { messages: { $each: newMessage } },
        $set: { updatedAt: new Date() },
        $setOnInsert: { createdAt: new Date(), userId, conversationId: newConversationId },
      },
      { upsert: true }
    );

    // برای طرح رایگان، محدود کردن تعداد گفت‌وگوها در تاریخچه
    if (userDoc.plan === "free") {
      const conversationCount = await chatHistory.countDocuments({ userId });
      if (conversationCount > 10) {
        const oldestConversations = await chatHistory
          .find({ userId })
          .sort({ createdAt: 1 })
          .limit(conversationCount - 10)
          .toArray();
        await chatHistory.deleteMany({
          userId,
          conversationId: { $in: oldestConversations.map((c) => c.conversationId) },
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: { response: aiResponse, conversationId: newConversationId },
    });
  } catch (err: any) {
    console.error("خطا در گفت‌وگو:", err);
    if (err.response?.status === 429) {
      return NextResponse.json(
        { success: false, message: "حداکثر تعداد درخواست‌های روزانه برای حساب رایگان OpenRouter به پایان رسیده است" },
        { status: 429 }
      );
    }
    return NextResponse.json({ success: false, message: "خطای سرور" }, { status: 500 });
  }
});
