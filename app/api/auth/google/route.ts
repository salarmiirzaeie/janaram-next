import { NextResponse } from "next/server";
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import clientPromise from "@/lib/mongodb";

// Initialize Google OAuth client once
const GOOGLE_CLIENT_ID = process.env.GOOGLE_WEB_CLIENT_ID;
if (!GOOGLE_CLIENT_ID) throw new Error("GOOGLE_WEB_CLIENT_ID is not defined");
const JWT_SECRET = process.env.JWT_SECRET || "";
if (!JWT_SECRET) throw new Error("JWT_SECRET is not defined");

const client = new OAuth2Client(GOOGLE_CLIENT_ID);

export async function POST(req: Request) {
  try {
    const { token } = await req.json();

    // Validate token
    if (!token || typeof token !== "string") {
      return NextResponse.json({ success: false, message: "توکن نامعتبر است" }, { status: 400 });
    }

    // Verify Google ID token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email_verified) {
      return NextResponse.json({ success: false, message: "ایمیل تأیید نشده یا توکن نامعتبر است" }, { status: 400 });
    }

    const db = (await clientPromise).db("janaram-db");
    const users = db.collection("users");

    // Find user by googleId or email
    let user = await users.findOne({
      $or: [{ googleId: payload.sub }, { email: payload.email }],
    });

    if (!user) {
      // Check if email is linked to an OTP user
      const otpUser = await users.findOne({ email: payload.email });
      if (otpUser) {
        // Link Google account to existing OTP user
        await users.updateOne(
          { _id: otpUser._id },
          {
            $set: {
              googleId: payload.sub,
              name: payload.name,
              picture: payload.picture,
              updatedAt: new Date(),
            },
          }
        );
        user = {
          ...otpUser,
          googleId: payload.sub,
          name: payload.name,
          picture: payload.picture,
          updatedAt: new Date(),
        };
      } else {
        // Create new user
        const newUser = {
          phoneNumber: null,
          email: payload.email,
          googleId: payload.sub,
          name: payload.name,
          picture: payload.picture,
          plan: "free",
          createdAt: new Date(),
          updatedAt: null,
        };
        const insertResult = await users.insertOne(newUser);
        user = { ...newUser, _id: insertResult.insertedId };
      }
    } else {
      // Update user info if changed
      await users.updateOne(
        { _id: user._id },
        {
          $set: {
            googleId: payload.sub,
            email: payload.email,
            name: payload.name,
            picture: payload.picture,
            updatedAt: new Date(),
          },
        }
      );
      user = {
        ...user,
        googleId: payload.sub,
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
        updatedAt: new Date(),
      };
    }

    // Generate JWT
    const jwtToken = jwt.sign(
      {
        sub: user._id.toString(),
        phoneNumber: user.phoneNumber,
        email: user.email,
        plan: user.plan,
      },
      JWT_SECRET,
      { expiresIn: "1y" }
    );

    console.log("User authenticated via Google:", user._id);
    return NextResponse.json({
      success: true,
      token: jwtToken,
      user,
    });
  } catch (error: any) {
    console.error("Error in Google OAuth:", error);
    return NextResponse.json({ success: false, message: "خطای سرور" }, { status: 500 });
  }
}
