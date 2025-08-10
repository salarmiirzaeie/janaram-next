import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import jwt from "jsonwebtoken";
import { User } from "@/lib/types/user";

// Environment variable validation
const JWT_SECRET = process.env.JWT_SECRET || "";
if (!JWT_SECRET) throw new Error("JWT_SECRET is not defined");

// Phone number and OTP validation
const validatePhoneNumber = (phone: string): boolean => {
  return /^(\+98|0)?9\d{9}$/.test(phone);
};
const validateOtp = (otp: string): boolean => {
  return /^\d{6}$/.test(otp);
};

export async function POST(req: Request) {
  try {
    const { phoneNumber, code: otp } = await req.json();
    console.log(phoneNumber, otp, "req");

    // Input validation
    if (!phoneNumber || !otp || !validateOtp(otp)) {
      return NextResponse.json({ success: false, message: "شماره تلفن یا کد نامعتبر است" }, { status: 400 });
    }

    const db = (await clientPromise).db("janaram-db");
    const otpRecord = await db.collection("otp_codes").findOne({
      phoneNumber,
      otp,
      verified: false,
      expiresAt: { $gt: Date.now() },
    });

    if (!otpRecord) {
      return NextResponse.json({ success: false, message: "کد نامعتبر یا منقضی شده است" }, { status: 400 });
    }

    // Mark OTP as verified
    await db.collection("otp_codes").updateOne({ _id: otpRecord._id }, { $set: { verified: true } });

    // Register or login user
    const users = db.collection<User>("users");
    let user: User | null = await users.findOne({ phoneNumber });

    const today = new Date().toISOString().split("T")[0]; // Current date for conversation tracking

    if (!user) {
      // Check if phoneNumber is linked to a Google user
      const googleUser: User | null = await users.findOne({ phoneNumber });
      if (googleUser) {
        // Link OTP to existing Google user
        await users.updateOne(
          { _id: googleUser._id },
          {
            $set: {
              phoneNumber,
              plan: googleUser.plan || "free",
              conversationCount: googleUser.conversationCount || { date: today, count: 0 },
              updatedAt: new Date(),
            },
          }
        );
        user = {
          ...googleUser,
          phoneNumber,
          plan: googleUser.plan || "free",
          conversationCount: googleUser.conversationCount || { date: today, count: 0 },
          updatedAt: new Date(),
        };
      } else {
        // Create new user
        const newUser: Omit<User, "_id"> = {
          phoneNumber,
          email: null,
          googleId: null,
          name: null,
          picture: null,
          plan: "free",
          conversationCount: { date: today, count: 0 },
          createdAt: new Date(),
          updatedAt: null,
        };
        const result = await users.insertOne(newUser);
        user = { ...newUser, _id: result.insertedId };
      }
    } else {
      // Update existing user
      await users.updateOne(
        { _id: user._id },
        {
          $set: {
            updatedAt: new Date(),
            plan: user.plan || "free",
            conversationCount: user.conversationCount || { date: today, count: 0 },
          },
        }
      );
      user = {
        ...user,
        updatedAt: new Date(),
        plan: user.plan || "free",
        conversationCount: user.conversationCount || { date: today, count: 0 },
      };
    }

    // Generate JWT
    const token = jwt.sign(
      {
        sub: user._id!.toString(), // Non-null assertion since _id is set
        phoneNumber: user.phoneNumber,
        email: user.email,
        plan: user.plan,
      },
      JWT_SECRET,
      { expiresIn: "1y" }
    );

    console.log("User authenticated via OTP:", user._id);
    return NextResponse.json({
      success: true,
      token,
      user,
    });
  } catch (err: any) {
    console.error("Error in OTP verification:", err);
    return NextResponse.json({ success: false, message: "خطای سرور" }, { status: 500 });
  }
}
