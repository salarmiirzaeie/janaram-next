import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { User } from "@/lib/types/user";
import { withAuth } from "@/lib/middleware/withAuth";

export const PUT = withAuth(async (req: NextRequest, user: any) => {
  try {
    const { goals, meditationTime } = await req.json();
    // Validate user.sub
    if (!user?.sub) {
      console.error("No user.sub provided by withAuth middleware");
      return NextResponse.json({ success: false, message: "شناسه کاربر ارائه نشده است" }, { status: 401 });
    }

    // Validate inputs
    if (!goals || !meditationTime) {
      return NextResponse.json({ success: false, message: "اهداف الزامی است" }, { status: 400 });
    }

    // Convert user.sub to ObjectId
    let userId: ObjectId;
    try {
      userId = new ObjectId(user.sub);
    } catch (err) {
      console.error("Invalid user.sub format:", user.sub, err);
      return NextResponse.json({ success: false, message: "شناسه کاربر نامعتبر است" }, { status: 400 });
    }

    // Connect to the database
    const db = (await clientPromise).db("janaram-db");
    const users = db.collection<User>("users");

    // Check if user exists
    const userDoc = await users.findOne({ _id: userId });
    if (!userDoc) {
      console.error("User not found for _id:", userId.toString());
      return NextResponse.json({ success: false, message: "کاربر یافت نشد" }, { status: 404 });
    }

    // Prepare update object
    const updateFields: Partial<User> = {
      goals,
      meditationTime,
      updatedAt: new Date(),
    };

    // Update user in the database
    await users.updateOne({ _id: userId }, { $set: updateFields });

    return NextResponse.json({ success: true, message: "پروفایل شما به‌روزرسانی شد  " });
  } catch (err: any) {
    console.error("Error in updating user profile:", err.message);
    return NextResponse.json({ success: false, message: err.message || "خطای سرور" }, { status: 500 });
  }
});
