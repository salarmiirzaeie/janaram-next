import { getMessaging } from "firebase-admin/messaging";
import { initializeApp, cert } from "firebase-admin/app";
import { ObjectId } from "mongodb";
import clientPromise from "./mongodb";
import { User } from "./types/user";
const disableNotification = true;
declare global {
  var firebaseInitialized: boolean;
}

/**
 * Firebase Admin is initialised lazily from the FIREBASE_SERVICE_ACCOUNT_JSON
 * environment variable (the full service-account JSON as a single string).
 * Never commit the service-account file or paste its key into source code.
 */
export function ensureFirebase(): void {
  if (global.firebaseInitialized) return;
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON is not set");
  }
  const serviceAccount = JSON.parse(raw);
  // Env vars often store newlines in the key as the two characters "\n".
  if (typeof serviceAccount.private_key === "string") {
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");
  }
  initializeApp({ credential: cert(serviceAccount) });
  global.firebaseInitialized = true;
}

interface NotificationData {
  userId: ObjectId;
  title: string;
  body: string;
  data?: Record<string, string>;
  action?: string;
}

export async function sendNotification({
  userId,
  title,
  body,
  data,
  action,
}: NotificationData) {
  if (disableNotification) {
    return;
  }
  const db = (await clientPromise).db("janaram-db");
  const users = db.collection<User>("users");
  const notifications = db.collection("notifications");

  try {
    const objectId = new ObjectId(userId);
    const user = await users.findOne({ _id: objectId });
    if (!user || !user.pushToken) {
      throw new Error("کاربر یا توکن اعلان یافت نشد");
    }

    const personalizedBody = body.replace("{name}", user.name || "دوست عزیز");

    const message = {
      token: user.pushToken,
      notification: { title, body: personalizedBody },
      data: { ...data, action: action || "OPEN_CHATBOT" },
    };

    ensureFirebase();
    const response = await getMessaging().send(message);

    // ذخیره اعلان موفق
    await notifications.insertOne({
      userId,
      title,
      body: personalizedBody,
      data,
      action,
      sentAt: new Date(),
      status: "success",
      messageId: response,
    });

    console.log("Successfully sent notification:", response);
    return { success: true, message: "اعلان با موفقیت ارسال شد" };
  } catch (error: any) {
    console.error("Error in sendNotification:", error);

    // ذخیره اعلان ناموفق
    await db.collection("notifications").insertOne({
      userId,
      title,
      body,
      data,
      action,
      sentAt: new Date(),
      status: "failed",
      error: error.message,
    });

    return {
      success: false,
      message: error.message || "خطای سرور در ارسال اعلان",
    };
  }
}

export async function sendToAll({
  title,
  body,
  data,
}: {
  title: string;
  body: string;
  data?: Record<string, string>;
}) {
  if (disableNotification) {
    return;
  }
  const db = (await clientPromise).db("janaram-db");
  const notifications = db.collection("notifications");

  try {
    const message = {
      topic: "new-content",
      notification: { title, body },
      data: data || {},
    };

    ensureFirebase();
    const response = await getMessaging().send(message);

    // ذخیره اعلان گروهی موفق
    await notifications.insertOne({
      title,
      body,
      data,
      topic: "new-content",
      sentAt: new Date(),
      status: "success",
      messageId: response,
    });

    console.log("Sent notification to all on new-content topic:", response);
    return {
      success: true,
      message: "اعلان با موفقیت به همه کاربران ارسال شد",
    };
  } catch (error: any) {
    console.error("Error sending topic notification:", error);

    // ذخیره اعلان گروهی ناموفق
    await notifications.insertOne({
      title,
      body,
      data,
      topic: "new-content",
      sentAt: new Date(),
      status: "failed",
      error: error.message,
    });

    return {
      success: false,
      message: error.message || "خطای سرور در ارسال اعلان",
    };
  }
}
