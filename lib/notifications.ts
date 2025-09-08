import { getMessaging } from "firebase-admin/messaging";
import { initializeApp, cert } from "firebase-admin/app";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { User } from "@/lib/types/user";

declare global {
  var firebaseInitialized: boolean;
}

// Initialize Firebase Admin SDK
if (!global.firebaseInitialized) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT!);

  initializeApp({
    credential: cert(serviceAccount),
  });
  global.firebaseInitialized = true;
}

interface NotificationData {
  userId: ObjectId;
  title: string;
  body: string;
  data?: Record<string, string>;
  action?: string;
}

export async function sendNotification({ userId, title, body, data, action }: NotificationData) {
  try {
    const objectId = new ObjectId(userId);

    const db = (await clientPromise).db("janaram-db");
    const users = db.collection<User>("users");

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

    const response = await getMessaging().send(message);
    console.log("Successfully sent notification:", response);
    return { success: true, message: "اعلان با موفقیت ارسال شد" };
  } catch (error: any) {
    console.error("Error in sendNotification:", error);
    return { success: false, message: error.message || "خطای سرور در ارسال اعلان" };
  }
}

export async function sendToAll({ title, body, data }: { title: string; body: string; data?: Record<string, string> }) {
  try {
    const message = {
      topic: "new-content",
      notification: { title, body },
      data: data || {},
    };

    const response = await getMessaging().send(message);
    console.log("Sent notification to all on new-content topic:", response);
    return { success: true, message: "اعلان با موفقیت به همه کاربران ارسال شد" };
  } catch (error: any) {
    console.error("Error sending topic notification:", error);
    return { success: false, message: error.message || "خطای سرور در ارسال اعلان" };
  }
}
