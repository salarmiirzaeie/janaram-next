// import { NextRequest, NextResponse } from "next/server";
// import clientPromise from "@/lib/mongodb";
// import { OpenAI } from "openai";
// import { randomBytes } from "crypto";
// import { ObjectId } from "mongodb";
// import { User } from "@/lib/types/user";
// import { ChatHistory } from "@/lib/types/chatHistory";
// import { withAuth } from "@/lib/middleware/withAuth";

// // Environment variable validation
// const OPENROUTER_API_KEY = process.env.EXPO_PUBLIC_CHATBOT_KEY_NEW || "";
// if (!OPENROUTER_API_KEY) throw new Error("OPENROUTER_API_KEY is not defined");

// const client = new OpenAI({
//   baseURL: "https://openrouter.ai/api/v1",
//   apiKey: OPENROUTER_API_KEY,
// });

// export const POST = withAuth(async (req: NextRequest, user: any) => {
//   try {
//     const { message, conversationId } = await req.json();
//     if (!message || typeof message !== "string") {
//       return NextResponse.json({ success: false, message: "پیام نامعتبر است" }, { status: 400 });
//     }

//     const db = (await clientPromise).db("janaram-db");
//     const users = db.collection<User>("users");
//     const chatHistory = db.collection<ChatHistory>("chat_history");
//     const today = new Date().toISOString().split("T")[0];

//     // تبدیل user.sub به ObjectId
//     let userId: ObjectId;
//     try {
//       userId = new ObjectId(user.sub);
//     } catch (err) {
//       console.error("فرمت user.sub نامعتبر است:", user.sub, err);
//       return NextResponse.json({ success: false, message: "شناسه کاربر نامعتبر است" }, { status: 400 });
//     }

//     // دریافت اطلاعات کاربر
//     const userDoc = await users.findOne({ _id: userId });
//     if (!userDoc) {
//       console.error("کاربر یافت نشد برای _id:", userId.toString());
//       return NextResponse.json({ success: false, message: "کاربر یافت نشد" }, { status: 404 });
//     }

//     // بررسی محدودیت گفت‌وگو برای طرح رایگان
//     if (userDoc.plan === "free") {
//       const conversationCount = userDoc.conversationCount?.date === today ? userDoc.conversationCount.count : 0;

//       if (conversationCount >= 10) {
//         return NextResponse.json(
//           { success: false, message: "حداکثر تعداد گفت‌وگوهای روزانه برای طرح رایگان به پایان رسیده است" },
//           { status: 429 }
//         );
//       }

//       // افزایش تعداد گفت‌وگو
//       await users.updateOne(
//         { _id: userId },
//         {
//           $set: {
//             conversationCount: { date: today, count: conversationCount + 1 },
//             updatedAt: new Date(),
//           },
//         }
//       );
//     }

//     // آماده‌سازی پیام‌ها برای OpenRouter
//     let messages: { role: "system" | "user" | "assistant"; content: string }[] = [];

//     // پرامپت سیستمی (کوتاه و بهینه)
//     const systemPrompt =
//       userDoc.plan === "free"
//         ? "شما یک روانشناس حرفه‌ای هستید که در روش‌های مبتنی بر شواهد مانند درمان شناختی-رفتاری و درمان فردمحور آموزش دیده‌اید. با لحنی همدلانه و متناسب با فرهنگ ایرانی، در دو جمله پاسخ دهید که احساسات کاربر را تأیید کند و پیشنهادی سازنده ارائه دهد."
//         : `شما یک روانشناس حرفه‌ای هستید که در روش‌های مبتنی بر شواهد مانند درمان شناختی-رفتاری و درمان فردمحور آموزش دیده‌اید. با توجه به اطلاعات کاربر (نام: ${
//             userDoc.name || "کاربر"
//           }، طرح: ${
//             userDoc.plan
//           })، با لحنی همدلانه و متناسب با فرهنگ ایرانی، در دو جمله پاسخ دهید که احساسات کاربر را تأیید کند و پیشنهادی سازنده ارائه دهد.`;

//     messages.push({ role: "system", content: systemPrompt });

//     // بازیابی تاریخچه گفت‌وگو برای همه طرح‌ها
//     let newConversationId = conversationId || randomBytes(16).toString("hex");
//     if (conversationId) {
//       const existingConversation = await chatHistory.findOne({
//         userId,
//         conversationId,
//       });
//       if (existingConversation) {
//         // فقط 3 پیام آخر را اضافه کن برای صرفه‌جویی در توکن‌ها
//         const recentMessages = existingConversation.messages.slice(-3);
//         messages.push(
//           ...recentMessages.map((msg) => ({
//             role: msg.role,
//             content: msg.content,
//           }))
//         );
//       }
//     }

//     // افزودن پیام جدید کاربر
//     messages.push({ role: "user", content: message });

//     // فراخوانی API DeepSeek
//     const completion = await client.chat.completions.create({
//       model: "deepseek/deepseek-chat-v3-0324:free",
//       messages,
//     });

//     const aiResponse = completion.choices[0]?.message?.content;
//     if (!aiResponse) {
//       return NextResponse.json({ success: false, message: "پاسخی از هوش مصنوعی دریافت نشد" }, { status: 500 });
//     }

