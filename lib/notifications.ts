import { getMessaging } from "firebase-admin/messaging";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { User } from "@/lib/types/user";

// Initialize Firebase Admin SDK (ensure it's initialized in your app)
import { initializeApp, applicationDefault } from "firebase-admin/app";
declare global {
  var firebaseInitialized: boolean;
}
if (!global.firebaseInitialized) {
  initializeApp({
    credential: applicationDefault(),
  });
  global.firebaseInitialized = true;
}

interface NotificationData {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

export async function sendNotification({ userId, title, body, data }: NotificationData) {
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

    // Fetch user with FCM token
    const user = await users.findOne({ _id: objectId });
    if (!user || !user.pushToken) {
      console.error("User or FCM token not found for userId:", userId);
      throw new Error("کاربر یا توکن اعلان یافت نشد");
    }

    // Prepare notification message
    const message = {
      token: user.pushToken,
      notification: {
        title,
        body,
      },
      data: data || {},
    };

    // Send notification via Firebase
    try {
      const response = await getMessaging().send(message);
      console.log("Successfully sent notification:", response);
      return {
        success: true,
        message: "اعلان با موفقیت ارسال شد",
      };
    } catch (error: any) {
      console.error("Error sending FCM notification:", error);
      throw new Error(`خطا در ارسال اعلان: ${error.message}`);
    }
  } catch (error: any) {
    console.error("Error in sendNotification:", error);
    return {
      success: false,
      message: error.message || "خطای سرور در ارسال اعلان",
    };
  }
}
export async function sendToAll({ title, body, data }: { title: string; body: string; data?: Record<string, string> }) {
  try {
    const message = {
      topic: "new-content",
      notification: {
        title,
        body,
      },
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
