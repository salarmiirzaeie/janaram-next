import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { User } from "@/lib/types/user";
import { withAuth } from "@/lib/middleware/withAuth";
import { getMessaging } from "firebase-admin/messaging";

export const POST = withAuth(async (req: NextRequest, user: any) => {
  try {
    const { pushToken } = await req.json();
    if (!pushToken) {
      return NextResponse.json({ success: false, message: "توکن اعلان الزامی است" }, { status: 400 });
    }

    let userId: ObjectId;
    try {
      userId = new ObjectId(user.sub);
    } catch (err) {
      console.error("Invalid user.sub format:", user.sub, err);
      return NextResponse.json({ success: false, message: "شناسه کاربر نامعتبر است" }, { status: 400 });
    }

    const db = (await clientPromise).db("janaram-db");
    const users = db.collection<User>("users");

    // Save the push token in DB
    const result = await users.updateOne({ _id: userId }, { $set: { pushToken, updatedAt: new Date() } });

    if (result.matchedCount === 0) {
      console.error("User not found for _id:", userId.toString());
      return NextResponse.json({ success: false, message: "کاربر یافت نشد" }, { status: 404 });
    }

    // 🔑 Subscribe the token to "new-content" topic
    await getMessaging().subscribeToTopic([pushToken], "new-content");

    return NextResponse.json({
      success: true,
      message: "توکن اعلان ذخیره و در موضوع new-content عضو شد",
    });
  } catch (err: any) {
    console.error("Error saving push token:", err);
    return NextResponse.json({ success: false, message: "خطای سرور در ذخیره توکن اعلان" }, { status: 500 });
  }
});
