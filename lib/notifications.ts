import { getMessaging } from "firebase-admin/messaging";
import { initializeApp, cert } from "firebase-admin/app";
import { ObjectId } from "mongodb";
import clientPromise from "./mongodb";
import { User } from "./types/user";
const disableNotification = true;
declare global {
  var firebaseInitialized: boolean;
}

if (!global.firebaseInitialized) {
  const serviceAccount = {
    type: "service_account",
    project_id: "janaram",
    private_key_id: "525d66acc61124e2186b70da86bf9400380fa4f6",
    private_key: `-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCodcKcR8Q7J5q8
NNc7UphQeWydoEcogeDaxg+KEmcoaPhX1WJLYtiMZ2YBe/X0OhngJ1V9F9hY5mpd
W76TYYxnSjzQ2oP+/250QEOovEqovxAc5ALa+lOD3GOXX7nLgTvruldKxUCytTyX
EG5GjfwrbjsthVz7O5/5ZNXwHsweOGZ261XnHITBL2UDluYjS15b+vet3EbhFhcu
o8kZ/e3ufX1BcCPbndjyFNX1q1CK6koIoY7MnokN06grtwwZGLxCxP2azL4ZA974
55DLdUBTt5b82/Ipk/jZeCaq5rC7Sczd19/MZcVTHFWYFI39Hcsj4gCMFPQr9WQI
xlNpK1CRAgMBAAECggEAJuU/uJ1CY+UmTz/FFTuiEuyiRTfBTktEm0bBRkAvBM/N
zVvlrOHG/Y4PKZcRSCFVIaH7VV141LfoxaL9+uH6TMwBhDh74xffjSRcatyEwXcR
9ZW4yg4j082CSixuRdxSNUCKUKeAI3MAqSGAULaOS4nRTJafDBvteSQM2HsH5o7/
wqeSWuEliqaUR2h1+G9RY06vGYTyVsMB7Z+lJYEmJ4e55yuiCQ73WvNUvQQkgRcv
Ak7I/vCREHKhxz2U9cywDr7ZNrf+LicDJZMEQpJ42QSvg4RBtA5qlpYrzJKx+EJQ
jVbuJ+L2UnWRL7ENO/I3g0j0b/HbcddiP4NQNrugRQKBgQDS/AcKsXDCsuhu4j7f
4v4mCuGD2s0M38dmfa6A19dfjZZEz2UGGISkP+cCTJb3gVT+8FD8lx2dVV04lzT8
8k7tVy4xcGnacRhlwKuuFy/lSeoWCINW+0VlM0Mbx0TOOli4teSj7dLt3WuLj9D4
sfRhsEprTxOW3GxBaXnAgjjT9QKBgQDMZwulIl4M6cdVLRohuCyJiuUCDAfBY3Bj
RZ2wSPsCtm0SungVAgvc+RaDxY362+sKd9VaCHD2dpn8QHULuS+zJFV3AMtABrEL
zx1ufhHovFnsVH281HHQjM33hsx87JP/q34eXPmXCpE2n/+F5fADipFBjgVfKOxP
yoCqOztErQKBgQDRO7E8EIZT/5r0RBi4bWM/lPDak0VgrBgSczd4fRUQpNhOOyLj
rbL1NI5CwHPC1pbVELwwEykCW6LMOWAKLb7KLvgXfXTsddYNKsrXJhWQnQGxghXG
UAAdAX5e8PoyTrinzXMGgxb4X+qEiEZkLA7ARlU3ID+8D7KoGBLvL/VtdQKBgHnr
oQuP00+ahjZtH6ArTg2AlpbA/ENC//+Gv8ct0ONOUwMPzJ6jSNY2kVJqHQUb9jeZ
QN5iGJc6KSFIhUhH3obZTk0cYR/AngwwLxsAAcizyGNqBlIC2hyOUDCr6/870g93
iFOuG4YXXISbrPt+KsrB9WCHyPZ433O8k0B28iRFAoGBAIemjg/PhX/gT4VIxq+C
NPsyrEiGvGO06707ubellxuQjTNFX7vjx+tf8HwYGn4kHf3BuRB6dUIuIythQSGz
e43ErVEVrje1ySmMO7v9Wi11NMLLAQQhCpq/S9jggcYxm6/6WZkiZ6tRg3LvrQBL
elAUNBXJXEmME9DLefl/2R00
-----END PRIVATE KEY-----`,
    client_email: "firebase-adminsdk-fbsvc@janaram.iam.gserviceaccount.com",
    client_id: "103662496361019819068",
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url:
      "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40janaram.iam.gserviceaccount.com",
    universe_domain: "googleapis.com",
  };

  initializeApp({
    credential: cert(serviceAccount as any),
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