//     // ذخیره گفت‌وگو برای همه طرح‌ها
//     const newMessage: { role: "user" | "assistant"; content: string; timestamp: Date }[] = [
//       { role: "user", content: message, timestamp: new Date() },
//       { role: "assistant", content: aiResponse, timestamp: new Date() },
//     ];

//     await chatHistory.updateOne(
//       { userId, conversationId: newConversationId },
//       {
//         $push: { messages: { $each: newMessage } },
//         $set: { updatedAt: new Date() },
//         $setOnInsert: { createdAt: new Date(), userId, conversationId: newConversationId },
//       },
//       { upsert: true }
//     );

//     // برای طرح رایگان، محدود کردن تعداد گفت‌وگوها در تاریخچه
//     if (userDoc.plan === "free") {
//       const conversationCount = await chatHistory.countDocuments({ userId });
//       if (conversationCount > 10) {
//         const oldestConversations = await chatHistory
//           .find({ userId })
//           .sort({ createdAt: 1 })
//           .limit(conversationCount - 10)
//           .toArray();
//         await chatHistory.deleteMany({
//           userId,
//           conversationId: { $in: oldestConversations.map((c) => c.conversationId) },
//         });
//       }
//     }

//     return NextResponse.json({
//       success: true,
//       data: { response: aiResponse, conversationId: newConversationId },
//     });
//   } catch (err: any) {
//     console.error("خطا در گفت‌وگو:", err);
//     if (err.response?.status === 429) {
//       return NextResponse.json(
//         { success: false, message: "حداکثر تعداد درخواست‌های روزانه برای حساب رایگان OpenRouter به پایان رسیده است" },
//         { status: 429 }
//       );
//     }
//     return NextResponse.json({ success: false, message: "خطای سرور" }, { status: 500 });
//   }
// });
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

    // Convert user.sub to ObjectId
    let userId: ObjectId;
    try {
      userId = new ObjectId(user.sub);
    } catch (err) {
      console.error("Invalid user.sub format:", user.sub, err);
      return NextResponse.json({ success: false, message: "شناسه کاربر نامعتبر است" }, { status: 400 });
    }

    // Fetch user data
    const userDoc = await users.findOne({ _id: userId });
    if (!userDoc) {
      console.error("User not found for _id:", userId.toString());
      return NextResponse.json({ success: false, message: "کاربر یافت نشد" }, { status: 404 });
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
        ? "شما یک روانشناس حرفه‌ای هستید که در روش‌های مبتنی بر شواهد مانند درمان شناختی-رفتاری و درمان فردمحور آموزش دیده‌اید. با لحنی همدلانه و متناسب با فرهنگ ایرانی، در دو جمله پاسخ دهید که احساسات کاربر را تأیید کند و پیشنهادی سازنده ارائه دهد."
        : `شما یک روانشناس حرفه‌ای هستید که در روش‌های مبتنی بر شواهد مانند درمان شناختی-رفتاری و درمان فردمحور آموزش دیده‌اید. با توجه به اطلاعات کاربر (نام: ${
            userDoc.name || "کاربر"
          }، طرح: ${
            userDoc.plan
          })، با لحنی همدلانه و متناسب با فرهنگ ایرانی، در دو جمله پاسخ دهید که احساسات کاربر را تأیید کند و پیشنهادی سازنده ارائه دهد.`;

    messages.push({ role: "system", content: systemPrompt });

    // Retrieve last 3 messages (prioritizing 1 assistant and up to 2 user messages)
    let newConversationId = conversationId || randomBytes(16).toString("hex");
    let recentMessages: { role: "user" | "assistant"; content: string }[] = [];

    if (conversationId) {
      const existingConversation = await chatHistory.findOne({
        userId,
        conversationId,
      });
      if (existingConversation) {
        // Filter messages to get up to 1 assistant and up to 2 user messages
        const allMessages = existingConversation.messages;
        const assistantMessages = allMessages.filter((msg) => msg.role === "assistant").slice(-1); // Last assistant message
        const userMessages = allMessages.filter((msg) => msg.role === "user").slice(-2); // Last 2 user messages
        recentMessages = [...assistantMessages, ...userMessages]
          .sort((a, b) => {
            return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
          })
          .slice(-3); // Sort by timestamp and take last 3
        messages.push(
          ...recentMessages.map((msg) => ({
            role: msg.role,
            content: msg.content,
          }))
        );
      }
    }

    // Add new user message
    messages.push({ role: "user", content: message });

    // Log messages for debugging
    console.log("Messages sent to OpenRouter:", messages);

    // Call OpenRouter API
    let completion;
    try {
      completion = await client.chat.completions.create({
        model: "deepseek/deepseek-chat-v3-0324:free", // Verify this model exists
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
          { success: false, message: "حداکثر تعداد درخواست‌های روزانه برای حساب رایگان OpenRouter به پایان رسیده است" },
          { status: 429 }
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

    // Store conversation
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

    // Limit conversations for free plan
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
    console.error("Error in conversation:", {
      error: err.message,
      stack: err.stack,
    });
    return NextResponse.json({ success: false, message: "خطای سرور" }, { status: 500 });
  }
});
