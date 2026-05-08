import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { sendMessage } from "./bale-api";

export async function handleBaleUpdate(update: any) {
  const message = update.message;
  if (!message) return;

  const chatId = message.chat.id;
  const text = message.text;
  const userId = message.from.id;

  const db = (await clientPromise).db("janaram-db");

  // پیدا کردن نوبت فعال با این گروه
  const appointment = await db.collection("appointments").findOne({
    baleGroupId: chatId,
    sessionStatus: "active",
  });

  if (appointment) {
    // ذخیره پیام در دیتابیس
    await db.collection("chat_messages").insertOne({
      appointmentId: appointment._id,
      userId: userId,
      message: text,
      sentAt: new Date(),
    });
  }

  // پردازش دستورات ساده
  if (text === "/start") {
    await sendMessage(
      chatId,
      "به ربات جانارام خوش آمدید! 🤖\nبرای دریافت راهنما /help را ارسال کنید."
    );
  }

  if (text === "/help") {
    await sendMessage(
      chatId,
      "📌 راهنما:\nشما می‌توانید از این ربات برای برقراری ارتباط با روانشناس خود استفاده کنید."
    );
  }
}
