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
      );
    }
  }
};

const OPENROUTER_API_KEY = process.env.EXPO_PUBLIC_CHATBOT_KEY_NEW || "";
if (!OPENROUTER_API_KEY) throw new Error("OPENROUTER_API_KEY is not defined");

const client = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: OPENROUTER_API_KEY,
  defaultHeaders: {
    "X-OpenRouter-Provider": "openai,microsoft,deepseek",
  },
});

export const POST = withAuth(async (req: NextRequest, user: any) => {
  try {
    const db = (await clientPromise).db("janaram-db");
    const users = db.collection<User>("users");
    const chatHistory = db.collection("chat-history");
    const moods = db.collection("moods");

    const userId = new ObjectId(user.sub);
    const userDoc = await users.findOne({ _id: userId });

    if (!userDoc)
      return NextResponse.json(
        { success: false, message: "کاربر یافت نشد." },
        { status: 404 }
      );

    // --- بررسی طرح ---
    if (userDoc.plan !== "unlimited") {
      return NextResponse.json(
        {
          success: false,
          message:
            "این ویژگی مخصوص کاربران Pro است. لطفاً اشتراک خود را ارتقاء دهید.",
        },
        { status: 403 }
      );
    }

    // --- بررسی حداقل ۱۰ گفت‌وگو ---
    const chats = await chatHistory
      .find({ userId })
      .sort({ timestamp: -1 })
      .limit(30)
      .toArray();

    if (chats.length < 10) {
      return NextResponse.json(
        {
          success: false,
          message:
            "برای تحلیل شخصیت، باید حداقل ۱۰ گفت‌وگو با روانشناس انجام داده باشید.",
        },
        { status: 400 }
      );
    }

    // --- آماده‌سازی چت‌ها ---
    const conversationText = chats
      .map(
        (c, i) =>
          `گفت‌وگوی ${chats.length - i}:\nکاربر: ${c.user}\nروانشناس: ${c.ai}`
      )
      .join("\n\n");

    // --- داده‌های مود ۱۰ روز اخیر ---
    const tenDaysAgo = new Date();
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

    const moodLogs = await moods
      .find({ userId, date: { $gte: tenDaysAgo } })
      .sort({ date: -1 })
      .toArray();

    let moodSummary = "هیچ داده‌ای از مودهای اخیر یافت نشد.";
    if (moodLogs.length > 0) {
      moodSummary = moodLogs
        .map(
          (m) =>
            `${new Date(m.date).toLocaleDateString("fa-IR")}: ${m.mood}${
              m.note ? ` (${m.note})` : ""
            }`
        )
        .join("\n");
    }

    // --- سیستم پرامپت ---
    const systemPrompt = `
شما یک روانشناس حرفه‌ای و تحلیلگر شخصیت هستید. 
می‌خواهیم بر اساس الگوهای گفت‌وگو و روند مودهای اخیر، شخصیت و وضعیت احساسی کاربر را تحلیل کنید.

الزامات:
- پاسخ باید کاملاً به فارسی روان و بدون کلمه انگلیسی باشد.
- تحلیل بر اساس هر دو بخش (چت‌ها و مودها) انجام شود.
- لحن شما حرفه‌ای، دلسوزانه و امیدوارکننده باشد.

ساختار پاسخ:
۱. خلاصه تیپ شخصیتی کاربر  
۲. نقاط قوت شخصیتی  
۳. چالش‌ها یا زمینه‌های رشد  
۴. تحلیل روند احساسی ۱۰ روز گذشته (بر اساس مودها)  
۵. پیشنهادهای عملی برای تعادل روانی و رشد شخصی  
۶. جمع‌بندی نهایی با لحن آرام‌بخش
    `;

    // --- مدل‌ها با fallback ---
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
            messages: [
              { role: "system", content: systemPrompt },
              {
                role: "user",
                content: `بر اساس گفت‌وگوهای زیر و مودهای اخیر کاربر، شخصیت و روند احساسی او را تحلیل کن.\n\n--- گفت‌وگوها ---\n${conversationText}\n\n--- مودهای ۱۰ روز اخیر ---\n${moodSummary}`,
              },
            ],
          })
        );
        break;
      } catch (apiError: any) {
        console.error("OpenRouter API Error (analyze-personality):", {
          model,
          status: apiError.response?.status,
          message: apiError.message,
        });

        if (apiError.response?.status === 429) {
          return NextResponse.json(
            {
              success: false,
              message:
                "ظرفیت مدل هوش مصنوعی برای حساب رایگان به پایان رسیده است. لطفاً بعداً تلاش کنید.",
            },
            { status: 429 }
          );
        }

        if (model === models[models.length - 1]) {
          return NextResponse.json(
            {
              success: false,
              message: "خطای سرور در تحلیل شخصیت. لطفاً دوباره تلاش کنید.",
            },
            { status: 500 }
          );
        }
      }
    }

    if (
      !completion ||
      !completion.choices ||
      !completion.choices.length ||
      !completion.choices[0].message?.content
    ) {
      console.error("Invalid completion response:", completion);
      return NextResponse.json(
        {
          success: false,
          message: "پاسخ نامعتبری از مدل هوش مصنوعی دریافت شد.",
        },
        { status: 500 }
      );
    }

    const analysis = completion.choices[0].message?.content.trim();

    // --- ذخیره تحلیل ---
    await users.updateOne(
      { _id: userId },
      {
        $set: {
          lastPersonalityAnalysis: {
            text: analysis,
            date: new Date(),
            moodDataIncluded: true,
          },
        },
      }
    );

    return NextResponse.json({
      success: true,
      data: { analysis },
    });
  } catch (err: any) {
    console.error("Error in personality analysis API:", err);
    return NextResponse.json(
      { success: false, message: "خطای سرور در تحلیل شخصیت." },
      { status: 500 }
    );
  }
});
