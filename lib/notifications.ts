import { getMessaging } from "firebase-admin/messaging";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { User } from "@/lib/types/user";
import { initializeApp, cert } from "firebase-admin/app";

// Initialize Firebase Admin SDK once
declare global {
  var firebaseInitialized: boolean;
}
if (!global.firebaseInitialized) {
  initializeApp({
    credential: cert(JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS as string)),
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

/**
 * Send notification to a specific user
 */
export async function sendNotification({ userId, title, body, data, action }: NotificationData) {
  try {
    // Validate userId
    let objectId: ObjectId;
    try {
      objectId = new ObjectId(userId);
    } catch (err) {
      console.error("Invalid userId format:", userId, err);
      throw new Error("شناسه کاربر نامعتبر است");
    }

    // Connect to MongoDB
    const db = (await clientPromise).db("janaram-db");
    const users = db.collection<User>("users");

    // Fetch user with FCM token and name
    const user = await users.findOne({ _id: objectId });
    if (!user || !user.pushToken) {
      console.error("User or FCM token not found for userId:", userId);
      throw new Error("کاربر یا توکن اعلان یافت نشد");
    }

    // Personalize body with user's name
    const personalizedBody = body.replace("{name}", user.name || "دوست عزیز");

    // Prepare notification message
    const message = {
      token: user.pushToken,
      notification: {
        title,
        body: personalizedBody,
      },
      data: {
        ...data,
        action: action || "OPEN_CHATBOT",
      },
    };

    // Send notification via Firebase
    const response = await getMessaging().send(message);
    console.log("Successfully sent notification:", response);

    return {
      success: true,
      message: "اعلان با موفقیت ارسال شد",
    };
  } catch (error: any) {
    console.error("Error in sendNotification:", error);
    return {
      success: false,
      message: error.message || "خطای سرور در ارسال اعلان",
    };
  }
}

/**
 * Send notification to all users subscribed to a topic
 */
export async function sendToAll({ title, body, data }: { title: string; body: string; data?: Record<string, string> }) {
  try {
    const message = {
      topic: "new-content",
      notification: { title, body },
      data: data || {},
    };

    const response = await getMessaging().send(message);
    console.log("Sent notification to all on new-content topic:", response);

    return {
      success: true,
      message: "اعلان با موفقیت به همه کاربران ارسال شد",
    };
  } catch (error: any) {
    console.error("Error sending topic notification:", error);
    return {
      success: false,
      message: `خطا در ارسال اعلان: ${error.message || "خطای سرور"}`,
    };
  }
}
