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
    const { message } = await req.json();
    if (!message || typeof message !== "string") {
      return NextResponse.json({ success: false, message: "پیام نامعتبر است" }, { status: 400 });
    }

    const db = (await clientPromise).db("janaram-db");
    const users = db.collection<User>("users");
    const today = new Date().toISOString().split("T")[0];

    // Convert user.sub (string) to ObjectId
    let userId: ObjectId;
    try {
      userId = new ObjectId(user.sub);
    } catch (err) {
      console.error("Invalid user.sub format:", user.sub, err);
      return NextResponse.json({ success: false, message: "شناسه کاربر نامعتبر است" }, { status: 400 });
    }

    // Check conversation limit for free plan
    if (user.plan === "free") {
      const userDoc = await users.findOne({ _id: userId });
      if (!userDoc) {
        console.error("User not found for _id:", userId.toString());
        return NextResponse.json({ success: false, message: "کاربر یافت نشد" }, { status: 404 });
      }

      const conversationCount = userDoc.conversationCount?.date === today ? userDoc.conversationCount.count : 0;

      if (conversationCount >= 10) {
        return NextResponse.json(
          { success: false, message: "حداکثر تعداد گفت‌وگوهای روزانه برای طرح رایگان به پایان رسیده است" },
          { status: 429 }
        );
      }

      // Increment conversation count
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

    // Prepare messages for OpenRouter
    let messages: { role: "user" | "assistant"; content: string }[] = [
      {
        role: "user",
        content: `به عنوان یک روانشناس در دو جمله به این متن پاسخ بده: ${message}`,
      },
    ];

    // Include recent chat history for unlimited plans
    if (user.plan === "unlimited" || user.plan === "unlimited_plus") {
      const chatHistory = db.collection<ChatHistory>("chat_history");
      const recentHistory = await chatHistory
        .find({ userId: userId })
        .sort({ createdAt: -1 })
        .limit(5) // Adjust based on context window
        .toArray();

      const historyMessages = recentHistory.flatMap((conv) => conv.messages);
      messages.unshift(...historyMessages.slice(-10)); // Include last 10 messages
    }

    // Call OpenRouter DeepSeek API
    const completion = await client.chat.completions.create({
      model: "deepseek/deepseek-chat-v3-0324",
      messages,
    });

    const aiResponse = completion.choices[0]?.message?.content;
    if (!aiResponse) {
      return NextResponse.json({ success: false, message: "پاسخی از هوش مصنوعی دریافت نشد" }, { status: 500 });
    }

    // Store conversation in chat_history for unlimited plans
    if (user.plan === "unlimited" || user.plan === "unlimited_plus") {
      const chatHistory = db.collection<ChatHistory>("chat_history");
      const conversationId = randomBytes(16).toString("hex");
      const newConversation: Omit<ChatHistory, "_id"> = {
        userId: userId,
        conversationId,
        messages: [
          { role: "user", content: message, timestamp: new Date() },
          { role: "assistant", content: aiResponse, timestamp: new Date() },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await chatHistory.insertOne(newConversation);
    }

    return NextResponse.json({
      success: true,
      data: { response: aiResponse },
    });
  } catch (err: any) {
    console.error("Error in conversation:", err);
    if (err.response?.status === 429) {
      return NextResponse.json(
        { success: false, message: "حداکثر تعداد درخواست‌های روزانه برای حساب رایگان OpenRouter به پایان رسیده است" },
        { status: 429 }
      );
    }
    return NextResponse.json({ success: false, message: "خطای سرور" }, { status: 500 });
  }
});
