import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { User } from "@/lib/types/user";
import { withAuth } from "@/lib/middleware/withAuth";

// Phone number validation
const validatePhoneNumber = (phone: string): boolean => {
  return /^(\+98|0)?9\d{9}$/.test(phone);
};

// Bale ID validation (optional)
const validateBaleId = (baleId?: string | null): boolean => {
  if (!baleId) return true; // optional field
  // Remove @ if present at start
  const cleanId = baleId.startsWith("@") ? baleId.substring(1) : baleId;
  // Allow letters, numbers, underscore, 3-32 characters
  return /^[a-zA-Z0-9_]{3,32}$/.test(cleanId);
};

export const PUT = withAuth(async (req: NextRequest, user: any) => {
  try {
    const { name, phoneNumber, baleId } = await req.json();

    // Validate user.sub
    if (!user?.sub) {
      console.error("No user.sub provided by withAuth middleware");
      return NextResponse.json(
        { success: false, message: "شناسه کاربر ارائه نشده است" },
        { status: 401 }
      );
    }

    // Validate inputs
    if (!name || !phoneNumber) {
      console.error("Missing name or phoneNumber:", { name, phoneNumber });
      return NextResponse.json(
        { success: false, message: "نام و شماره تلفن الزامی هستند" },
        { status: 400 }
      );
    }

    if (typeof name !== "string") {
      console.error("Invalid name type:", typeof name);
      return NextResponse.json(
        { success: false, message: "نام باید یک رشته باشد" },
        { status: 400 }
      );
    }

    if (!validatePhoneNumber(phoneNumber)) {
      console.error("Invalid phoneNumber:", phoneNumber);
      return NextResponse.json(
        { success: false, message: "شماره تلفن نامعتبر است" },
        { status: 400 }
      );
    }

    if (!validateBaleId(baleId)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "آیدی بله نامعتبر است (فقط حروف، اعداد و زیرخط، ۳ تا ۳۲ کاراکتر)",
        },
        { status: 400 }
      );
    }

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
    const users = db.collection<User>("users");

    // Check if user exists
    const userDoc = await users.findOne({ _id: userId });
    if (!userDoc) {
      console.error("User not found for _id:", userId.toString());
      return NextResponse.json(
        { success: false, message: "کاربر یافت نشد" },
        { status: 404 }
      );
    }

    // Clean baleId (remove @ if present at start)
    let cleanedBaleId = baleId;
    if (cleanedBaleId && cleanedBaleId.startsWith("@")) {
      cleanedBaleId = cleanedBaleId.substring(1);
    }

    // Prepare update object
    const updateFields: any = {
      name,
      phoneNumber,
      baleId: cleanedBaleId || null,
      updatedAt: new Date(),
    };

    // Update user in the database
    const updateResult = await users.updateOne(
      { _id: userId },
      { $set: updateFields }
    );

    if (updateResult.matchedCount === 0) {
      console.error(
        "Failed to update user, no match found for _id:",
        userId.toString()
      );
      return NextResponse.json(
        { success: false, message: "به‌روزرسانی ناموفق بود" },
        { status: 500 }
      );
    }

    // Fetch updated user data
    const updatedUser = await users.findOne(
      { _id: userId },
      { projection: { name: 1, phoneNumber: 1, picture: 1, baleId: 1, _id: 0 } }
    );

    if (!updatedUser) {
      console.error("Failed to fetch updated user for _id:", userId.toString());
      return NextResponse.json(
        { success: false, message: "خطا در بازیابی اطلاعات به‌روزرسانی‌شده" },
        { status: 500 }
      );
    }

    // Prepare response
    const response: any = {
      name: updatedUser.name!,
      phoneNumber:
        updatedUser.phoneNumber !== null ? updatedUser.phoneNumber : "",
      baleId: updatedUser.baleId || null,
    };
    if (updatedUser.picture) {
      response.profilePhoto = updatedUser.picture;
    }

    return NextResponse.json({
      success: true,
      data: response,
      message: "پروفایل شما به‌روزرسانی شد",
    });
  } catch (err: any) {
    console.error("Error in updating user profile:", err.message);
    return NextResponse.json(
      { success: false, message: err.message || "خطای سرور" },
      { status: 500 }
    );
  }
});
