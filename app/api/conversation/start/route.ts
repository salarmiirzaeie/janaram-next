import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { OpenAI } from "openai";
import { ObjectId } from "mongodb";
import { User } from "@/lib/types/user";
import { withAuth } from "@/lib/middleware/withAuth";

const retryRequest = async (fn: () => Promise<any>, maxAttempts = 3, delay = 1000) => {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      if (attempt === maxAttempts || error.response?.status === 429) throw error;
      await new Promise((resolve) => setTimeout(resolve, delay * Math.pow(2, attempt - 1))); // Exponential backoff
    }
  }
};
// Environment variable validation
const OPENROUTER_API_KEY = process.env.EXPO_PUBLIC_CHATBOT_KEY_NEW || "";
if (!OPENROUTER_API_KEY) throw new Error("OPENROUTER_API_KEY is not defined");

const client = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: OPENROUTER_API_KEY,
  defaultHeaders: {
    "X-OpenRouter-Provider": "openai,deepseek", // Specify allowed providers
  },
});

// Migration function to transform chat_history to chat-history

export const POST = withAuth(async (req: NextRequest, user: any) => {
  try {
    const db = (await clientPromise).db("janaram-db");

    // Run migration once at the start

    const { message } = await req.json();
    if (!message || typeof message !== "string") {
      return NextResponse.json({ success: false, message: "پیام نامعتبر است" }, { status: 400 });
    }

    const users = db.collection<User>("users");
    const chatHistory = db.collection("chat-history");
    const today = new Date().toISOString().split("T")[0];

    // Convert user.sub to ObjectId
    let userId: ObjectId;
    try {
      userId = new ObjectId(user.sub);
    } catch (err) {
      console.error("Invalid user.sub format:", user.sub, err);
      return NextResponse.json({ success: false, message: "شناسه کاربر نامعتبر است" }, { status: 400 });
    }

    // Fetch user data
    let userDoc = await users.findOne({ _id: userId });
    if (!userDoc || !userDoc._id) {
      console.error("User not found or missing _id for user.sub:", user.sub);
      return NextResponse.json({ success: false, message: "کاربر یافت نشد یا شناسه معتبر نیست" }, { status: 404 });
    }

    // Check if unlimited plan has expired
    const now = new Date();
    if (userDoc.plan !== "free" && userDoc.subscriptionEndDate && userDoc.subscriptionEndDate < now) {
      await users.updateOne(
        { _id: userId },
        {
          $set: { plan: "free", updatedAt: now },
          $unset: { subscriptionEndDate: "", subscriptionDuration: "" },
        }
      );
      userDoc = await users.findOne({ _id: userId });
      if (!userDoc || !userDoc._id) {
        console.error("User not found after update for _id:", userId.toString());
        return NextResponse.json({ success: false, message: "کاربر یافت نشد" }, { status: 404 });
      }
    }

    // Check conversation limit for free plan
    if (userDoc.plan === "free") {
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
    let messages: { role: "system" | "user" | "assistant"; content: string }[] = [];

    // System prompt
    const systemPrompt =
      userDoc.plan === "free"
        ? `شما یک روانشناس حرفه‌ای هستید، فقط در دو جمله پاسخ دهید`
        : `شما یک روانشناس حرفه‌ای هستید، فقط در دو جمله پاسخ دهید. مخاطب ${userDoc.name} است`;

    // Retrieve last two conversations from chat-history collection
    const recentMessages = await chatHistory.find({ userId: userId }).sort({ timestamp: -1 }).limit(2).toArray();

    if (recentMessages.length > 0) {
      messages.push(
        ...recentMessages.flatMap((msg) => [
          { role: "user" as "user" | "assistant", content: msg.user },
          { role: "assistant" as "user" | "assistant", content: msg.ai },
        ])
      );
    }

    // Add new user message and system prompt
    messages.push({ role: "user", content: message });
    messages.push({ role: "system", content: systemPrompt });

    // Call OpenRouter API
    const models = ["openai/gpt-oss-20b:free", "deepseek/deepseek-chat-v3-0324:free"];
    let completion;
    for (const model of models) {
      try {
        completion = await retryRequest(() =>
          client.chat.completions.create({
            model,
            messages,
          })
        );
        break;
      } catch (apiError: any) {
        console.error("OpenRouter API Error:", {
          model,
          status: apiError.response?.status,
          message: apiError.message,
          details: apiError.response?.data,
        });
        if (apiError.response?.status === 429) {
          return NextResponse.json(
            { success: false, message: "حداکثر تعداد درخواست‌های روزانه برای حساب رایگان به پایان رسیده است" },
            { status: 429 }
          );
        }
        if (model === models[models.length - 1]) {
          return NextResponse.json(
            { success: false, message: "خطای سرور هوش مصنوعی. لطفاً دوباره تلاش کنید." },
            { status: apiError.response?.status || 502 }
          );
        }
        continue; // Try next model
      }
    }

    // Validate API response
    if (!completion || !completion.choices || !Array.isArray(completion.choices) || completion.choices.length === 0) {
      console.error("Invalid OpenRouter response:", completion);
      return NextResponse.json({ success: false, message: "پاسخ نامعتبری از هوش مصنوعی دریافت شد" }, { status: 500 });
    }

    const aiResponse = completion.choices[0].message?.content;
    if (!aiResponse) {
      console.error("No content in OpenRouter response:", completion.choices[0]);
      return NextResponse.json({ success: false, message: "پاسخی از هوش مصنوعی دریافت نشد" }, { status: 500 });
    }

    // Store new conversation in chat-history collection
    const newConversation = {
      userId: userId,
      user: message,
      ai: aiResponse,
      timestamp: new Date(),
    };
    await chatHistory.insertOne(newConversation);

    return NextResponse.json({
      success: true,
      data: { response: aiResponse },
    });
  } catch (err: any) {
    console.error("Error in conversation:", {
      error: err.message,
      stack: err.stack,
    });
    return NextResponse.json({ success: false, message: "خطای سرور" }, { status: 500 });
  }
});
