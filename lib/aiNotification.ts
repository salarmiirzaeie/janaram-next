// lib/aiNotification.ts
import { OpenAI } from "openai";

const OPENROUTER_API_KEY = process.env.EXPO_PUBLIC_CHATBOT_KEY_NEW || "";
if (!OPENROUTER_API_KEY) throw new Error("OPENROUTER_API_KEY is not defined");

const client = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: OPENROUTER_API_KEY,
});

export async function generateMoodNotification(
  userName: string,
  moodLabel: string
) {
  const prompt = `
  شما یک روانشناس فارسی‌زبان مهربان هستید.
  وظیفه‌تان تولید یک متن کوتاه برای نوتیف موبایل است.
  شرایط:
  - مخاطب با نام "${userName}" شناخته می‌شود.
  - حال او امروز "${moodLabel}" است.
  - لحن باید آرام، دوستانه و امیدبخش باشد.
  - متن بین ۱ تا ۲ جمله باشد.
  - هیچ ایموجی تکراری نگذارید و هر بار طبیعی و متفاوت بنویسید.
  فقط متن نوتیف را برگردان (بدون سلام یا توضیح اضافی).
  `;

  const models = [
    "z-ai/glm-4.5-air",
    "openai/gpt-oss-20b:free",

    "z-ai/glm-4.5-air:free",
    "google/gemini-2.0-flash-exp:free",

    "meta-llama/llama-3.3-70b-instruct:free",
  ];
  for (const model of models) {
    try {
      const completion = await client.chat.completions.create({
        model,
        messages: [{ role: "user", content: prompt }],
      });
      return completion.choices[0].message?.content?.trim() || "";
    } catch (err: any) {
      console.error(
        "AI notification generation failed for model",
        model,
        err.message
      );
    }
  }

  return `${userName} جان، متاسفم که امروز ${moodLabel} هستی 💙 یادت باشه من همیشه پیشتم`;
}
