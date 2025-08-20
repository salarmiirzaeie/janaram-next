import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { OpenAI } from "openai";
import { ObjectId } from "mongodb";
import { User } from "@/lib/types/user";
import { withAuth } from "@/lib/middleware/withAuth";
const migrateMessages = async () => {
  const db = (await clientPromise).db("janaram-db");
  const users = db.collection("users");
  const chatHistory = db.collection("chat-history");

  const usersWithMessages = await users.find({ messages: { $exists: true, $ne: [] } }).toArray();
  for (const user of usersWithMessages) {
    const messages = user.messages.map((msg: any) => ({
      userId: user._id,
      user: msg.user,
      ai: msg.ai,
      timestamp: msg.timestamp || new Date(),
    }));
    await chatHistory.insertMany(messages);
    await users.updateOne({ _id: user._id }, { $unset: { messages: "" } });
  }
  console.log("Migration completed");
};
// Environment variable validation
const OPENROUTER_API_KEY = process.env.EXPO_PUBLIC_CHATBOT_KEY_NEW || "";
if (!OPENROUTER_API_KEY) throw new Error("OPENROUTER_API_KEY is not defined");

const client = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: OPENROUTER_API_KEY,
});

export const POST = withAuth(async (req: NextRequest, user: any) => {
  try {
    await migrateMessages();
    const { message } = await req.json();
    if (!message || typeof message !== "string") {
      return NextResponse.json({ success: false, message: "پیام نامعتبر است" }, { status: 400 });
    }

    const db = (await clientPromise).db("janaram-db");
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
    let completion;
    try {
      completion = await client.chat.completions.create({
        model: "openai/gpt-oss-20b:free",
        messages,
      });
    } catch (apiError: any) {
      console.error("OpenRouter API error:", {
        status: apiError.response?.status,
        data: apiError.response?.data,
        message: apiError.message,
      });
      if (apiError.response?.status === 429) {
        return NextResponse.json(
          { success: false, message: "حداکثر تعداد درخواست‌های روزانه برای حساب رایگان به پایان رسیده است" },
          { status: 429 }
        );
      } else if (apiError.response?.status === 524 || apiError.response?.status === 502) {
        return NextResponse.json(
          { success: false, message: "درخواست به دلیل زمان‌بندی سرور هوش مصنوعی ناموفق بود. لطفاً دوباره تلاش کنید." },
          { status: 502 }
        );
      }
      return NextResponse.json({ success: false, message: "خطا در ارتباط با هوش مصنوعی" }, { status: 500 });
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
