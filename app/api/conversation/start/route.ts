import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { OpenAI } from "openai";
import { ObjectId } from "mongodb";
import { User } from "@/lib/types/user";
import { withAuth } from "@/lib/middleware/withAuth";

const retryRequest = async (
  fn: () => Promise<any>,
  maxAttempts = 3,
  delay = 1000
) => {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      if (attempt === maxAttempts || error.response?.status === 429)
        throw error;
      await new Promise((resolve) =>
        setTimeout(resolve, delay * Math.pow(2, attempt - 1))
      ); // Exponential backoff
    }
  }
};
const isDisableConversation = false;
// Environment variable validation
const OPENROUTER_API_KEY = process.env.EXPO_PUBLIC_CHATBOT_KEY_NEW || "";
if (!OPENROUTER_API_KEY) throw new Error("OPENROUTER_API_KEY is not defined");

const client = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: OPENROUTER_API_KEY,
  defaultHeaders: {
    "X-OpenRouter-Provider": "openai,microsoft,deepseek", // Specify allowed providers
  },
});

export const POST = withAuth(async (req: NextRequest, user: any) => {
  try {
    if (isDisableConversation) {
      return NextResponse.json({
        success: true,
        data: {
          response:
            "جانارامی عزیز، سرویس روان‌شناس هوش مصنوعی ما به‌دلیل محدودیت‌های موقتی اینترنت کشور، فعلاً در دسترس نیست. در حال پیگیری هستیم و امیدواریم به‌زودی دوباره کنار شما باشیم. ممنون از صبوری و همراهی‌تون 🌱",
        },
      });
    }

    const db = (await clientPromise).db("janaram-db");

    const { message } = await req.json();
    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { success: false, message: "پیام نامعتبر است" },
        { status: 400 }
      );
    }

    const users = db.collection<User>("users");
    const chatHistory = db.collection("chat-history");
    const today = new Date().toISOString().split("T")[0];

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

    let userDoc = await users.findOne({ _id: userId });
    if (!userDoc || !userDoc._id) {
      console.error("User not found or missing _id for user.sub:", user.sub);
      return NextResponse.json(
        { success: false, message: "کاربر یافت نشد یا شناسه معتبر نیست" },
        { status: 404 }
      );
    }

    const now = new Date();
    if (
      userDoc.plan !== "free" &&
      userDoc.subscriptionEndDate &&
      userDoc.subscriptionEndDate < now
    ) {
      await users.updateOne(
        { _id: userId },
        {
          $set: { plan: "free", updatedAt: now },
          $unset: { subscriptionEndDate: "", subscriptionDuration: "" },
        }
      );
      userDoc = await users.findOne({ _id: userId });
      if (!userDoc || !userDoc._id) {
        console.error(
          "User not found after update for _id:",
          userId.toString()
        );
        return NextResponse.json(
          { success: false, message: "کاربر یافت نشد" },
          { status: 404 }
        );
      }
    }

    let preLimitWarning: string | null = null;
    let conversationCount = 0;

    if (userDoc.plan === "free") {
      conversationCount =
        userDoc.conversationCount?.date === today
          ? userDoc.conversationCount.count
          : 0;

      // --- ۱. بهبود پیام مسدود شدن (429) ---
      if (conversationCount >= 10) {
        return NextResponse.json(
          {
            success: false,
            // متن ارتقاء یافته که بر وقفه ۲۴ ساعته و دسترسی فوری تأکید دارد
            message:
              "گفت‌وگوی شما متوقف شد. محدودیت روزانه ۱۰ گفت‌وگوی شما به پایان رسید و تا ۲۴ ساعت دیگر قابل دسترسی نیست. برای ادامه فوری و نامحدود مکالمه، لطفاً به طرح Pro ارتقاء دهید.",
          },
          { status: 429 }
        );
      }

      // if (conversationCount === 8) {
      //   preLimitWarning =
      //     "\n\n(❗️ توجه: شما فقط یک مکالمه رایگان دیگر امروز فرصت دارید. با ارتقاء به Pro، نه تنها چت نامحدود می‌گیرید، بلکه به گزارش‌های تحلیلی حال روحی‌تان هم دسترسی پیدا می‌کنید!)";
      // } else

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
    // شمارش پیام‌ها برای کنترل اینکه یکی‌در‌میان سؤال بپرسد
    const messageCount = (await chatHistory.countDocuments({ userId })) + 1;
    if (messageCount % 3 === 0 && messageCount > 8) {
      // این اخطار برای مکالمه دهم (آخرین مکالمه) نمایش داده می‌شود.
      preLimitWarning =
        "\n\nبا زدن دکمه ⚡ در پایین صفحه میتونی تحلیل شخصیتی خودت رو ببینی.";
    }
    // اگر شماره فرد است (۱، ۳، ۵، ...) سؤال بپرس، وگرنه نه
    const shouldAskQuestion = messageCount % 2 === 1;

    const questionInstruction = shouldAskQuestion
      ? "- در پایان پاسخ خود **یک سؤال ساده و انگیزشی** بپرس تا گفتگو ادامه پیدا کند."
      : "";

    const systemPrompt =
      userDoc.plan === "free"
        ? `شما یک روانشناس  فارسی زبان هوش مصنوعی هستید. 
  - پاسخ شما صرفاً باید به زبان فارسی روان باشد و از به کار بردن هرگونه کلمه انگلیسی یا فینگلیش جداً خودداری کنید.
  - پاسخ شما باید کوتاه و در حد چهار جمله باشد.
  - از کلمات ساده و عمومی و واضح برای کاربر فارسی زبان استفاده کنید.
  ${questionInstruction}
  `
        : `شما یک روانشناس فارسی زبان هوش مصنوعی حرفه‌ای و همراه کاربر هستید. 
  - پاسخ شما صرفاً باید به زبان فارسی روان باشد و از به کار بردن هرگونه کلمه انگلیسی یا فینگلیش جداً خودداری کنید.
  - نام مخاطب شما ${userDoc.name} است، از او با نامش یاد کنید تا رابطه صمیمانه‌تر شود. 
  - پاسخ‌ها باید در حد چهار جمله جمله کوتاه و مفید و واضح برای کاربر فارسی زبان باشند. 
  - هدف: ارائه راهکار عملی کوچک برای بهبود حال روحی، تمرکز بر آرامش، مدیتیشن و خودشناسی. 
  ${questionInstruction}
  - لحن شما دوستانه، حمایتگر و امیدوارکننده باشد.`;
    let messages: { role: "system" | "user" | "assistant"; content: string }[] =
      [{ role: "system", content: systemPrompt }];
    const recentMessages = await chatHistory
      .find({ userId: userId })
      .sort({ timestamp: -1 })
      .limit(2)
      .toArray();

    if (recentMessages.length > 0) {
      messages.push(
        ...recentMessages.flatMap((msg) => [
          { role: "user" as const, content: msg.user },
          { role: "assistant" as const, content: msg.ai },
        ])
      );
    }

    messages.push({ role: "user", content: message });

    const models = [
      "z-ai/glm-4.5-air",
      "openai/gpt-oss-20b:free",

      "z-ai/glm-4.5-air:free",
      "google/gemini-2.0-flash-exp:free",

      "meta-llama/llama-3.3-70b-instruct:free",
    ];
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
          // این خطا مربوط به محدودیت API است، نه محدودیت کاربر.
          return NextResponse.json(
            {
              success: false,
              message:
                "حداکثر تعداد درخواست‌های روزانه برای حساب رایگان به پایان رسیده است",
            },
            { status: 429 }
          );
        }
        if (model === models[models.length - 1]) {
          return NextResponse.json(
            {
              success: false,
              message: "خطای سرور هوش مصنوعی. لطفاً دوباره تلاش کنید.",
            },
            { status: apiError.response?.status || 502 }
          );
        }
        continue;
      }
    }

    if (
      !completion ||
      !completion.choices ||
      !Array.isArray(completion.choices) ||
      completion.choices.length === 0
    ) {
      console.error("Invalid OpenRouter response:", completion);
      return NextResponse.json(
        { success: false, message: "پاسخ نامعتبری از هوش مصنوعی دریافت شد" },
        { status: 500 }
      );
    }

    let aiResponse = completion.choices[0].message?.content;
    if (!aiResponse) {
      console.error(
        "No content in OpenRouter response:",
        completion.choices[0]
      );
      return NextResponse.json(
        { success: false, message: "پاسخی از هوش مصنوعی دریافت نشد" },
        { status: 500 }
      );
    }

    // --- افزودن اخطار پیش از محدودیت به پاسخ هوش مصنوعی ---
    if (preLimitWarning) {
      aiResponse += preLimitWarning;
    }

    // Store new conversation in chat-history collection
    const newConversation = {
      userId,
      user: message,
      ai: aiResponse,
      timestamp: new Date(),
    };
    await chatHistory.insertOne(newConversation);

    return NextResponse.json({
      success: true,
      data: { response: aiResponse, conversationCount },
    });
  } catch (err: any) {
    console.error("Error in conversation:", {
      error: err.message,
      stack: err.stack,
    });
    return NextResponse.json(
      { success: false, message: "خطای سرور" },
      { status: 500 }
    );
  }
});
