const BALE_API_URL = "https://tapi.bale.ai/bot";

export async function baleRequest(method: string, body: any) {
  const token = process.env.BALE_BOT_TOKEN;
  const response = await fetch(`${BALE_API_URL}${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return response.json();
}

// ایجاد اتاق گروهی جدید
export async function createGroup(title: string, members: string[]) {
  return baleRequest("createGroup", { title, members });
}

// ارسال پیام به چت
export async function sendMessage(chatId: string, text: string) {
  return baleRequest("sendMessage", { chat_id: chatId, text });
}

// ارسال پیام با دکمه
export async function sendButton(chatId: string, text: string, buttons: any[]) {
  const replyMarkup = {
    inline_keyboard: [
      buttons.map((btn) => ({ text: btn.text, callback_data: btn.data })),
    ],
  };
  return baleRequest("sendMessage", {
    chat_id: chatId,
    text,
    reply_markup: replyMarkup,
  });
}

// اضافه کردن عضو به گروه
export async function addToGroup(chatId: string, userId: string) {
  return baleRequest("addMember", { chat_id: chatId, member_id: userId });
}
