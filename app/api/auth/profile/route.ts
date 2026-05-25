import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { User } from "@/lib/types/user";
import { withAuth } from "@/lib/middleware/withAuth";

export const GET = withAuth(async (req: NextRequest, user: any) => {
  try {
    // Convert user.sub to ObjectId
    let userId: ObjectId;
    try {
      userId = new ObjectId(user.sub);
    } catch (err) {
      console.error("Invalid user.sub format:", user.sub, err);
      return NextResponse.json(
        { success: false, message: "شناسه کاربر نامعتبر است" },
        { status: 400 }
      );
    }

    // Connect to the database
    const db = (await clientPromise).db("janaram-db");
    const userDoc = await db.collection<User>("users").findOne(
      { _id: userId },
      { projection: { name: 1, phoneNumber: 1, picture: 1, baleId: 1, _id: 0 } } // اضافه کردن baleId
    );

    if (!userDoc) {
      console.error("User not found for _id:", userId.toString());
      return NextResponse.json(
        { success: false, message: "کاربر یافت نشد" },
        { status: 404 }
      );
    }

    // Prepare response, only include profilePhoto if it exists
    const response: {
      name: string | null;
      phoneNumber: string;
      baleId?: string | null;
      profilePhoto?: string | null;
    } = {
      name: userDoc.name,
      phoneNumber: userDoc.phoneNumber || "",
      baleId: userDoc.baleId || null,
    };

    if (userDoc.picture) {
      response.profilePhoto = userDoc.picture;
    }

    return NextResponse.json({ success: true, data: response });
  } catch (err: any) {
    console.error("Error in fetching user profile:", err);
    return NextResponse.json(
      { success: false, message: "خطای سرور" },
      { status: 500 }
    );
  }
});
